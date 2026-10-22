import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isLoginPage = nextUrl.pathname === "/login";
  const isAuthErrorPage = nextUrl.pathname === "/auth-error";
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isApiCronRoute = nextUrl.pathname.startsWith("/api/cron");

  // Rate Limiting for Authentication (10 requests / minute per client IP)
  if (isApiAuthRoute || isLoginPage) {
    const clientIp = extractClientIp(req.headers);
    const rateCheck = checkRateLimit(`auth:${clientIp}`, 60, 60);

    if (!rateCheck.success) {
      if (isApiAuthRoute) {
        return NextResponse.json(
          {
            error: `Terlalu banyak permintaan autentikasi. Silakan coba lagi setelah ${rateCheck.resetInSeconds} detik.`,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateCheck.resetInSeconds),
            },
          }
        );
      } else {
        const errorUrl = new URL("/auth-error?error=TooManyRequests", nextUrl.origin);
        return NextResponse.redirect(errorUrl);
      }
    }
  }

  // Allow Auth.js internal API calls, Cron routes, and auth error page
  if (isApiAuthRoute || isApiCronRoute || isAuthErrorPage) {
    return NextResponse.next();
  }

  // 1. Unauthenticated users trying to access protected pages
  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users visiting /login
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/cron|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico)$).*)",
  ],
};
