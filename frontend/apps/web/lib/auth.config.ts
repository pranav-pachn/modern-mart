/**
 * Edge-safe NextAuth config — NO Node.js imports here.
 *
 * This file is imported by middleware.ts which runs in Edge Runtime.
 * It must NOT import mongodb, bcryptjs, or any Node.js-only module.
 * Providers (which need the DB) live only in auth.ts.
 */
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

function normalizeRole(role?: string) {
  if (role === "admin") {
    return "admin";
  }

  return "customer";
}

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
  }
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}


export const authConfig: NextAuthConfig = {
  providers: [], // Actual providers (Credentials/Google) added in auth.ts
  session: { strategy: "jwt" },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = normalizeRole(user.role);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id;
        }
        session.user.role = normalizeRole(token.role);
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      return `${baseUrl}/shop`;
    },

    /**
    * authorized() is called by middleware to decide whether a request
     * can proceed. Returning true allows, returning a Response redirects.
     */
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isAdmin = session?.user?.role === "admin";
      const { pathname } = nextUrl;
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/shop", nextUrl));
      }

      // Not logged in → redirect to /login with callback
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Logged in but not admin trying to reach /admin → redirect home
      if (pathname.startsWith("/admin") && !isAdmin) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },

  pages: { signIn: "/login" },
};
