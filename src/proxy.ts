import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  // Integritetspolicy and användarvillkor måste vara läsbara utan
  // inloggning, bland annat för Googles granskning av OAuth-samtycket.
  const isLegalPage =
    req.nextUrl.pathname.startsWith("/integritetspolicy") ||
    req.nextUrl.pathname.startsWith("/anvandarvillkor");

  if (!isLoggedIn && !isAuthPage && !isLegalPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  // Runs on everything except static assets, app-ikonerna och auth-API:et
  // (som måste vara nåbart även utloggad).
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|manifest\\.webmanifest).*)",
  ],
};
