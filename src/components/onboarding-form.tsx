"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { completeOnboarding } from "@/actions/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface OnboardingFormProps {
  initialName?: string | null;
}

export function OnboardingForm({ initialName }: OnboardingFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName") as string;
    const programStudi = formData.get("programStudi") as string;
    const kelas = formData.get("kelas") as string;

    startTransition(async () => {
      const result = await completeOnboarding(null, formData);

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      if (result.success) {
        setIsSuccess(true);
        // Refresh JWT/Session with newly saved database fields
        try {
          await update({
            user: {
              fullName,
              programStudi,
              kelas,
              isOnboarded: true,
            },
          });
        } catch {
          // Non-blocking
        }
        // Force full refresh to main dashboard
        router.refresh();
        window.location.href = "/";
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

      {isSuccess && (
        <Alert variant="success" className="bg-emerald-950/40 border-emerald-800 text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertDescription>
            Profil berhasil disimpan! Mengarahkan ke dashboard...
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-sm font-semibold text-white">
          Nama Lengkap Mahasiswa
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Contoh: Muhammad Rizky Pratama"
          defaultValue={initialName || ""}
          required
          minLength={3}
          maxLength={100}
          disabled={isPending || isSuccess}
          className="bg-[#2d2f31] border-[#5f6368] text-white placeholder:text-[#80868b] focus-visible:ring-blue-500 h-11"
        />
        <p className="text-xs text-[#9aa0a6]">
          Sesuai dengan nama di Kartu Tanda Mahasiswa (KTM).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="programStudi" className="text-sm font-semibold text-white">
          Program Studi
        </Label>
        <Input
          id="programStudi"
          name="programStudi"
          type="text"
          placeholder="Contoh: Teknik Informatika / Sistem Informasi"
          required
          minLength={2}
          maxLength={60}
          disabled={isPending || isSuccess}
          className="bg-[#2d2f31] border-[#5f6368] text-white placeholder:text-[#80868b] focus-visible:ring-blue-500 h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="kelas" className="text-sm font-semibold text-white">
          Kelas
        </Label>
        <Input
          id="kelas"
          name="kelas"
          type="text"
          placeholder="Contoh: TI-3A, IF-42-01, Reguler B"
          required
          minLength={1}
          maxLength={30}
          disabled={isPending || isSuccess}
          className="bg-[#2d2f31] border-[#5f6368] text-white placeholder:text-[#80868b] focus-visible:ring-blue-500 h-11"
        />
        <p className="text-xs text-[#9aa0a6]">
          Dosen pembimbing akan melihat info ini pada setiap slot yang Anda booking.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending || isSuccess}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 shadow-md"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Menyimpan Profil...</span>
          </>
        ) : isSuccess ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Membuka Dashboard...</span>
          </>
        ) : (
          <>
            <span>Simpan & Lanjutkan ke Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
