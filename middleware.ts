import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/v1/auth",
  "/api/docs",
  "/_next",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/icon-512.png",
  "/icon.svg",
  "/images",
  "/uploads",
  "/demo",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  // 1. Rate limiting on authentication routes
  if (pathname.startsWith("/api/auth") || pathname === "/login" || pathname === "/register") {
    const authLimit = rateLimit(`auth:${ip}`, { limit: 120, windowMs: 60000 });
    if (!authLimit.success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many authentication attempts. Please retry in 1 minute." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": String(authLimit.limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // 2. General API rate limiting (100 req/min)
  if (pathname.startsWith("/api/v1")) {
    const apiLimit = rateLimit(`api:${ip}`, { limit: 120, windowMs: 60000 });
    if (!apiLimit.success) {
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded. Too many requests." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": String(apiLimit.limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // Allow static files, home page, api docs, public routes, and GET reads on v1 API for preview telemetry
  if (
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => p !== "/" && pathname.startsWith(p)) ||
    (pathname.startsWith("/api/v1/") && request.method === "GET")
  ) {
    return NextResponse.next();
  }

  // Check auth session cookie
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Protected application routes
  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized. Session required." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|favicon-.*\\.png|images).*)"],
};
