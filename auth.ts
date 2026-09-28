import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

export const authConfigured = Boolean(db && process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: db
    ? DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens })
    : undefined,
  providers: [GitHub],
  session: { strategy: db ? "database" : "jwt" },
  callbacks: {
    session({ session, user }) {
      if (user) session.user.id = user.id;
      return session;
    },
  },
});
