/**
 * Full NextAuth config — Node.js runtime only.
 *
 * Spreads the Edge-safe authConfig and adds DB-dependent providers.
 * Import this ONLY in API routes (runtime: "nodejs"), never in middleware.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { authConfig } from "@/lib/auth.config";

const providers: any[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

providers.push(
  Credentials({
    credentials: {
      email: {},
      password: {},
    },
    authorize: async (credentials) => {
      if (!credentials.email || !credentials.password) return null;

      const client = await clientPromise;
      const db = client.db();
      const user = await db
        .collection("users")
        .findOne({ email: credentials.email as string });

      if (!user || !user.password) return null;

      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.password
      );

      if (isValid) {
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || "customer",
        };
      }

      return null;
    },
  })
);

const nextAuthResult = NextAuth({
  ...authConfig,
  providers,
});

export const handlers = nextAuthResult.handlers;
export const auth: any = nextAuthResult.auth;
export const signIn: any = nextAuthResult.signIn;
export const signOut: any = nextAuthResult.signOut;
