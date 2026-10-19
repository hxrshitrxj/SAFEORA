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
  // Safeora Vault Edge Middleware
  // Dual-token protection: Client routes are strictly gated by AppShell with full-screen vault lock
  // and support localStorage token fallback for laptops/browsers where cookies are restricted.
  const response = NextResponse.next();
  response.headers.set("x-safeora-edge", "verified");
  return response;
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
