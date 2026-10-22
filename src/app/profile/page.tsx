import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, ShieldCheck, GraduationCap, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch latest user details from database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const isLecturer = dbUser.role === "LECTURER";

  if (!isLecturer && !dbUser.isOnboarded) {
    redirect("/onboarding");
  }

  const initialData = {
    fullName: dbUser.fullName || dbUser.name || "",
    programStudi: dbUser.programStudi || "",
    kelas: dbUser.kelas || "",
  };

  return (
    <div className="min-h-screen bg-[#131314] text-[#e3e3e3] flex flex-col">
      {/* Top Bar Navigation */}
      <header className="h-16 border-b border-[#3c4043] bg-[#1e1f20] px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white transition-colors"
            title="Kembali ke Kalender"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              {isLecturer ? (
                <BookOpen className="h-4 w-4" />
              ) : (
                <GraduationCap className="h-4 w-4" />
              )}
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-white">
              {isLecturer ? "Profil Dosen" : "Profil Mahasiswa"}
            </h1>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline flex items-center gap-1"
        >
          <span>← Buka Kalender</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Google Account Summary Card */}
        <Card className="bg-[#1e1f20] border-[#3c4043] text-[#e3e3e3] shadow-md">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {dbUser.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={dbUser.image}
                  alt={dbUser.name || "Avatar"}
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 rounded-full border-2 border-blue-500 shadow-md object-cover shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-blue-900/60 border border-blue-500 flex items-center justify-center text-blue-300 font-bold text-xl shrink-0">
                  <User className="h-6 w-6" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {dbUser.fullName || dbUser.name || "Akun Google"}
                  </h2>
                  <Badge className="bg-blue-600/90 text-white text-[11px] font-medium border-0">
                    {isLecturer ? "Dosen" : "Mahasiswa"}
                  </Badge>
                </div>
                <p className="text-xs text-[#9aa0a6] flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>{dbUser.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/60 self-start sm:self-auto">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Akun Terverifikasi</span>
            </div>
          </CardContent>
        </Card>

        {/* Edit Biodata Form Card */}
        <Card className="bg-[#1e1f20] border-[#3c4043] text-[#e3e3e3] shadow-lg">
          <CardHeader className="border-b border-[#3c4043] pb-4">
            <CardTitle className="text-lg font-bold text-white">
              {isLecturer
                ? "Ubah Data Akun Dosen"
                : "Ubah Data Akademik Mahasiswa"}
            </CardTitle>
            <CardDescription className="text-[#9aa0a6] text-xs">
              {isLecturer
                ? "Perbarui nama lengkap dan gelar Anda. Informasi ini akan ditampilkan pada sistem bimbingan mahasiswa."
                : "Perbarui nama lengkap, program studi, atau kelas Anda. Perubahan ini akan langsung diperbarui pada seluruh slot jadwal bimbingan Anda."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ProfileForm initialData={initialData} isLecturer={isLecturer} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
