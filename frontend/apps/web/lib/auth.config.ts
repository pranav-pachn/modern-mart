/**
 * Edge-safe NextAuth config — NO Node.js imports here.
 *
 * This file is imported by proxy.ts which runs in Edge Runtime.
 * It must NOT import mongodb, bcryptjs, or any Node.js-only module.
 * Providers (which need the DB) live only in auth.ts.
 */
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

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
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id;
        }
        if (token.role) {
          session.user.role = token.role;
        }
      }
      return session;
    },

    /**
    * authorized() is called by proxy to decide whether a request
     * can proceed. Returning true allows, returning a Response redirects.
     */
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isAdmin = session?.user?.role === "admin";
      const { pathname } = nextUrl;

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
