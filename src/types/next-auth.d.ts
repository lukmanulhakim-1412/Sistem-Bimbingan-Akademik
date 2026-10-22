import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      isOnboarded: boolean;
      fullName?: string | null;
      programStudi?: string | null;
      kelas?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    isOnboarded?: boolean;
    fullName?: string | null;
    programStudi?: string | null;
    kelas?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    isOnboarded?: boolean;
    fullName?: string | null;
    programStudi?: string | null;
    kelas?: string | null;
  }
}
