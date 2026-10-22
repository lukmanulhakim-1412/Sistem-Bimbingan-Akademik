"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Search,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getWhitelistedStudents,
  addAllowedStudent,
  batchAddAllowedStudents,
  deleteAllowedStudent,
  WhitelistStudentItem,
} from "@/actions/whitelist-actions";

interface StudentWhitelistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentWhitelistModal({
  isOpen,
  onClose,
}: StudentWhitelistModalProps) {
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [addMode, setAddMode] = useState<"single" | "bulk">("single");

  // Whitelist list state
  const [students, setStudents] = useState<WhitelistStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Form states
  const [singleEmail, setSingleEmail] = useState("");
  const [singleName, setSingleName] = useState("");
  const [singleNotes, setSingleNotes] = useState("");
  const [bulkText, setBulkText] = useState("");

  // Feedback states
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch whitelist data when modal opens
  const fetchStudents = async () => {
    setIsLoading(true);
    const res = await getWhitelistedStudents();
    if (res.success && res.students) {
      setStudents(res.students);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // Filtered students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.registeredUser?.fullName &&
          s.registeredUser.fullName.toLowerCase().includes(q)) ||
        (s.registeredUser?.programStudi &&
          s.registeredUser.programStudi.toLowerCase().includes(q)) ||
        (s.registeredUser?.kelas &&
          s.registeredUser.kelas.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // Count parsed emails in bulk mode
  const detectedBulkEmailsCount = useMemo(() => {
    if (!bulkText.trim()) return 0;
    const rawTokens = bulkText
      .split(/[\r\n,;\t\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = Array.from(new Set(rawTokens)).filter((e) =>
      emailRegex.test(e)
    );
    return valid.length;
  }, [bulkText]);

  // Handle single student addition
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await addAllowedStudent({
        email: singleEmail,
        name: singleName,
        notes: singleNotes,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal menambahkan mahasiswa.");
      } else {
        setSuccessMessage(res.message || "Mahasiswa berhasil ditambahkan!");
        setSingleEmail("");
        setSingleName("");
        setSingleNotes("");
        fetchStudents();
        // Switch back to list after short delay
        setTimeout(() => {
          setActiveTab("list");
        }, 800);
      }
    });
  };

  // Handle bulk emails addition
  const handleAddBulk = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await batchAddAllowedStudents(bulkText);

      if (!res.success) {
        setErrorMessage(res.error || "Gagal memproses penambahan massal.");
      } else {
        setSuccessMessage(res.message || "Mahasiswa berhasil ditambahkan!");
        setBulkText("");
        fetchStudents();
        setTimeout(() => {
          setActiveTab("list");
        }, 1200);
      }
    });
  };

  // Handle delete student
  const handleDelete = (id: string, email: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus ${email} dari whitelist?\n\nMahasiswa ini tidak akan dapat login lagi ke sistem.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteAllowedStudent(id);
      if (!res.success) {
        alert(res.error || "Gagal menghapus mahasiswa.");
      } else {
        setStudents((prev) => prev.filter((s) => s.id !== id));
      }
      setDeletingId(null);
    });
  };

  // Copy email to clipboard
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#1e1f20] border border-[#3c4043] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#e3e3e3] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#3c4043] flex items-center justify-between shrink-0 bg-[#282a2d]/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Daftar Mahasiswa Bimbingan
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[10px] px-2 py-0.5"
                >
                  Whitelist
                </Badge>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-0.5">
                Hanya email mahasiswa yang ada di daftar ini yang dapat login & mendaftar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#3c4043] px-4 sm:px-5 shrink-0 bg-[#1e1f20]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("list");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "list"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#9aa0a6] hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Daftar Mahasiswa</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#3c4043] text-[#e3e3e3]">
              {students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("add");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "add"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#9aa0a6] hover:text-white"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Tambah Mahasiswa</span>
          </button>
        </div>

        {/* Global Feedback Alert */}
        {errorMessage && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-lg bg-red-950/60 border border-red-700/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === "list" ? (
            /* TAB 1: LIST MAHASISWA */
            <div className="space-y-4">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#9aa0a6]" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari email, nama, prodi, atau kelas..."
                    className="pl-9 h-9 text-xs bg-[#282a2d] border-[#3c4043] text-white focus-visible:ring-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2 text-[#9aa0a6] hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setActiveTab("add")}
                  className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shrink-0 flex items-center gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Tambah Email</span>
                </Button>
              </div>

              {/* Students List Table */}
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#9aa0a6] gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="text-xs">Memuat daftar mahasiswa...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-[#3c4043] bg-[#282a2d]/30 p-6 space-y-3">
                  <div className="h-10 w-10 rounded-full bg-[#3c4043] text-[#9aa0a6] flex items-center justify-center mx-auto">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {searchQuery
                        ? "Tidak ada mahasiswa yang cocok dengan pencarian."
                        : "Belum ada mahasiswa dalam whitelist."}
                    </p>
                    <p className="text-xs text-[#9aa0a6] mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? "Coba gunakan kata kunci lain."
                        : "Tambahkan alamat email mahasiswa bimbingan Anda agar mereka dapat mendaftar dan memesan slot."}
                    </p>
                  </div>
                  {!searchQuery && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setActiveTab("add")}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                    >
                      Tambah Mahasiswa Sekarang
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border border-[#3c4043] rounded-xl overflow-hidden bg-[#282a2d]/40">
                  <div className="divide-y divide-[#3c4043]">
                    {filteredStudents.map((item) => {
                      const isDeleting = deletingId === item.id;
                      const hasLoggedIn = item.isRegistered;
                      const studentName =
                        item.registeredUser?.fullName || item.name;

                      return (
                        <div
                          key={item.id}
                          className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-[#303236]/60 transition-colors"
                        >
                          {/* Student Details */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs sm:text-sm text-white truncate font-mono">
                                {item.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(item.email)}
                                title="Salin Email"
                                className="text-[#9aa0a6] hover:text-white transition-colors"
                              >
                                {copiedEmail === item.email ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>

                              {/* Status Badge */}
                              {hasLoggedIn ? (
                                item.registeredUser?.isOnboarded ? (
                                  <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[10px] px-2 py-0">
                                    Aktif
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-950 text-amber-300 border border-amber-700/50 text-[10px] px-2 py-0">
                                    Belum Onboard
                                  </Badge>
                                )
                              ) : (
                                <Badge className="bg-[#3c4043] text-[#9aa0a6] text-[10px] px-2 py-0">
                                  Belum Login
                                </Badge>
                              )}
                            </div>

                            {/* Additional info: Name, Prodi, Kelas, Notes */}
                            <div className="flex items-center gap-2 text-[11px] text-[#9aa0a6] flex-wrap">
                              {studentName && (
                                <span className="text-white font-medium">
                                  {studentName}
                                </span>
                              )}
                              {item.registeredUser?.programStudi && (
                                <>
                                  <span>•</span>
                                  <span>{item.registeredUser.programStudi}</span>
                                </>
                              )}
                              {item.registeredUser?.kelas && (
                                <span>({item.registeredUser.kelas})</span>
                              )}
                              {item.notes && !item.registeredUser && (
                                <>
                                  <span>•</span>
                                  <span className="italic">{item.notes}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Delete Action Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.email)}
                            disabled={isPending || isDeleting}
                            className="p-1.5 rounded-lg text-[#9aa0a6] hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/50 transition-colors shrink-0 disabled:opacity-50"
                            title="Hapus dari Whitelist"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: TAMBAH MAHASISWA (SINGLE & BULK) */
            <div className="space-y-4">
              {/* Add Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-[#282a2d] rounded-xl border border-[#3c4043] w-fit">
                <button
                  type="button"
                  onClick={() => setAddMode("single")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    addMode === "single"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-[#9aa0a6] hover:text-white"
                  }`}
                >
                  Satu Mahasiswa
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("bulk")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    addMode === "bulk"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-[#9aa0a6] hover:text-white"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Banyak Sekaligus (Paste / Import)</span>
                </button>
              </div>

              {addMode === "single" ? (
                /* SINGLE FORM */
                <form onSubmit={handleAddSingle} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#c4c7c5] block">
                      Alamat Email Mahasiswa <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="email"
                      required
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      placeholder="contoh: budi.santoso@gmail.com"
                      className="h-10 text-xs bg-[#282a2d] border-[#3c4043] text-white focus-visible:ring-emerald-500"
                      disabled={isPending}
                    />
                    <p className="text-[11px] text-[#9aa0a6]">
                      Gunakan email Google yang digunakan mahasiswa untuk login ke portal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#c4c7c5] block">
                        Nama Mahasiswa (Opsional)
                      </label>
                      <Input
                        type="text"
                        value={singleName}
                        onChange={(e) => setSingleName(e.target.value)}
                        placeholder="Budi Santoso"
                        className="h-10 text-xs bg-[#282a2d] border-[#3c4043] text-white focus-visible:ring-emerald-500"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#c4c7c5] block">
                        Catatan / NIM / Kelas (Opsional)
                      </label>
                      <Input
                        type="text"
                        value={singleNotes}
                        onChange={(e) => setSingleNotes(e.target.value)}
                        placeholder="TI-2024 / Bimbingan TA"
                        className="h-10 text-xs bg-[#282a2d] border-[#3c4043] text-white focus-visible:ring-emerald-500"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setActiveTab("list")}
                      disabled={isPending}
                      className="text-xs h-9 text-[#9aa0a6] hover:text-white"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending || !singleEmail}
                      className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Simpan ke Whitelist</span>
                    </Button>
                  </div>
                </form>
              ) : (
                /* BULK FORM */
                <form onSubmit={handleAddBulk} className="space-y-4 pt-1">
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Paste Daftar Email Sekaligus</span>
                    </p>
                    <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                      Anda bisa langsung meng-copy kolom email dari Microsoft Excel, Google Sheets, atau grup WhatsApp. Sistem otomatis memisahkan koma, titik koma, spasi, atau baris baru dan melewati email yang sudah terdaftar.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#c4c7c5] block">
                        Daftar Alamat Email <span className="text-red-400">*</span>
                      </label>
                      {detectedBulkEmailsCount > 0 && (
                        <span className="text-[11px] text-emerald-400 font-medium">
                          Terdeteksi: {detectedBulkEmailsCount} email valid
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={6}
                      required
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={`mhs1@gmail.com\nmhs2@student.univ.ac.id, mhs3@gmail.com\nmhs4@gmail.com`}
                      className="w-full rounded-lg bg-[#282a2d] border border-[#3c4043] p-3 text-xs text-white placeholder:text-[#5f6368] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono leading-relaxed"
                      disabled={isPending}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setActiveTab("list")}
                      disabled={isPending}
                      className="text-xs h-9 text-[#9aa0a6] hover:text-white"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending || detectedBulkEmailsCount === 0}
                      className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>
                        Import {detectedBulkEmailsCount > 0 ? `${detectedBulkEmailsCount} Mahasiswa` : "Massal"}
                      </span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
