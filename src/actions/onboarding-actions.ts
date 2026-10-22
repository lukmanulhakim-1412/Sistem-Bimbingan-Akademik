"use server";

import { z } from "zod";
import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { assertRateLimit } from "@/lib/rate-limit";

const onboardingSchema = z.object({
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

export type OnboardingState = {
  success?: boolean;
  error?: string;
};

export async function completeOnboarding(
  prevState: OnboardingState | null,
  formData: FormData
): Promise<OnboardingState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Sesi tidak ditemukan. Silakan login kembali." };
  }

  const rateCheck = await assertRateLimit("completeOnboarding", {
    limit: 10,
    userId: session.user.id,
  });
  if (!rateCheck.success) {
    return { error: rateCheck.error };
  }

  if (session.user.role !== "STUDENT") {
    return { error: "Hanya mahasiswa yang perlu mengisi formulir onboarding." };
  }

  const rawData = {
    fullName: formData.get("fullName"),
    programStudi: formData.get("programStudi"),
    kelas: formData.get("kelas"),
  };

  const parsed = onboardingSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message || "Data formulir tidak valid.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName: parsed.data.fullName,
        programStudi: parsed.data.programStudi,
        kelas: parsed.data.kelas,
        isOnboarded: true,
      },
    });

    try {
      await unstable_update({
        user: {
          fullName: parsed.data.fullName,
          programStudi: parsed.data.programStudi,
          kelas: parsed.data.kelas,
          isOnboarded: true,
        },
      });
    } catch {
      // Session cookie update non-blocking
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan profil onboarding:", error);
    return {
      error: "Terjadi kesalahan saat menyimpan profil ke basis data.",
    };
  }
}
