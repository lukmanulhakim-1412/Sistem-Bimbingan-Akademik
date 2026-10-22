"use server";

import { z } from "zod";
import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  fullName: z
    .string({ required_error: "Nama Lengkap wajib diisi" })
    .trim()
    .min(3, "Nama Lengkap minimal 3 karakter"),
  programStudi: z
    .string({ required_error: "Program Studi wajib diisi" })
    .trim()
    .min(2, "Program Studi harus diisi"),
  kelas: z
    .string({ required_error: "Kelas wajib diisi" })
    .trim()
    .min(1, "Kelas harus diisi (contoh: TI-3A, IF-01)"),
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

  const rawData = {
    fullName: formData.get("fullName"),
    programStudi: formData.get("programStudi"),
    kelas: formData.get("kelas"),
  };

  const parsed = profileSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Data profil tidak valid.",
    };
  }

  const { fullName, programStudi, kelas } = parsed.data;

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
