"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateStudentProfile } from "@/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProfileFormProps {
  initialData: {
    fullName: string;
    programStudi: string;
    kelas: string;
  };
  isLecturer?: boolean;
}

export function ProfileForm({ initialData, isLecturer = false }: ProfileFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName") as string;
    const programStudi = formData.get("programStudi") as string;
    const kelas = formData.get("kelas") as string;

    startTransition(async () => {
      const result = await updateStudentProfile(formData);

      if (!result.success) {
        setErrorMessage(result.error || "Gagal memperbarui profil.");
      } else {
        setSuccessMessage(result.message || "Profil berhasil diperbarui!");
        try {
          await update({
            user: {
              fullName,
              programStudi,
              kelas,
            },
          });
        } catch {
          // Non-blocking
        }
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <Alert variant="destructive" className="bg-red-950/40 border-red-800 text-red-200">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="bg-emerald-950/40 border-emerald-800 text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-sm font-semibold text-white">
          {isLecturer ? "Nama Lengkap & Gelar Dosen" : "Nama Lengkap Mahasiswa"}
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          defaultValue={initialData.fullName}
          placeholder={
            isLecturer
              ? "Contoh: Dr. Ir. Budi Santoso, M.Kom"
              : "Contoh: Muhammad Rizky Pratama"
          }
          required
          minLength={3}
          maxLength={100}
          disabled={isPending}
          className="bg-[#2d2f31] border-[#5f6368] text-white focus-visible:ring-blue-500 h-11"
        />
        <p className="text-xs text-[#9aa0a6]">
          {isLecturer
            ? "Nama ini akan ditampilkan pada seluruh slot bimbingan kalender akademik."
            : "Nama ini akan ditampilkan kepada Dosen saat Anda melakukan konsultasi."}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="programStudi" className="text-sm font-semibold text-white">
          {isLecturer ? "Fakultas / Departemen (Opsional)" : "Program Studi"}
        </Label>
        <Input
          id="programStudi"
          name="programStudi"
          type="text"
          defaultValue={initialData.programStudi}
          placeholder={
            isLecturer
              ? "Contoh: Fakultas Ilmu Komputer"
              : "Contoh: Teknik Informatika"
          }
          required={!isLecturer}
          minLength={isLecturer ? undefined : 2}
          maxLength={60}
          disabled={isPending}
          className="bg-[#2d2f31] border-[#5f6368] text-white focus-visible:ring-blue-500 h-11"
        />
      </div>

      {!isLecturer && (
        <div className="space-y-1.5">
          <Label htmlFor="kelas" className="text-sm font-semibold text-white">
            Kelas
          </Label>
          <Input
            id="kelas"
            name="kelas"
            type="text"
            defaultValue={initialData.kelas}
            placeholder="Contoh: TI-3A, IF-42-01"
            required
            minLength={1}
            maxLength={30}
            disabled={isPending}
            className="bg-[#2d2f31] border-[#5f6368] text-white focus-visible:ring-blue-500 h-11"
          />
          <p className="text-xs text-[#9aa0a6]">
            Contoh format kelas: TI-3A, Reguler B, atau kode kelas prodi Anda.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-[#3c4043] flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#5f6368] hover:bg-[#3c4043] text-sm text-[#e3e3e3] font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Kalender</span>
        </Link>

        <Button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 h-11 px-6 shadow-md"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Simpan Perubahan</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
