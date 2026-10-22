import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isOnboarded = user.isOnboarded;
        token.fullName = user.fullName;
        token.programStudi = user.programStudi;
        token.kelas = user.kelas;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.isOnboarded = Boolean(token.isOnboarded);
        session.user.fullName = (token.fullName as string) ?? null;
        session.user.programStudi = (token.programStudi as string) ?? null;
        session.user.kelas = (token.kelas as string) ?? null;
      }
      return session;
    },
  },
};
