"use server";

import { z } from "zod";
import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { assertRateLimit } from "@/lib/rate-limit";

const profileSchema = z.object({
  fullName: z
    .string({ required_error: "Nama Lengkap wajib diisi" })
    .trim()
    .min(3, "Nama Lengkap minimal 3 karakter")
    .max(100, "Nama Lengkap maksimal 100 karakter"),
  programStudi: z
    .string({ required_error: "Program Studi wajib diisi" })
    .trim()
    .min(2, "Program Studi harus diisi")
    .max(60, "Program Studi maksimal 60 karakter"),
  kelas: z
    .string({ required_error: "Kelas wajib diisi" })
    .trim()
    .min(1, "Kelas harus diisi (contoh: TI-3A, IF-01)")
    .max(30, "Kelas maksimal 30 karakter"),
});

export type ProfileActionResponse = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function updateStudentProfile(
  formData: FormData
): Promise<ProfileActionResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Sesi tidak ditemukan. Silakan login kembali.",
    };
  }

  const rateCheck = await assertRateLimit("updateStudentProfile", {
    limit: 10,
    userId: session.user.id,
  });
  if (!rateCheck.success) {
    return { success: false, error: rateCheck.error };
  }

  const isLecturer = session.user.role === "LECTURER";

  let fullName = (formData.get("fullName") as string)?.trim() || "";
  let programStudi: string | null = (formData.get("programStudi") as string)?.trim() || null;
  let kelas: string | null = (formData.get("kelas") as string)?.trim() || null;

  if (isLecturer) {
    if (!fullName || fullName.length < 3 || fullName.length > 100) {
      return {
        success: false,
        error: "Nama Lengkap Dosen harus antara 3 hingga 100 karakter.",
      };
    }
  } else {
    const parsed = profileSchema.safeParse({
      fullName,
      programStudi,
      kelas,
    });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Data profil tidak valid.",
      };
    }
    fullName = parsed.data.fullName;
    programStudi = parsed.data.programStudi;
    kelas = parsed.data.kelas;
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName,
        programStudi,
        kelas,
      },
    });

    try {
      await unstable_update({
        user: {
          fullName,
          programStudi,
          kelas,
        },
      });
    } catch {
      // Non-blocking update
    }

    revalidatePath("/");
    revalidatePath("/profile");

    return {
      success: true,
      message: "Profil mahasiswa berhasil diperbarui!",
    };
  } catch (err) {
    console.error("Gagal memperbarui profil mahasiswa:", err);
    return {
      success: false,
      error: "Terjadi kesalahan internal saat menyimpan pembaruan profil.",
    };
  }
}
