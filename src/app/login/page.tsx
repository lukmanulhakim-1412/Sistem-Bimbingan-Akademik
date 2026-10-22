import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { GraduationCap } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "STUDENT" && !session.user.isOnboarded) {
      redirect("/onboarding");
    }
    redirect("/");
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 select-none">
      <div className="w-full max-w-sm">
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/25 mb-3.5 border border-blue-400/30">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Sistem Bimbingan Akademik
          </h1>
          <p className="text-xs text-[#9aa0a6] mt-1.5">
            Portal Penjadwalan Konsultasi & Bimbingan
          </p>
        </div>

        {/* Minimalist Dark Mode Card */}
        <div className="rounded-2xl bg-[#1e1f20] border border-[#3c4043] shadow-2xl p-6 sm:p-7 space-y-6 text-center">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">Masuk ke Portal</h2>
            <p className="text-xs text-[#9aa0a6]">
              Gunakan akun Google yang terdaftar untuk melanjutkan
            </p>
          </div>

          <GoogleSignInButton />
        </div>

        <p className="text-center text-[11px] text-[#5f6368] mt-6">
          © {new Date().getFullYear()} Universitas
        </p>
      </div>
    </main>
  );
}
