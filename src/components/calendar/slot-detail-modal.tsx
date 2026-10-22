"use client";

import { useState, useTransition } from "react";
import { SlotWithBookedBy, UserSessionInfo } from "./types";
import { Role, MeetingType } from "@prisma/client";
import { bookSlot, unassignSlot, deleteSlot } from "@/actions/slot-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTimeRange } from "@/lib/utils";
import {
  X,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  UserCheck,
  CalendarCheck,
  UserMinus,
  Trash2,
  Loader2,
  AlertCircle,
  Info,
  Lock,
} from "lucide-react";

interface SlotDetailModalProps {
  slot: SlotWithBookedBy | null;
  isOpen: boolean;
  onClose: () => void;
  user: UserSessionInfo;
}

export function SlotDetailModal({
  slot,
  isOpen,
  onClose,
  user,
}: SlotDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !slot) return null;

  const isLecturer = user.role === Role.LECTURER;
  const isBooked = !!slot.bookedById;
  const isBookedByMe = slot.bookedById === user.id;
  const isBookedByOther = isBooked && !isBookedByMe;
  const student = slot.bookedBy;

  const handleBooking = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await bookSlot(slot.id);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal membooking slot.");
      } else {
        setSuccessMessage("Jadwal berhasil dibooking!");
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    });
  };

  const handleUnassign = () => {
    setErrorMessage(null);
    if (
      !confirm(
        "Apakah Anda yakin ingin membatalkan booking mahasiswa pada slot ini? Slot akan kembali tersedia."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await unassignSlot(slot.id);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal membatalkan booking.");
      } else {
        setSuccessMessage("Booking berhasil dibatalkan. Slot kembali tersedia.");
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    });
  };

  const handleDelete = () => {
    setErrorMessage(null);
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    startTransition(async () => {
      const res = await deleteSlot(slot.id);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal menghapus slot.");
      } else {
        setSuccessMessage("Slot jadwal berhasil dihapus.");
        setTimeout(() => {
          onClose();
        }, 800);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#1e1f20] border border-[#3c4043] shadow-2xl text-[#e3e3e3] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-4 bg-[#282a2d] border-b border-[#3c4043] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {slot.type === MeetingType.ONLINE ? (
              <Badge className="bg-sky-900/80 text-sky-300 border border-sky-700/60 font-medium text-xs flex items-center gap-1">
                <Video className="h-3 w-3" />
                <span>Online (MS Teams)</span>
              </Badge>
            ) : (
              <Badge className="bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 font-medium text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Offline (Tatap Muka)</span>
              </Badge>
            )}

            {isBooked ? (
              <Badge className="bg-blue-600 text-white font-medium text-xs">
                {isBookedByMe ? "Jadwal Anda" : "Sudah Dibooking"}
              </Badge>
            ) : (
              <Badge className="bg-emerald-600 text-white font-medium text-xs">
                Tersedia
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Event Body Content */}
        <div className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 flex items-start gap-2">
              <CalendarCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Date & Time display */}
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Sesi Konsultasi & Bimbingan
            </h3>
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Clock className="h-4 w-4 text-blue-400 shrink-0" />
              <span>
                {formatDate(slot.startTime)} • {formatTimeRange(slot.startTime, slot.endTime)}
              </span>
            </div>
          </div>

          {/* Location / Meeting link */}
          <div className="p-3 rounded-lg bg-[#282a2d] border border-[#3c4043] space-y-1">
            <span className="text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider block">
              {slot.type === MeetingType.ONLINE ? "Tautan Pertemuan:" : "Lokasi Ruangan:"}
            </span>
            {slot.locationDetails ? (
              slot.type === MeetingType.ONLINE && slot.locationDetails.startsWith("http") ? (
                <a
                  href={slot.locationDetails}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1.5 break-all font-medium"
                >
                  <span className="truncate">{slot.locationDetails}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : (
                <p className="font-semibold text-white break-words">
                  {slot.locationDetails}
                </p>
              )
            ) : (
              <p className="italic text-[#9aa0a6]">
                {slot.type === MeetingType.ONLINE
                  ? "Tautan Microsoft Teams akan diinfokan oleh Dosen."
                  : "Ruangan tatap muka akan diinfokan di kampus."}
              </p>
            )}
          </div>

          {/* Lecturer View: Student details if booked */}
          {isLecturer && isBooked && student && (
            <div className="p-3.5 rounded-lg bg-blue-950/40 border border-blue-800/60 space-y-2">
              <div className="flex items-center gap-2 text-blue-300 font-bold uppercase tracking-wider text-[11px]">
                <UserCheck className="h-4 w-4" />
                <span>Data Mahasiswa Pemesan:</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div>
                  <span className="text-[#9aa0a6]">Nama: </span>
                  <strong className="text-white font-semibold">
                    {student.fullName || student.name || "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#9aa0a6]">Program Studi: </span>
                  <strong className="text-white font-semibold">
                    {student.programStudi || "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#9aa0a6]">Kelas: </span>
                  <strong className="text-white font-semibold">
                    {student.kelas || "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#9aa0a6]">Email: </span>
                  <a
                    href={`mailto:${student.email}`}
                    className="text-blue-400 hover:underline"
                  >
                    {student.email}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Student View: Cancellation policy callout */}
          {!isLecturer && isBookedByMe && (
            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/50 text-blue-200 text-[11px] flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Catatan: Jika Anda berhalangan hadir, silakan hubungi <strong>Dosen Pembimbing</strong> secara langsung untuk membatalkan slot ini.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#282a2d] border-t border-[#3c4043] flex items-center justify-between gap-2">
          {/* LECTURER ACTIONS */}
          {isLecturer ? (
            <div className="w-full flex items-center justify-between gap-2">
              {confirmDelete ? (
                <div className="flex items-center gap-2 w-full justify-end">
                  <span className="text-xs text-red-400 font-semibold">
                    Yakin ingin menghapus?
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ya, Hapus"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isPending}
                    className="h-8 px-2 text-xs text-[#9aa0a6]"
                  >
                    Batal
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="bg-transparent border-[#5f6368] text-red-400 hover:bg-red-950/40 hover:text-red-300 text-xs flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Slot</span>
                  </Button>

                  {isBooked && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnassign}
                      disabled={isPending}
                      className="bg-transparent border-amber-600/60 text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 text-xs flex items-center gap-1.5"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="h-3.5 w-3.5" />
                      )}
                      <span>Batalkan Booking (Unassign)</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            /* STUDENT ACTIONS */
            <div className="w-full">
              {!isBooked ? (
                <Button
                  onClick={handleBooking}
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 h-10 shadow"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memproses Booking...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-4 w-4" />
                      <span>Booking Jadwal Ini</span>
                    </>
                  )}
                </Button>
              ) : isBookedByMe ? (
                <div className="w-full py-2 rounded-lg bg-blue-950/60 border border-blue-700/60 text-center font-medium text-blue-300 text-xs flex items-center justify-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-blue-400" />
                  <span>Jadwal Ini Telah Anda Daftarkan</span>
                </div>
              ) : (
                <div className="w-full py-2 rounded-lg bg-[#2d2f31] border border-[#3c4043] text-center font-medium text-[#9aa0a6] text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                  <Lock className="h-4 w-4" />
                  <span>Sudah Terisi oleh Mahasiswa Lain</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
