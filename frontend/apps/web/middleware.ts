import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req: any) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  console.log("SESSION:", session);

  // Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Protect admin
  if (pathname.startsWith("/admin")) {
    if (!session || session.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
