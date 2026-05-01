import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req, secret });

  // DEBUG: Log token to verify role is present
  console.log("TOKEN:", token);

  const { pathname } = req.nextUrl;

  // 🟢 Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // 🔴 Protect only admin  // protect admin
  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 🟢 Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
