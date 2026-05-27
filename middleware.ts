import { auth }          from "@/lib/auth";
import { NextResponse }  from "next/server";
import { sanitizeCallbackUrl } from "@/lib/security";

const PUBLIC_ROUTES   = ["/auth/login", "/auth/register"];
const PLATFORM_ROUTES = ["/platform"];
const ADMIN_ROUTES    = ["/admin"];
const API_PUBLIC      = ["/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session      = req.auth;

  // ── Allow public API routes ────────────────────────
  if (API_PUBLIC.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // ── Logged-in → away from auth pages ──────────────
  if (session && PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/platform/dashboard", req.url));
  }

  // ── Not logged-in → protect platform ──────────────
  if (!session && PLATFORM_ROUTES.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL("/auth/login", req.url);
    // SECURITY FIX: sanitize callbackUrl — prevent open redirect
    const rawCallback = req.nextUrl.searchParams.get("callbackUrl") ?? pathname;
    loginUrl.searchParams.set("callbackUrl", sanitizeCallbackUrl(rawCallback));
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin only ─────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/platform/dashboard", req.url));
    }
  }

  // ── Security headers on every response ────────────
  const response = NextResponse.next();

  // These are in addition to next.config.js headers
  // to ensure they're always applied at middleware level too
  response.headers.set("X-Frame-Options",        "DENY");
  response.headers.set("X-Content-Type-Options",  "nosniff");
  response.headers.set("X-XSS-Protection",        "1; mode=block");

  return response;
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
};
