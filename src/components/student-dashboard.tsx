import { Slot, MeetingType } from "@prisma/client";
import { BookSlotButton } from "@/components/book-slot-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate, formatTimeRange } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  Info,
  CheckCircle2,
  CalendarDays,
  Lock,
} from "lucide-react";

interface StudentDashboardProps {
  currentUserId: string;
  myBookings: Slot[];
  upcomingSlots: Slot[];
}

export function StudentDashboard({
  currentUserId,
  myBookings,
  upcomingSlots,
}: StudentDashboardProps) {
  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard Bimbingan Mahasiswa
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Pilih jadwal konsultasi yang tersedia atau tinjau jadwal bimbingan aktif Anda.
        </p>
      </div>

      {/* SECTION 1: MY BOOKINGS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-slate-900">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Jadwal Bimbingan Saya</h3>
              <p className="text-xs text-slate-500">
                Slot yang saat ini telah terdaftar dan dikonfirmasi atas nama Anda
              </p>
            </div>
          </div>
          <Badge className="bg-blue-600 text-white hover:bg-blue-600 font-semibold text-xs">
            {myBookings.length} Sesi Terjadwal
          </Badge>
        </div>

        {/* Cancellation Notice Policy */}
        <Alert className="bg-blue-50/70 border-blue-200 text-blue-950">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <AlertTitle className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
            Ketentuan Pembatalan Jadwal:
          </AlertTitle>
          <AlertDescription className="text-xs text-blue-800 mt-0.5">
            Pembatalan booking hanya dapat dilakukan dengan menghubungi <strong>Dosen Pembimbing</strong> secara langsung agar slot dapat dialokasikan kembali.
          </AlertDescription>
        </Alert>

        {myBookings.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/40">
            <CardContent className="py-8 text-center">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Anda belum memiliki jadwal bimbingan yang aktif
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Silakan pilih salah satu slot yang berstatus &quot;Tersedia&quot; pada tabel jadwal di bawah.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBookings.map((slot) => {
              const isPast = new Date(slot.endTime) < new Date();

              return (
                <Card
                  key={slot.id}
                  className={`border-2 transition-all ${
                    isPast
                      ? "border-slate-200 bg-slate-50/70 opacity-75"
                      : "border-blue-500 bg-white shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-600 text-white font-medium text-xs">
                        {isPast ? "Selesai" : "Bimbingan Aktif"}
                      </Badge>
                      {slot.type === MeetingType.ONLINE ? (
                        <Badge
                          variant="secondary"
                          className="bg-sky-50 text-sky-700 border border-sky-200 text-xs flex items-center gap-1"
                        >
                          <Video className="h-3 w-3" />
                          <span>Online</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>Offline (Tatap Muka)</span>
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 pt-2">
                      {formatDate(slot.startTime)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-slate-600 font-medium text-xs">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatTimeRange(slot.startTime, slot.endTime)}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                        {slot.type === MeetingType.ONLINE
                          ? "Tautan Pertemuan:"
                          : "Lokasi Pertemuan:"}
                      </span>
                      {slot.locationDetails ? (
                        slot.type === MeetingType.ONLINE &&
                        slot.locationDetails.startsWith("http") ? (
                          <a
                            href={slot.locationDetails}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-semibold hover:underline flex items-center gap-1.5 break-all"
                          >
                            <span>Buka Tautan Rapat</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : (
                          <p className="font-semibold text-slate-800 break-words">
                            {slot.locationDetails}
                          </p>
                        )
                      ) : (
                        <p className="italic text-slate-400">
                          {slot.type === MeetingType.ONLINE
                            ? "Tautan online akan diinformasikan oleh Dosen."
                            : "Ruangan akan diinformasikan oleh Dosen."}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: AVAILABLE SCHEDULE GRID */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-slate-900">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Jadwal Konsultasi Tersedia</h3>
              <p className="text-xs text-slate-500">
                Pilih slot 1 jam yang cocok dengan agenda Anda untuk mendaftar bimbingan
              </p>
            </div>
          </div>
        </div>

        {upcomingSlots.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="py-12 text-center">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Belum ada slot bimbingan yang dibuka
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Dosen belum membuka slot konsultasi baru untuk saat ini. Silakan periksa kembali nanti.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingSlots.map((slot) => {
              const isBookedByMe = slot.bookedById === currentUserId;
              const isBookedByOther = slot.bookedById !== null && !isBookedByMe;
              const isAvailable = slot.bookedById === null;

              return (
                <Card
                  key={slot.id}
                  className={`flex flex-col justify-between transition-all ${
                    isBookedByOther
                      ? "bg-slate-50/70 border-slate-200 opacity-60"
                      : isBookedByMe
                      ? "border-blue-300 bg-blue-50/20"
                      : "border-slate-200 hover:border-blue-300 hover:shadow-md bg-white"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      {/* Availability status badge */}
                      {isAvailable ? (
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-xs font-semibold">
                          Tersedia
                        </Badge>
                      ) : isBookedByMe ? (
                        <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-xs font-semibold">
                          Jadwal Anda
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-200 text-slate-600 text-xs font-medium">
                          Sudah Terisi
                        </Badge>
                      )}

                      {/* Type Badge */}
                      {slot.type === MeetingType.ONLINE ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          <Video className="h-3 w-3" />
                          <span>Online</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <MapPin className="h-3 w-3" />
                          <span>Tatap Muka</span>
                        </span>
                      )}
                    </div>

                    <CardTitle className="text-base font-bold text-slate-900 pt-2">
                      {formatDate(slot.startTime)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatTimeRange(slot.startTime, slot.endTime)}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="text-xs text-slate-500 min-h-[32px]">
                      {slot.locationDetails ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-slate-600">
                            {slot.type === MeetingType.ONLINE ? "Media:" : "Ruang:"}
                          </span>
                          <span className="truncate max-w-[200px]">
                            {slot.locationDetails}
                          </span>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">
                          {slot.type === MeetingType.ONLINE
                            ? "Tautan pertemuan online tersedia setelah booking"
                            : "Informasi ruangan tersedia di kampus"}
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="pt-2 border-t border-slate-100">
                      {isAvailable ? (
                        <BookSlotButton slotId={slot.id} />
                      ) : isBookedByMe ? (
                        <div className="w-full h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center gap-2 text-xs font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Slot Ini Sudah Anda Booking</span>
                        </div>
                      ) : (
                        <div className="w-full h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center gap-2 text-xs font-medium cursor-not-allowed">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Sudah Terisi</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
