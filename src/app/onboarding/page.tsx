import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, UserCheck } from "lucide-react";

// Ensure fresh DB verification on every check
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();

  // 1. Guard against unauthenticated users
  if (!session?.user) {
    redirect("/login");
  }

  // 2. Guard against lecturers (they don't need student onboarding)
  if (session.user.role === "LECTURER") {
    redirect("/");
  }

  // 3. Authoritative check: Check DB if student has already completed onboarding
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isOnboarded: true },
  });

  if (session.user.isOnboarded || dbUser?.isOnboarded) {
    redirect("/");
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg">
        {/* Branding & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1e1f20] border border-[#3c4043] text-[#8ab4f8] shadow-lg mb-4">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Lengkapi Profil Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-[#9aa0a6] mt-1.5 max-w-sm mx-auto">
            Selamat datang! Masukkan identitas akademik Anda sebelum memulai konsultasi dengan Dosen.
          </p>
        </div>

        {/* Card */}
        <Card className="bg-[#1e1f20] border-[#3c4043] text-[#e3e3e3] shadow-2xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs sm:text-sm">
              <UserCheck className="h-4 w-4" />
              <span>Verifikasi Data Akademik</span>
            </div>
            <CardTitle className="text-lg text-white">Formulir Biodata</CardTitle>
            <CardDescription className="text-xs text-[#9aa0a6]">
              Data ini akan ditampilkan kepada Dosen saat Anda melakukan booking jadwal bimbingan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm initialName={session.user.name} />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#5f6368] mt-6">
          Akun terdaftar: {session.user.email}
        </p>
      </div>
    </main>
  );
}
