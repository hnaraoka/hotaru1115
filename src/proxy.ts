import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// /api/cron はセッションではなく CRON_SECRET でルート自身が認証する
const PUBLIC_PATHS = ["/login", "/api/cron"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  if (!user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (pathname === "/" && user.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin/status", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
