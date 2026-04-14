import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/shop", "/cart", "/checkout", "/ai"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  // Check if the path needs protection
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  );

  // Protect admin routes (existing admin cookie check kept)
  const isAdmin = req.cookies.get("admin");
  if (!isAdmin && nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|$).*)",
  ],
};
