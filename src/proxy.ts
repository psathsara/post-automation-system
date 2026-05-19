import { NextResponse, type NextRequest } from "next/server";
import { CSRF_COOKIE, SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { isMutatingMethod, validateCsrf } from "@/lib/security/csrf";
import type { Role } from "@/types/auth";

const webhookPrefixes = ["/api/workflows/n8n"];
const protectedPrefixes = [
  "/dashboard",
  "/api/generation",
  "/api/assets",
  "/api/users",
  "/api/templates",
  "/api/workflow-settings",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function routeAllowed(pathname: string, role: Role) {
  if (pathname.startsWith("/api/users")) return can(role, "manageUsers");
  if (pathname.startsWith("/api/templates") && pathname !== "/api/templates") return can(role, "manageTemplates");
  if (pathname.startsWith("/api/workflow-settings")) return can(role, "manageWorkflows");
  if (pathname.startsWith("/dashboard/users")) return can(role, "manageUsers");
  if (pathname.startsWith("/dashboard/settings")) return can(role, "manageSystem");
  if (pathname.startsWith("/dashboard/templates")) return can(role, "manageTemplates");
  if (pathname.startsWith("/dashboard/workflows")) return can(role, "manageWorkflows");
  return can(role, "dashboard");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const isWebhook = webhookPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!request.cookies.get(CSRF_COOKIE)?.value) {
    response.cookies.set(CSRF_COOKIE, crypto.randomUUID(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  if (
    pathname.startsWith("/api/") &&
    !isWebhook &&
    isMutatingMethod(request.method) &&
    !validateCsrf(request)
  ) {
    return NextResponse.json({ error: "Invalid CSRF token." }, { status: 403 });
  }

  if (!isProtectedPath(pathname)) {
    return response;
  }

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!routeAllowed(pathname, session.role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Permission denied." }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
