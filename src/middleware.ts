import { NextRequest, NextResponse } from "next/server";

// Session cookie names supported
const SESSION_COOKIE_NAME = "safeora_vault_session";
const LEGACY_COOKIE_NAME = "phoenix_vault_session";

// Protected route prefixes requiring active authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/vault",
  "/security",
  "/rehearsal",
  "/incidents",
  "/versions",
  "/settings",
  "/quarantine",
  "/nav",
];

// Auth route paths
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const sessionToken =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.cookies.get(LEGACY_COOKIE_NAME)?.value;

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // 1. If accessing protected route without session token, LOCK OUT and redirect to /login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already logged in and navigating to /login or /register, redirect to /dashboard
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (handled independently with secure HMAC/sessions)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svgs, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
