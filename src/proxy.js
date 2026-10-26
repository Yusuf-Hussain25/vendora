import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Fast redirect to /login for signed-out visitors. This only checks that a session cookie
// exists; every page and action still verifies the session and role on the server.
export function proxy(request) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = new URL("/login", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/seller/:path*", "/admin/:path*", "/rider/:path*"],
};
