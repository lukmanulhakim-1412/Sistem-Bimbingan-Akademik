import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#131314] text-[#e3e3e3] p-4 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-[#1e1f20] border border-[#3c4043] p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in fade-in duration-200">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Access Denied
          </h1>
          <p className="text-xs text-[#9aa0a6] leading-relaxed">
            You do not have permission to sign in.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#282a2d] hover:bg-[#3c4043] border border-[#5f6368] text-xs font-semibold text-white py-3 px-4 transition-all shadow-sm active:scale-[0.99]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Halaman Login</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
