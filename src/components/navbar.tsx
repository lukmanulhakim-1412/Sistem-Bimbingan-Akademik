import { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";
import { GraduationCap, User as UserIcon, BookOpen } from "lucide-react";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: Role;
    fullName?: string | null;
    programStudi?: string | null;
    kelas?: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  const isLecturer = user.role === Role.LECTURER;
  const displayName = user.fullName || user.name || user.email || "Pengguna";

  const studentBadgeText =
    user.programStudi && user.kelas
      ? `Mahasiswa - ${user.programStudi} ${user.kelas}`
      : user.programStudi
      ? `Mahasiswa - ${user.programStudi}`
      : "Mahasiswa";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              Sistem Bimbingan Akademik
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Portal Penjadwalan Konsultasi & Pertemuan Mahasiswa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-1.5 font-medium text-slate-900 text-sm">
              <UserIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>{displayName}</span>
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>

          <div>
            {isLecturer ? (
              <Badge className="bg-blue-600 text-white hover:bg-blue-600 font-semibold px-2.5 py-1 flex items-center gap-1 shadow-sm">
                <BookOpen className="h-3 w-3" />
                <span>Dosen</span>
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 font-medium"
              >
                {studentBadgeText}
              </Badge>
            )}
          </div>

          <div className="border-l border-slate-200 pl-2 sm:pl-3">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
