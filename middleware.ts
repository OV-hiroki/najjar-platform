import { NextResponse }  from "next/server";
import type { NextRequest } from "next/server";
import { getToken }      from "next-auth/jwt";
import { sanitizeCallbackUrl } from "@/lib/security";

const PUBLIC_ROUTES   = ["/auth/login", "/auth/register"];
const PLATFORM_ROUTES = ["/platform"];
const ADMIN_ROUTES    = ["/admin"];
const API_PUBLIC      = ["/api/auth"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Use edge-compatible getToken
  const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production"
  });

  // ── Allow public API routes ────────────────────────
  if (API_PUBLIC.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // ── Logged-in → away from auth pages ──────────────
  if (token && PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/platform/dashboard", req.url));
  }

  // ── Not logged-in → protect platform ──────────────
  if (!token && PLATFORM_ROUTES.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL("/auth/login", req.url);
    // SECURITY FIX: sanitize callbackUrl — prevent open redirect
    const rawCallback = req.nextUrl.searchParams.get("callbackUrl") ?? pathname;
    loginUrl.searchParams.set("callbackUrl", sanitizeCallbackUrl(rawCallback));
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin only ─────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/platform/dashboard", req.url));
    }
  }

  // ── Security headers on every response ────────────
  const response = NextResponse.next();

  // These are in addition to next.config.js headers
  response.headers.set("X-Frame-Options",        "DENY");
  response.headers.set("X-Content-Type-Options",  "nosniff");
  response.headers.set("X-XSS-Protection",        "1; mode=block");

  return response;
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
};
