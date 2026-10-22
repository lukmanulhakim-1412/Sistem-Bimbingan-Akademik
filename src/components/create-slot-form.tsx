"use client";

import { useState, useTransition, useRef } from "react";
import { createSlot } from "@/actions/slot-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  PlusCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Video,
  MapPin,
  CalendarPlus,
  Repeat,
  CalendarDays,
} from "lucide-react";
import { MeetingType } from "@prisma/client";

export function CreateSlotForm() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType>(MeetingType.ONLINE);
  const [repeatWeekly, setRepeatWeekly] = useState(false);

  // Default to today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState("09:00");

  const formRef = useRef<HTMLFormElement>(null);

  // Calculate preview dates for repeatWeekly
  const currentSlotDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const nextWeekSlotDate = currentSlotDate
    ? new Date(currentSlotDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createSlot(formData);

      if (!result.success) {
        setErrorMessage(result.error || "Gagal membuat slot bimbingan.");
      } else {
        setSuccessMessage(
          result.message || "Slot bimbingan berhasil dipublikasikan!"
        );
        formRef.current?.reset();
        setMeetingType(MeetingType.ONLINE);
        setRepeatWeekly(false);
        setSelectedDate(todayStr);
        setSelectedTime("09:00");
      }
    });
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/20 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
          <CalendarPlus className="h-4 w-4" />
          <span>Buat Jadwal Baru</span>
        </div>
        <CardTitle className="text-xl font-bold text-slate-900">
          Tambah Slot Konsultasi
        </CardTitle>
        <CardDescription>
          Buat ketersediaan waktu bimbingan. Durasi setiap slot dihitung 1 jam (60 menit).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Tanggal Pertemuan</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={todayStr}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startTime">Waktu Mulai (WIB)</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
                disabled={isPending}
              />
              <p className="text-[11px] text-slate-400">
                Sistem otomatis menambahkan 1 jam (contoh: {selectedTime} - {parseInt(selectedTime.split(":")[0] || "9", 10) + 1}:00 WIB).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipe Pertemuan</Label>
              <Select
                id="type"
                name="type"
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                disabled={isPending}
              >
                <option value={MeetingType.ONLINE}>Online - Microsoft Teams</option>
                <option value={MeetingType.OFFLINE}>Offline - Tatap Muka di Kampus</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locationDetails">
                {meetingType === MeetingType.ONLINE
                  ? "Tautan Rapat (MS Teams Link)"
                  : "Lokasi / Nomor Ruangan"}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {meetingType === MeetingType.ONLINE ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </div>
                <Input
                  id="locationDetails"
                  name="locationDetails"
                  type="text"
                  className="pl-9"
                  placeholder={
                    meetingType === MeetingType.ONLINE
                      ? "https://teams.microsoft.com/l/meetup-join/..."
                      : "Ruang Dosen 304, Gedung Menara Ilmiah Lt. 3"
                  }
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* REPEAT WEEKLY SCHEDULE TOGGLE */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition-all">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="repeatWeekly"
                name="repeatWeekly"
                checked={repeatWeekly}
                onChange={(e) => setRepeatWeekly(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label
                htmlFor="repeatWeekly"
                className="cursor-pointer font-semibold text-slate-800 flex items-center gap-1.5 text-sm"
              >
                <Repeat className="h-4 w-4 text-blue-600" />
                <span>Ulangi Jadwal Otomatis Minggu Depan (Hari & Jam yang Sama)</span>
              </Label>
            </div>

            {repeatWeekly && currentSlotDate && nextWeekSlotDate && (
              <div className="mt-3 ml-7 p-3 rounded-lg bg-blue-50/90 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <span>2 Slot Jadwal yang Akan Dibuat Sekaligus:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                  <li>
                    <strong>Slot 1:</strong> {formatDate(currentSlotDate)} pukul {selectedTime} WIB ({meetingType === MeetingType.ONLINE ? "Online Teams" : "Tatap Muka"})
                  </li>
                  <li>
                    <strong>Slot 2 (Minggu Depan):</strong> {formatDate(nextWeekSlotDate)} pukul {selectedTime} WIB ({meetingType === MeetingType.ONLINE ? "Online Teams" : "Tatap Muka"})
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Slot...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>
                    {repeatWeekly
                      ? "Publikasikan 2 Slot (Minggu Ini & Depan)"
                      : "Publikasikan Slot Jadwal"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
