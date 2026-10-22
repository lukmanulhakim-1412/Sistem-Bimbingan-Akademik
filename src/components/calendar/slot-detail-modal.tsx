"use client";

import { useState, useTransition, useEffect } from "react";
import { SlotWithBookedBy, UserSessionInfo } from "./types";
import { Role, MeetingType } from "@prisma/client";
import {
  bookSlot,
  unassignSlot,
  deleteSlot,
  updateSlotLocation,
  toggleSlotBlock,
} from "@/actions/slot-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Edit2,
  Check,
  Repeat,
  Ban,
  ShieldCheck,
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

  // Editable location state for Lecturer
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");

  useEffect(() => {
    if (slot) {
      setLocationInput(slot.locationDetails || "");
      setCurrentLocation(slot.locationDetails || "");
      setIsEditingLocation(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setConfirmDelete(false);
    }
  }, [slot]);

  if (!isOpen || !slot) return null;

  const isLecturer = user.role === Role.LECTURER;
  const isBooked = !!slot.bookedById;
  const isBookedByMe = slot.bookedById === user.id;
  const isBlocked = !!slot.isBlocked;
  const isRecurring = !!slot.recurringGroupId;
  const isPast = new Date(slot.startTime) <= new Date();
  const student = slot.bookedBy;

  const handleSaveLocation = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await updateSlotLocation(slot.id, locationInput);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal mengubah tautan pertemuan.");
      } else {
        setCurrentLocation(locationInput);
        setSuccessMessage(res.message || "Tautan pertemuan berhasil disimpan!");
        setIsEditingLocation(false);
      }
    });
  };

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

  const handleDelete = (deleteFollowing = false) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await deleteSlot(slot.id, deleteFollowing);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal menghapus slot.");
      } else {
        setSuccessMessage(res.message || "Slot jadwal berhasil dihapus.");
        setTimeout(() => {
          onClose();
        }, 800);
      }
    });
  };

  const handleToggleBlock = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await toggleSlotBlock(slot.id);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal mengubah status blokir.");
      } else {
        setSuccessMessage(res.message || "Status blokir berhasil diubah.");
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
          <div className="flex items-center gap-2 flex-wrap">
            {isBlocked ? (
              <Badge className="bg-amber-950/90 text-amber-300 border border-amber-700/60 font-medium text-xs flex items-center gap-1">
                <Ban className="h-3 w-3" />
                <span>Diblokir Dosen</span>
              </Badge>
            ) : (
              <>
                {slot.type === MeetingType.ONLINE ? (
                  <Badge className="bg-sky-900/80 text-sky-300 border border-sky-700/60 font-medium text-xs flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    <span>Online</span>
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
                ) : isPast ? (
                  <Badge className="bg-[#2d2f31] text-[#9aa0a6] border border-[#3c4043] font-medium text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Telah Lewat</span>
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600 text-white font-medium text-xs">
                    Tersedia
                  </Badge>
                )}
              </>
            )}

            {isRecurring && (
              <Badge className="bg-blue-950/80 text-blue-300 border border-blue-700/60 font-medium text-xs flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                <span>Mingguan</span>
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
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>
                {isBlocked
                  ? `Jadwal Diblokir: ${slot.blockReason || "Dosen Sibuk / Rapat"}`
                  : "Sesi Konsultasi & Bimbingan"}
              </span>
            </h3>
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Clock className="h-4 w-4 text-blue-400 shrink-0" />
              <span>
                {formatDate(slot.startTime)} • {formatTimeRange(slot.startTime, slot.endTime)}
              </span>
            </div>
          </div>

          {/* Blocked Information Banner */}
          {isBlocked && (
            <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                <Ban className="h-4 w-4 shrink-0" />
                <span>Jadwal Waktu Ini Tidak Tersedia untuk Mahasiswa</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Alasan: <strong>{slot.blockReason || "Dosen memiliki agenda lain / sibuk"}</strong>. Mahasiswa tidak dapat memilih atau membooking jam konsultasi pada slot ini.
              </p>
            </div>
          )}

          {/* Location / Meeting link (Only if not blocked, Editable by Lecturer) */}
          {!isBlocked && (
            <div className="p-3.5 rounded-lg bg-[#282a2d] border border-[#3c4043] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider block">
                  {slot.type === MeetingType.ONLINE ? "Tautan Pertemuan:" : "Lokasi Ruangan:"}
                </span>

                {/* Edit Button for Lecturer */}
                {isLecturer && !isEditingLocation && (
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(true)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1 hover:underline transition-colors"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Ubah Tautan</span>
                  </button>
                )}
              </div>

              {/* Inline Editor for Lecturer */}
              {isLecturer && isEditingLocation ? (
                <div className="space-y-2 pt-1">
                  <Input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder={
                      slot.type === MeetingType.ONLINE
                        ? "https://meet.google.com/... atau tautan online"
                        : "Ruang Dosen 304, Gedung Menara Ilmiah Lt. 3"
                    }
                    className="h-9 text-xs bg-[#1e1f20] border-[#5f6368] text-white focus-visible:ring-blue-500"
                    disabled={isPending}
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingLocation(false)}
                      disabled={isPending}
                      className="h-7 text-xs text-[#9aa0a6]"
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveLocation}
                      disabled={isPending}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      <span>Simpan</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Static Location Display */
                <div>
                  {currentLocation ? (
                    currentLocation.startsWith("http") ? (
                      <a
                        href={currentLocation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 font-semibold hover:underline flex items-center gap-1.5 break-all mt-0.5"
                      >
                        <span>Buka Tautan Pertemuan</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      <p className="font-semibold text-white break-words mt-0.5">
                        {currentLocation}
                      </p>
                    )
                  ) : (
                    <p className="italic text-[#9aa0a6] mt-0.5">
                      {slot.type === MeetingType.ONLINE
                        ? isLecturer
                          ? "Belum ada tautan. Klik 'Ubah Tautan' untuk menambahkan tautan pertemuan online."
                          : "Tautan pertemuan online akan diinfokan oleh Dosen."
                        : "Ruangan tatap muka akan diinfokan di kampus."}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lecturer View: Student details if booked */}
          {isLecturer && isBooked && student && (
            <div className="p-3.5 rounded-lg bg-blue-950/40 border border-blue-800/60 space-y-2">
              <div className="flex items-center gap-2 text-blue-300 font-bold uppercase tracking-wider text-[11px]">
                <UserCheck className="h-4 w-4" />
                <span>Data Mahasiswa Pemesan:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#9aa0a6] block text-[10px]">Nama Lengkap:</span>
                  <span className="font-semibold text-white">
                    {student.fullName || student.name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[#9aa0a6] block text-[10px]">Email:</span>
                  <span className="font-semibold text-white truncate block">
                    {student.email}
                  </span>
                </div>
                <div>
                  <span className="text-[#9aa0a6] block text-[10px]">Program Studi:</span>
                  <span className="font-semibold text-white">
                    {student.programStudi || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[#9aa0a6] block text-[10px]">Kelas:</span>
                  <span className="font-semibold text-white">
                    {student.kelas || "-"}
                  </span>
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
            <div className="w-full space-y-2">
              {confirmDelete ? (
                <div className="rounded-xl p-3 bg-red-950/40 border border-red-800/60 space-y-2.5">
                  <div className="text-xs text-red-300 font-semibold flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4 text-red-400" />
                    <span>Konfirmasi Penghapusan Jadwal:</span>
                  </div>

                  {isRecurring ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-[#c4c7c5]">
                        Jadwal ini berulang mingguan. Pilih cakupan penghapusan:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(false)}
                          disabled={isPending}
                          className="text-xs bg-red-700 hover:bg-red-800 flex-1"
                        >
                          Hapus Hanya Slot Ini
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(true)}
                          disabled={isPending}
                          className="text-xs bg-red-600 hover:bg-red-700 flex-1 font-semibold"
                        >
                          Hapus Ini & Semua Minggu Berikutnya
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(false)}
                        disabled={isPending}
                        className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700"
                      >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ya, Hapus Slot"}
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isPending}
                      className="h-7 px-2 text-xs text-[#9aa0a6]"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                      disabled={isPending}
                      className="bg-transparent border-[#5f6368] text-red-400 hover:bg-red-950/40 hover:text-red-300 text-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Slot</span>
                    </Button>

                    {/* Quick Toggle Block/Unblock for Lecturer */}
                    {!isBooked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleBlock}
                        disabled={isPending}
                        className={`bg-transparent text-xs flex items-center gap-1.5 ${
                          isBlocked
                            ? "border-emerald-600/60 text-emerald-400 hover:bg-emerald-950/40"
                            : "border-amber-600/60 text-amber-400 hover:bg-amber-950/40"
                        }`}
                      >
                        {isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isBlocked ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                        <span>{isBlocked ? "Buka Blokir (Jadikan Tersedia)" : "Blokir Waktu Ini"}</span>
                      </Button>
                    )}
                  </div>

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
                      <span>Batalkan Booking</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* STUDENT ACTIONS */
            <div className="w-full">
              {isBlocked ? (
                <div className="w-full py-2.5 rounded-lg bg-amber-950/40 border border-amber-700/60 text-center font-medium text-amber-300 text-xs flex items-center justify-center gap-2">
                  <Ban className="h-4 w-4 text-amber-400" />
                  <span>Jadwal Ini Diblokir Dosen (Tidak Tersedia)</span>
                </div>
              ) : isPast && !isBooked ? (
                <div className="w-full py-2.5 rounded-lg bg-[#282a2d] border border-[#3c4043] text-center font-medium text-[#9aa0a6] text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                  <Clock className="h-4 w-4 text-[#9aa0a6]" />
                  <span>Waktu Konsultasi Sudah Lewat (Kedaluwarsa)</span>
                </div>
              ) : !isBooked ? (
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
