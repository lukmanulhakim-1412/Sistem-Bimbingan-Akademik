"use client";

import { useState, useTransition, useEffect } from "react";
import { createSlot } from "@/actions/slot-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate, getWIBParts } from "@/lib/utils";
import {
  X,
  Loader2,
  CalendarPlus,
  Video,
  MapPin,
  Repeat,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Ban,
  Calendar,
} from "lucide-react";
import { MeetingType } from "@prisma/client";

interface CreateSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  initialHour?: number | null;
}

export function CreateSlotModal({
  isOpen,
  onClose,
  initialDate,
  initialHour,
}: CreateSlotModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mode: "slot" (consultation slot for students) vs "block" (block time/busy)
  const [slotMode, setSlotMode] = useState<"slot" | "block">("slot");

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [meetingType, setMeetingType] = useState<MeetingType>(MeetingType.ONLINE);
  const [locationDetails, setLocationDetails] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeksCount, setRepeatWeeksCount] = useState<number>(12);

  // Initialize form when opened or initial values change
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSlotMode("slot");

      const p = getWIBParts(initialDate || new Date());
      const year = p.year;
      const month = String(p.month + 1).padStart(2, "0");
      const day = String(p.day).padStart(2, "0");
      setDate(`${year}-${month}-${day}`);

      if (initialHour !== null && initialHour !== undefined) {
        setStartTime(`${String(initialHour).padStart(2, "0")}:00`);
      } else {
        setStartTime("09:00");
      }

      setMeetingType(MeetingType.ONLINE);
      setLocationDetails("");
      setBlockReason("");
      setRepeatWeekly(false);
      setRepeatWeeksCount(12);
    }
  }, [isOpen, initialDate, initialHour]);

  if (!isOpen) return null;

  // Calculate preview dates (using WIB timezone)
  const currentSlotDate = date ? new Date(`${date}T00:00:00+07:00`) : null;
  const dayName = currentSlotDate
    ? new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(currentSlotDate)
    : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("date", date);
    formData.append("startTime", startTime);
    formData.append("type", meetingType);
    formData.append("locationDetails", locationDetails);

    if (slotMode === "block") {
      formData.append("isBlocked", "true");
      formData.append("blockReason", blockReason || "Dosen Sibuk / Rapat");
    }

    if (repeatWeekly) {
      formData.append("repeatWeekly", "true");
      formData.append("repeatWeeksCount", String(repeatWeeksCount));
    }

    startTransition(async () => {
      const result = await createSlot(formData);
      if (!result.success) {
        setErrorMessage(result.error || "Gagal membuat slot.");
      } else {
        setSuccessMessage(result.message || "Slot berhasil dibuat!");
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#1e1f20] border border-[#3c4043] shadow-2xl text-[#e3e3e3] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#3c4043] flex items-center justify-between bg-[#282a2d]">
          <div className="flex items-center gap-2.5 font-bold text-white text-base">
            {slotMode === "slot" ? (
              <CalendarPlus className="h-5 w-5 text-blue-400" />
            ) : (
              <Ban className="h-5 w-5 text-amber-400" />
            )}
            <span>
              {slotMode === "slot"
                ? "Tambah Slot Bimbingan (1 Jam)"
                : "Blokir Jadwal (Dosen Sibuk / Rapat)"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#2d2f31] border border-[#3c4043]">
            <button
              type="button"
              onClick={() => setSlotMode("slot")}
              disabled={isPending}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                slotMode === "slot"
                  ? "bg-blue-600 text-white shadow"
                  : "text-[#9aa0a6] hover:text-white"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Slot Bimbingan (Tersedia)</span>
            </button>
            <button
              type="button"
              onClick={() => setSlotMode("block")}
              disabled={isPending}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                slotMode === "block"
                  ? "bg-amber-600/90 text-white shadow"
                  : "text-[#9aa0a6] hover:text-white"
              }`}
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Blokir Waktu (Sibuk / Rapat)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {errorMessage && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-200">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" className="bg-emerald-950/50 border-emerald-800 text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Date & Start Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="modalDate" className="text-xs text-[#c4c7c5]">
                Tanggal
              </Label>
              <Input
                id="modalDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={isPending}
                className="bg-[#2d2f31] border-[#5f6368] text-white focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modalTime" className="text-xs text-[#c4c7c5]">
                Waktu Mulai (WIB)
              </Label>
              <Input
                id="modalTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={isPending}
                className="bg-[#2d2f31] border-[#5f6368] text-white focus-visible:ring-blue-500"
              />
            </div>
          </div>

          {/* Conditional Fields based on slotMode */}
          {slotMode === "slot" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="modalType" className="text-xs text-[#c4c7c5]">
                  Tipe Pertemuan
                </Label>
                <Select
                  id="modalType"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                  disabled={isPending}
                  className="bg-[#2d2f31] border-[#5f6368] text-white focus-visible:ring-blue-500"
                >
                  <option value={MeetingType.ONLINE}>Online</option>
                  <option value={MeetingType.OFFLINE}>Offline - Tatap Muka di Kampus</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modalLocation" className="text-xs text-[#c4c7c5]">
                  {meetingType === MeetingType.ONLINE ? "Tautan Pertemuan Online" : "Lokasi / Ruangan"}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9aa0a6]">
                    {meetingType === MeetingType.ONLINE ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </div>
                  <Input
                    id="modalLocation"
                    type="text"
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    maxLength={300}
                    placeholder={
                      meetingType === MeetingType.ONLINE
                        ? "https://meet.google.com/... atau tautan online"
                        : "Ruang Dosen 304, Gedung A"
                    }
                    disabled={isPending}
                    className="pl-9 bg-[#2d2f31] border-[#5f6368] text-white focus-visible:ring-blue-500 text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Blocked Mode: Reason */
            <div className="space-y-1.5">
              <Label htmlFor="modalBlockReason" className="text-xs text-[#c4c7c5]">
                Alasan Blokir Waktu (Opsional)
              </Label>
              <Input
                id="modalBlockReason"
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                maxLength={150}
                placeholder="Contoh: Rapat Jurusan, Mengajar Kuliah, Urusan Dinas"
                disabled={isPending}
                className="bg-[#2d2f31] border-[#5f6368] text-white focus-visible:ring-amber-500 text-xs"
              />
              <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5 pt-0.5">
                <Ban className="h-3.5 w-3.5 shrink-0" />
                <span>Slot pada jam ini akan terkunci dan tidak dapat dibooking oleh mahasiswa.</span>
              </p>
            </div>
          )}

          {/* Repeat Weekly Schedule Option */}
          <div className="rounded-xl border border-[#3c4043] bg-[#282a2d] p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatWeekly}
                  onChange={(e) => setRepeatWeekly(e.target.checked)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-[#5f6368] bg-[#2d2f31] text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                  <Repeat className="h-4 w-4 text-blue-400" />
                  <span>Ulangi Setiap Minggu (Weekly)</span>
                </span>
              </label>

              {repeatWeekly && (
                <div className="flex items-center gap-2 pl-6 sm:pl-0">
                  <span className="text-xs text-[#9aa0a6]">Durasi:</span>
                  <Select
                    value={String(repeatWeeksCount)}
                    onChange={(e) => setRepeatWeeksCount(Number(e.target.value))}
                    disabled={isPending}
                    className="h-8 text-xs bg-[#1e1f20] border-[#5f6368] text-white w-36"
                  >
                    <option value="4">4 Minggu (1 Bulan)</option>
                    <option value="8">8 Minggu (2 Bulan)</option>
                    <option value="12">12 Minggu (1 Semester)</option>
                    <option value="16">16 Minggu (4 Bulan)</option>
                  </Select>
                </div>
              )}
            </div>

            {repeatWeekly && currentSlotDate && (
              <div className="text-[11px] text-blue-300 bg-blue-950/40 p-2.5 rounded-lg border border-blue-800/50 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-200">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Informasi Pengulangan Mingguan:</span>
                </div>
                <div>
                  Jadwal akan otomatis dibuat setiap hari <strong>{dayName}</strong> pukul{" "}
                  <strong>{startTime} WIB</strong> selama <strong>{repeatWeeksCount} minggu berturut-turut</strong>.
                </div>
                <div className="text-[10px] text-blue-400">
                  • Dapat dibatalkan/dihapus berseri untuk seluruh minggu berikutnya kapan saja.
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#3c4043] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="bg-transparent border-[#5f6368] text-white hover:bg-[#3c4043]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={`${
                slotMode === "slot"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-amber-600 hover:bg-amber-700"
              } text-white font-medium px-5`}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{slotMode === "slot" ? "Simpan Jadwal" : "Blokir Jadwal"}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
