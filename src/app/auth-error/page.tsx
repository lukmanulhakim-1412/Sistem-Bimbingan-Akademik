import { X } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#131314] text-[#e3e3e3] p-4 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-[#1e1f20] border border-[#3c4043] p-8 text-center space-y-5 shadow-2xl animate-in fade-in duration-200">
        {/* Red X Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950/60 border border-red-700/60 text-red-500 shadow-lg shadow-red-950/50">
          <X className="h-8 w-8 stroke-[2.5]" />
        </div>

        {/* Access Denied Text */}
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Access Denied
        </h1>
      </div>
    </main>
  );
}
