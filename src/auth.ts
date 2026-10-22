import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { Role } from "@prisma/client";

export function isLecturerEmail(email?: string | null): boolean {
  if (!email) return false;
  const lecturerEmails = (process.env.LECTURER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lecturerEmails.includes(email.trim().toLowerCase());
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  events: {
    async createUser({ user }) {
      if (user.id && user.email && isLecturerEmail(user.email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: Role.LECTURER,
            isOnboarded: true,
          },
        });
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.trim().toLowerCase();

      // 1. Dosen selalu diizinkan masuk
      if (isLecturerEmail(email)) {
        return true;
      }

      // 2. Mahasiswa wajib terdaftar dalam daftar whitelist (AllowedStudent)
      try {
        const allowed = await prisma.allowedStudent.findUnique({
          where: { email },
        });

        if (allowed) {
          return true;
        }

        console.error(`[AUTH] Akses ditolak untuk ${email}: Belum terdaftar di whitelist.`);
        return false;
      } catch (err) {
        console.error("[AUTH] Gagal memeriksa whitelist:", err);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign-in: retrieve current DB record or sync lecturer role
        const isLecturer = isLecturerEmail(user.email);
        
        let dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });

        if (dbUser) {
          if (isLecturer && (dbUser.role !== Role.LECTURER || !dbUser.isOnboarded)) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                role: Role.LECTURER,
                isOnboarded: true,
              },
            });
          }

          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isOnboarded = dbUser.isOnboarded;
          token.fullName = dbUser.fullName;
          token.programStudi = dbUser.programStudi;
          token.kelas = dbUser.kelas;
        } else {
          token.id = user.id;
          token.role = isLecturer ? Role.LECTURER : Role.STUDENT;
          token.isOnboarded = isLecturer;
          token.fullName = null;
          token.programStudi = null;
          token.kelas = null;
        }
      } else if (token.id && !token.isOnboarded) {
        // Sync token if student was onboarded in DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isOnboarded: true, fullName: true, programStudi: true, kelas: true },
        });

        if (dbUser && dbUser.isOnboarded) {
          token.role = dbUser.role;
          token.isOnboarded = dbUser.isOnboarded;
          token.fullName = dbUser.fullName;
          token.programStudi = dbUser.programStudi;
          token.kelas = dbUser.kelas;
        }
      }

      // Handle explicit session updates (e.g., after student onboarding)
      if (trigger === "update") {
        if (session?.user) {
          if (session.user.isOnboarded !== undefined) token.isOnboarded = Boolean(session.user.isOnboarded);
          if (session.user.fullName !== undefined) token.fullName = session.user.fullName;
          if (session.user.programStudi !== undefined) token.programStudi = session.user.programStudi;
          if (session.user.kelas !== undefined) token.kelas = session.user.kelas;
        }

        if (token.id) {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
          });

          if (freshUser) {
            token.role = freshUser.role;
            token.isOnboarded = freshUser.isOnboarded;
            token.fullName = freshUser.fullName;
            token.programStudi = freshUser.programStudi;
            token.kelas = freshUser.kelas;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) || Role.STUDENT;
        session.user.isOnboarded = Boolean(token.isOnboarded);
        session.user.fullName = (token.fullName as string) ?? null;
        session.user.programStudi = (token.programStudi as string) ?? null;
        session.user.kelas = (token.kelas as string) ?? null;
      }
      return session;
    },
  },
});
