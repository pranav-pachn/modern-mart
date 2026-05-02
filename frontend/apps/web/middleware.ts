/**
 * Next.js Middleware — runs in Edge Runtime.
 *
 * Imports only from auth.config.ts (Edge-safe, no Node.js modules).
 * auth.ts (which imports mongodb/bcryptjs) is NEVER imported here.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

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
  ],
};
