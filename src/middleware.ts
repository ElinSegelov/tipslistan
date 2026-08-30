import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Every page's "Middleware already redirects signed-out visitors to /login"
// comment (see src/app/page.tsx etc.) referred to this file — it just hadn't
// been created yet, so a signed-out visit to "/" silently rendered nothing
// instead of sending you to /login. This is the fix.
//
// Everything requires a signed-in session except the paths below and
// whatever the matcher excludes (NextAuth's own routes, static assets, the
// app icons in public/).
const PUBLIC_PATHS = ["/login", "/login/kolla-mejlen", "/integritetspolicy", "/anvandarvillkor"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!req.auth && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|manifest\\.webmanifest).*)",
  ],
};
