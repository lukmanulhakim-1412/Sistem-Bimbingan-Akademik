import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Sistem Bimbingan Akademik - Penjadwalan Dosen & Mahasiswa",
  description:
    "Aplikasi penjadwalan bimbingan dan konsultasi dosen-mahasiswa berbasis cloud zero-cost.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
