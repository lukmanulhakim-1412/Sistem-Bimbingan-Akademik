import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ShieldCheck, CalendarCheck, Clock } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "STUDENT" && !session.user.isOnboarded) {
      redirect("/onboarding");
    }
    redirect("/");
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* University branding banner */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xl shadow-blue-500/25 mb-4">
            <GraduationCap className="h-9 w-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Sistem Bimbingan Akademik
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Portal Penjadwalan Konsultasi & Bimbingan Dosen - Mahasiswa
          </p>
        </div>

        <Card className="border border-slate-200/80 shadow-lg shadow-slate-200/50">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl">Masuk ke Portal</CardTitle>
            <CardDescription>
              Gunakan akun Google universitas Anda untuk melanjutkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <GoogleSignInButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-medium">
                  Informasi Akses
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-800">Dosen:</strong> Akun yang terdaftar di konfigurasi sistem otomatis memperoleh hak akses Dosen.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CalendarCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-800">Mahasiswa:</strong> Pertama kali masuk akan diarahkan untuk mengisi profil (Nama Lengkap, Prodi, & Kelas).
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Sistem menjamin setiap slot bimbingan terkunci secara atomik untuk mencegah pemesanan ganda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} Universitas • Zero-Cost Cloud Architecture
        </p>
      </div>
    </main>
  );
}
