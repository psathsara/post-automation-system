import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { findDevUser } from "@/features/auth/dev-users";
import { loginSchema } from "@/features/auth/schemas";
import { hasFirebaseAdminEnv } from "@/lib/env/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions, signSession, type SessionPayload } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit/audit-log";
import type { AppUser } from "@/types/auth";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limited = rateLimit(`login:${ip}`, 8, 60_000);

  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  if (!hasFirebaseAdminEnv() && process.env.NODE_ENV !== "production") {
    const devUser = findDevUser(parsed.data.username, parsed.data.password);

    if (!devUser) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signSession({
      id: devUser.id,
      username: devUser.username,
      displayName: devUser.displayName,
      role: devUser.role,
    });

    const response = NextResponse.json({
      user: {
        sub: devUser.id,
        username: devUser.username,
        displayName: devUser.displayName,
        role: devUser.role,
      },
      mode: "development",
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

    return response;
  }

  const usernameLower = parsed.data.username.toLowerCase();
  const snapshot = await getAdminDb()
    .collection("users")
    .where("usernameLower", "==", usernameLower)
    .limit(5)
    .get();

  if (snapshot.empty) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  let matched:
    | {
        doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>;
        user: AppUser;
      }
    | null = null;

  for (const candidate of snapshot.docs) {
    const user = { id: candidate.id, ...candidate.data() } as AppUser;

    if (await verifyPassword(parsed.data.password, user.passwordHash)) {
      matched = { doc: candidate, user };
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const { doc, user } = matched;

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Account disabled." }, { status: 403 });
  }

  const sessionUser: SessionPayload = {
    sub: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
  const token = await signSession({
    id: sessionUser.sub,
    username: sessionUser.username,
    displayName: sessionUser.displayName,
    role: sessionUser.role,
  });

  await doc.ref.update({ lastLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  await writeAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "auth.login.success",
    ip,
  });

  const response = NextResponse.json({ user: sessionUser });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

  return response;
}
