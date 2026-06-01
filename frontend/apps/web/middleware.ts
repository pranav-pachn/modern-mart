import NextAuth from "next-auth";
import type { NextAuthResult } from "next-auth";
import { authConfig } from "./lib/auth.config";

const nextAuthResult: NextAuthResult = NextAuth(authConfig);

export const middleware: NextAuthResult["auth"] = nextAuthResult.auth;

export default middleware;

export const config = {
  matcher: [
    "/admin/:path*",
    "/cart",
    "/checkout",
    "/orders",
    "/profile",
    "/ai",
    "/ai-history",
    "/login",
    "/register",
  ],
};
