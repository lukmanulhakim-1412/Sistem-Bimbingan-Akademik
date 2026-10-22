import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { GraduationCap, AlertTriangle } from "lucide-react";

interface LoginPageProps {
  searchParams?: {
    error?: string;
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "STUDENT" && !session.user.isOnboarded) {
      redirect("/onboarding");
    }
    redirect("/");
  }

  const error = searchParams?.error;

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#131314] text-[#e3e3e3] p-4 select-none">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1e1f20] border border-[#3c4043] text-[#8ab4f8] shadow-lg mb-4">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Sistem Bimbingan
          </h1>
          <p className="text-xs text-[#9aa0a6] mt-1.5">
            Portal Penjadwalan Bimbingan Akademik
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[#1e1f20] border border-[#3c4043] p-6 sm:p-7 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold text-white">
              Masuk ke Akun
            </h2>
            <p className="text-xs text-[#9aa0a6]">
              Gunakan akun Google yang terdaftar untuk melanjutkan
            </p>
          </div>

          {/* Error Notification Banner if AccessDenied / other */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-red-300">
                  {error === "AccessDenied"
                    ? "Akses Ditolak"
                    : "Kendala Autentikasi"}
                </p>
                <p className="text-red-400/90 text-[11px] leading-relaxed">
                  {error === "AccessDenied"
                    ? "Email Anda belum terdaftar dalam daftar mahasiswa bimbingan yang diizinkan."
                    : "Gagal memproses autentikasi. Silakan coba kembali."}
                </p>
              </div>
            </div>
          )}

          <div className="pt-1">
            <GoogleSignInButton />
          </div>
        </div>

        <p className="text-center text-[11px] text-[#5f6368] mt-6">
          © {new Date().getFullYear()} Universitas • Sistem Bimbingan Akademik
        </p>
      </div>
    </main>
  );
}
