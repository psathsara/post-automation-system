import { jwtVerify, SignJWT } from "jose";
import type { Role, SessionUser } from "@/types/auth";

export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-erp_session" : "erp_session";
export const CSRF_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-erp_csrf" : "erp_csrf";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type SessionPayload = {
  sub: string;
  username: string;
  displayName: string;
  role: Role;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("development-only-auth-secret-change-before-production");
  }

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.displayName !== "string" ||
      !["SUPER_ADMIN", "ADMIN", "USER"].includes(String(payload.role))
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      username: payload.username,
      displayName: payload.displayName,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
