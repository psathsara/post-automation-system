import { type NextRequest } from "next/server";
import { CSRF_COOKIE } from "@/lib/auth/session";

export function isMutatingMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}

export function validateCsrf(request: NextRequest) {
  const csrfCookie = request.cookies.get(CSRF_COOKIE)?.value;
  const csrfHeader = request.headers.get("x-csrf-token");

  return Boolean(csrfCookie && csrfHeader && csrfCookie === csrfHeader);
}
