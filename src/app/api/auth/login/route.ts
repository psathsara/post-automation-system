import { NextResponse, type NextRequest } from "next/server";
import { findDevUser } from "@/features/auth/dev-users";
import { loginSchema } from "@/features/auth/schemas";
import { rateLimit } from "@/lib/security/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions, signSession, type SessionPayload } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";
import type { AppUser } from "@/types/auth";

type SupabaseUserRow = {
  id: string;
  username: string;
  username_lower: string;
  display_name: string;
  role: AppUser["role"];
  status: AppUser["status"];
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

function mapSupabaseUser(row: SupabaseUserRow): AppUser {
  return {
    id: row.id,
    username: row.username,
    usernameLower: row.username_lower,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at ?? undefined,
  };
}

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

  if (!hasSupabaseAdminEnv() && process.env.NODE_ENV !== "production") {
    const devUser = findDevUser(parsed.data.username, parsed.data.password);

    if (!devUser || devUser.status !== "ACTIVE") {
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
  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from<SupabaseUserRow[]>("users")
    .select(
      "id, username, username_lower, display_name, role, status, password_hash, created_at, updated_at, last_login_at",
    )
    .eq("username_lower", usernameLower)
    .limit(5);

  if (error) {
    return NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  let matched: AppUser | null = null;

  for (const row of rows) {
    const user = mapSupabaseUser(row);

    if (await verifyPassword(parsed.data.password, user.passwordHash)) {
      matched = user;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const user = matched;

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

  const now = new Date().toISOString();
  await supabase.from("users").update({ last_login_at: now, updated_at: now }).eq("id", user.id);
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
