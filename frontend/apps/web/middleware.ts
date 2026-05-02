export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // If user is not logged in, redirect to login
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes - only admins allowed
  if (pathname.startsWith("/admin")) {
    if (session.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // All other protected routes are accessible to any logged-in user
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/cart",
    "/checkout",
    "/orders",
    "/profile",
    "/ai",
    "/ai-history",
  ],
};
