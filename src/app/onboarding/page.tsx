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
    <main className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 mb-3">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Lengkapi Profil Mahasiswa
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
            Selamat datang! Masukkan identitas akademik Anda sebelum memulai konsultasi dengan Dosen.
          </p>
        </div>

        <Card className="border-slate-200 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
              <UserCheck className="h-4 w-4" />
              <span>Verifikasi Data Akademik</span>
            </div>
            <CardTitle className="text-lg">Formulir Biodata</CardTitle>
            <CardDescription>
              Data ini akan ditampilkan kepada Dosen saat Anda melakukan booking jadwal bimbingan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm initialName={session.user.name} />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          Akun: {session.user.email}
        </p>
      </div>
    </main>
  );
}
