"use client";

import { useState } from "react";
import { Slot, User, MeetingType } from "@prisma/client";
import { CreateSlotForm } from "@/components/create-slot-form";
import { LecturerSlotActions } from "@/components/lecturer-slot-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, formatTimeRange } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  UserCheck,
  CheckCircle,
  CalendarCheck,
  Inbox,
  ExternalLink,
  Filter,
} from "lucide-react";

export type SlotWithBookedBy = Slot & {
  bookedBy: Pick<User, "id" | "name" | "email" | "fullName" | "programStudi" | "kelas"> | null;
};

interface LecturerDashboardProps {
  slots: SlotWithBookedBy[];
}

type FilterStatus = "ALL" | "AVAILABLE" | "BOOKED";

export function LecturerDashboard({ slots }: LecturerDashboardProps) {
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  const totalSlots = slots.length;
  const bookedSlotsCount = slots.filter((s) => s.bookedById !== null).length;
  const availableSlotsCount = slots.filter((s) => s.bookedById === null).length;

  const filteredSlots = slots.filter((slot) => {
    if (filter === "AVAILABLE") return slot.bookedById === null;
    if (filter === "BOOKED") return slot.bookedById !== null;
    return true; // "ALL" shows both
  });

  return (
    <div className="space-y-8">
      {/* Top Welcome & KPI Metrics */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Dashboard Manajemen Dosen
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Atur slot jadwal bimbingan dan pantau permohonan konsultasi dari mahasiswa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {/* Card: Total Slots */}
          <div
            onClick={() => setFilter("ALL")}
            className={`cursor-pointer transition-all rounded-xl border p-5 flex items-center justify-between ${
              filter === "ALL"
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Slot Dibuat
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalSlots}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          {/* Card: Available Slots */}
          <div
            onClick={() => setFilter("AVAILABLE")}
            className={`cursor-pointer transition-all rounded-xl border p-5 flex items-center justify-between ${
              filter === "AVAILABLE"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 shadow-sm"
                : "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
            }`}
          >
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Slot Tersedia
              </p>
              <p className="text-2xl font-bold text-emerald-800 mt-1">
                {availableSlotsCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          {/* Card: Booked Slots */}
          <div
            onClick={() => setFilter("BOOKED")}
            className={`cursor-pointer transition-all rounded-xl border p-5 flex items-center justify-between ${
              filter === "BOOKED"
                ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-sm"
                : "border-indigo-200 bg-indigo-50/20 hover:border-indigo-300"
            }`}
          >
            <div>
              <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider">
                Slot Telah Dibooking
              </p>
              <p className="text-2xl font-bold text-indigo-800 mt-1">
                {bookedSlotsCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Form: Add New Slot */}
      <CreateSlotForm />

      {/* Slots List / Table */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Daftar Slot Konsultasi & Bimbingan
              </CardTitle>
              <CardDescription>
                Daftar seluruh slot yang telah Anda publikasikan, diurutkan berdasarkan waktu mulai.
              </CardDescription>
            </div>

            {/* Filter Controls: Toggle Buttons & Dropdown */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    filter === "ALL"
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Semua Slot</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-[10px] text-slate-700 font-bold">
                    {totalSlots}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("AVAILABLE")}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    filter === "AVAILABLE"
                      ? "bg-emerald-600 text-white shadow-sm font-semibold"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>Tersedia</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      filter === "AVAILABLE"
                        ? "bg-emerald-700 text-white"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {availableSlotsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("BOOKED")}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    filter === "BOOKED"
                      ? "bg-blue-600 text-white shadow-sm font-semibold"
                      : "text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-300 shrink-0" />
                  <span>Sudah Dibooking</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      filter === "BOOKED"
                        ? "bg-blue-700 text-white"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {bookedSlotsCount}
                  </span>
                </button>
              </div>

              {/* Mobile Dropdown Selector */}
              <div className="sm:hidden flex items-center gap-2 w-full">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterStatus)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Slot ({totalSlots})</option>
                  <option value="AVAILABLE">Hanya Tersedia ({availableSlotsCount})</option>
                  <option value="BOOKED">Hanya Sudah Dibooking ({bookedSlotsCount})</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredSlots.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-slate-800">
                {filter === "AVAILABLE"
                  ? "Tidak ada slot yang tersedia"
                  : filter === "BOOKED"
                  ? "Belum ada slot yang dibooking mahasiswa"
                  : "Belum ada slot bimbingan"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {filter === "AVAILABLE"
                  ? "Semua slot yang telah Anda publikasikan saat ini sudah dibooking oleh mahasiswa atau belum dibuat."
                  : filter === "BOOKED"
                  ? "Belum ada mahasiswa yang memilih slot konsultasi Anda."
                  : "Gunakan formulir 'Tambah Slot Konsultasi' di atas untuk membuka ketersediaan waktu bimbingan bagi mahasiswa Anda."}
              </p>
              {filter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className="mt-3 inline-flex text-xs text-blue-600 hover:underline font-medium"
                >
                  ← Tampilkan Semua Slot
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSlots.map((slot) => {
                const isBooked = !!slot.bookedById;
                const isPast = new Date(slot.endTime) < new Date();
                const student = slot.bookedBy;

                return (
                  <div
                    key={slot.id}
                    className={`p-5 transition-colors ${
                      isPast
                        ? "bg-slate-50/60 opacity-80"
                        : isBooked
                        ? "bg-blue-50/15 hover:bg-blue-50/25"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Schedule Information */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900 text-base">
                            {formatDate(slot.startTime)}
                          </span>

                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded text-xs font-medium">
                            <Clock className="h-3 w-3 text-slate-500" />
                            {formatTimeRange(slot.startTime, slot.endTime)}
                          </span>

                          {/* Meeting Type Badge */}
                          {slot.type === MeetingType.ONLINE ? (
                            <Badge className="bg-sky-100 text-sky-800 border border-sky-200 hover:bg-sky-100 font-medium text-xs flex items-center gap-1">
                              <Video className="h-3 w-3 text-sky-600" />
                              <span>Online (MS Teams)</span>
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-medium text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-600" />
                              <span>Offline (Tatap Muka)</span>
                            </Badge>
                          )}

                          {/* Booking Status Badge */}
                          {isBooked ? (
                            <Badge className="bg-blue-600 text-white hover:bg-blue-600 font-medium text-xs">
                              Booked (Sudah Terisi)
                            </Badge>
                          ) : isPast ? (
                            <Badge variant="outline" className="text-slate-500 text-xs">
                              Kedaluwarsa
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 font-medium text-xs">
                              Available (Tersedia)
                            </Badge>
                          )}
                        </div>

                        {/* Location / Meeting link */}
                        {slot.locationDetails && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            {slot.type === MeetingType.ONLINE ? (
                              <>
                                <span className="font-medium text-slate-700">Link Teams:</span>
                                {slot.locationDetails.startsWith("http") ? (
                                  <a
                                    href={slot.locationDetails}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <span className="truncate max-w-xs sm:max-w-md">
                                      {slot.locationDetails}
                                    </span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                  </a>
                                ) : (
                                  <span>{slot.locationDetails}</span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="font-medium text-slate-700">Ruangan:</span>
                                <span>{slot.locationDetails}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* If Booked: Clearly display student details */}
                        {isBooked && student && (
                          <div className="mt-3 p-3 rounded-lg border border-blue-200 bg-blue-50/50 max-w-2xl">
                            <div className="flex items-center gap-2 mb-1.5">
                              <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                                Data Mahasiswa Pemesan:
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <div>
                                <span className="text-slate-500">Nama Lengkap: </span>
                                <strong className="text-slate-900 font-semibold">
                                  {student.fullName || student.name || "—"}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500">Program Studi: </span>
                                <strong className="text-slate-900 font-semibold">
                                  {student.programStudi || "—"}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500">Kelas: </span>
                                <strong className="text-slate-900 font-semibold">
                                  {student.kelas || "—"}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500">Email Mahasiswa: </span>
                                <a
                                  href={`mailto:${student.email}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {student.email}
                                </a>
                              </div>
                              {slot.bookedAt && (
                                <div className="sm:col-span-2 text-[11px] text-slate-500 mt-1 border-t border-blue-200/60 pt-1">
                                  <span>Waktu Booking: </span>
                                  <span>{formatDate(slot.bookedAt)} pukul {formatTimeRange(slot.bookedAt, slot.bookedAt).split(" - ")[0]} WIB</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="pt-2 lg:pt-0 shrink-0">
                        <LecturerSlotActions slotId={slot.id} isBooked={isBooked} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
