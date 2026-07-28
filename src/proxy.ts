import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth gate (Next 16 Proxy, formerly Middleware).
 *
 * Redirects requests without a Supabase session cookie to /login. This is a
 * cheap presence check only - authoritative identity and role checks run in
 * server components (getSessionUser / requireUser / requireAdmin). Keeping the
 * proxy free of a Supabase client avoids the realtime WebSocket dependency and
 * follows the Next docs' guidance that proxy do optimistic checks only.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/login" || pathname.startsWith("/auth");
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token"));

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (hasSession && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
