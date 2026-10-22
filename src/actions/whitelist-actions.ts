"use server";

import { auth, isLecturerEmail } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface WhitelistStudentItem {
  id: string;
  email: string;
  name: string | null;
  notes: string | null;
  createdAt: string;
  isRegistered: boolean;
  registeredUser: {
    fullName: string | null;
    programStudi: string | null;
    kelas: string | null;
    isOnboarded: boolean;
  } | null;
}

export interface WhitelistActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fetch all whitelisted students (LECTURER ONLY)
 */
export async function getWhitelistedStudents(): Promise<{
  success: boolean;
  error?: string;
  students?: WhitelistStudentItem[];
}> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang berhak mengakses daftar mahasiswa.",
    };
  }

  try {
    const allowed = await prisma.allowedStudent.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (allowed.length === 0) {
      return { success: true, students: [] };
    }

    const emails = allowed.map((a) => a.email.toLowerCase());

    const registeredUsers = await prisma.user.findMany({
      where: {
        email: { in: emails },
      },
      select: {
        email: true,
        name: true,
        fullName: true,
        programStudi: true,
        kelas: true,
        isOnboarded: true,
      },
    });

    const userMap = new Map<string, (typeof registeredUsers)[0]>();
    for (const u of registeredUsers) {
      userMap.set(u.email.toLowerCase(), u);
    }

    const students: WhitelistStudentItem[] = allowed.map((item) => {
      const regUser = userMap.get(item.email.toLowerCase());
      return {
        id: item.id,
        email: item.email,
        name: item.name,
        notes: item.notes,
        createdAt: item.createdAt.toISOString(),
        isRegistered: !!regUser,
        registeredUser: regUser
          ? {
              fullName: regUser.fullName || regUser.name,
              programStudi: regUser.programStudi,
              kelas: regUser.kelas,
              isOnboarded: regUser.isOnboarded,
            }
          : null,
      };
    });

    return { success: true, students };
  } catch (err) {
    console.error("Gagal mengambil daftar whitelist:", err);
    return { success: false, error: "Gagal memuat daftar mahasiswa." };
  }
}

/**
 * Add a single student to whitelist (LECTURER ONLY)
 */
export async function addAllowedStudent({
  email,
  name,
  notes,
}: {
  email: string;
  name?: string;
  notes?: string;
}): Promise<WhitelistActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang berhak menambah mahasiswa.",
    };
  }

  const cleanEmail = email?.trim().toLowerCase();

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return {
      success: false,
      error: "Format alamat email tidak valid.",
    };
  }

  if (isLecturerEmail(cleanEmail)) {
    return {
      success: false,
      error: "Email ini terdaftar sebagai akun Dosen, tidak perlu ditambahkan ke whitelist mahasiswa.",
    };
  }

  try {
    const existing = await prisma.allowedStudent.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return {
        success: false,
        error: `Email ${cleanEmail} sudah ada di dalam daftar whitelist.`,
      };
    }

    await prisma.allowedStudent.create({
      data: {
        email: cleanEmail,
        name: name?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: `Mahasiswa (${cleanEmail}) berhasil ditambahkan ke whitelist!`,
    };
  } catch (err) {
    console.error("Gagal menambah mahasiswa:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menambahkan mahasiswa ke sistem.",
    };
  }
}

/**
 * Batch add multiple students by pasting emails (LECTURER ONLY)
 */
export async function batchAddAllowedStudents(
  rawText: string
): Promise<WhitelistActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang berhak menambah mahasiswa.",
    };
  }

  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      error: "Mohon masukkan setidaknya satu alamat email.",
    };
  }

  // Split by newlines, commas, semicolons, tabs, spaces
  const rawTokens = rawText
    .split(/[\r\n,;\t\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Filter valid email formats & remove duplicates in the input
  const uniqueCandidateEmails = Array.from(new Set(rawTokens)).filter((e) =>
    EMAIL_REGEX.test(e)
  );

  if (uniqueCandidateEmails.length === 0) {
    return {
      success: false,
      error: "Tidak ditemukan format email yang valid pada teks yang Anda masukkan.",
    };
  }

  // Filter out lecturer emails
  const validEmails = uniqueCandidateEmails.filter((e) => !isLecturerEmail(e));

  try {
    // Find already existing in whitelist
    const existingRecords = await prisma.allowedStudent.findMany({
      where: {
        email: { in: validEmails },
      },
      select: { email: true },
    });

    const existingSet = new Set(existingRecords.map((r) => r.email.toLowerCase()));
    const newEmails = validEmails.filter((e) => !existingSet.has(e));

    if (newEmails.length === 0) {
      return {
        success: false,
        error: `Semua ${validEmails.length} email yang Anda masukkan sudah terdaftar di whitelist.`,
      };
    }

    await prisma.allowedStudent.createMany({
      data: newEmails.map((email) => ({
        email,
        notes: "Import Massal",
      })),
      skipDuplicates: true,
    });

    revalidatePath("/");

    return {
      success: true,
      message: `Berhasil menambahkan ${newEmails.length} mahasiswa baru ke whitelist!${
        existingSet.size > 0
          ? ` (${existingSet.size} email dilewati karena sudah terdaftar)`
          : ""
      }`,
      data: {
        addedCount: newEmails.length,
        skippedCount: existingSet.size,
      },
    };
  } catch (err) {
    console.error("Gagal batch import whitelist:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat memproses penambahan massal.",
    };
  }
}

/**
 * Remove student from whitelist (LECTURER ONLY)
 */
export async function deleteAllowedStudent(
  id: string
): Promise<WhitelistActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang berhak menghapus mahasiswa.",
    };
  }

  if (!id) {
    return {
      success: false,
      error: "ID Mahasiswa tidak valid.",
    };
  }

  try {
    const student = await prisma.allowedStudent.delete({
      where: { id },
    });

    revalidatePath("/");
    return {
      success: true,
      message: `Email ${student.email} berhasil dihapus dari daftar whitelist.`,
    };
  } catch (err) {
    console.error("Gagal menghapus mahasiswa whitelist:", err);
    return {
      success: false,
      error: "Gagal menghapus mahasiswa dari daftar whitelist.",
    };
  }
}
