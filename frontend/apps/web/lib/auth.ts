import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

const providers = [];

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
      const user = await db.collection("users").findOne({ email: credentials.email as string });

      if (!user || !user.password) {
        return null;
      }

      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(credentials.password as string, user.password);

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

const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers,
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const nextAuthResult = NextAuth(authOptions);

export const handlers = nextAuthResult.handlers;
export const auth: any = nextAuthResult.auth;
export const signIn: any = nextAuthResult.signIn;
export const signOut: any = nextAuthResult.signOut;
