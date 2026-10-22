"use client";

import { Role } from "@prisma/client";
import { MiniCalendar } from "./mini-calendar";
import { CalendarFilters, UserSessionInfo } from "./types";
import { Check, Calendar, CheckCircle2, Video, MapPin } from "lucide-react";

interface CalendarSidebarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  filters: CalendarFilters;
  onFilterChange: (filters: CalendarFilters) => void;
  user: UserSessionInfo;
  onOpenCreateModal: () => void;
  totalSlots: number;
  availableCount: number;
  bookedCount: number;
  completedCount: number;
  onlineCount: number;
  offlineCount: number;
}

export function CalendarSidebar({
  currentDate,
  onSelectDate,
  filters,
  onFilterChange,
  user,
  onOpenCreateModal,
  totalSlots,
  availableCount,
  bookedCount,
  completedCount,
  onlineCount,
  offlineCount,
}: CalendarSidebarProps) {
  const isLecturer = user.role === Role.LECTURER;

  return (
    <aside className="w-full h-full min-h-full flex-1 bg-[#1e1f20] flex flex-col p-4 gap-5 select-none overflow-y-auto">
      {/* Mini Calendar Picker */}
      <div className="border-b border-[#3c4043] pb-5">
        <MiniCalendar currentDate={currentDate} onSelectDate={onSelectDate} />
      </div>

      {/* Calendar Filter Groups */}
      <div className="space-y-4">
        {/* Group 1: Status Jadwal */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-[#9aa0a6] uppercase tracking-wider px-1">
            Status Jadwal
          </h3>

          <div className="space-y-1">
            {/* Available Slots Filter */}
            <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#2d2f31] cursor-pointer text-xs text-[#e3e3e3] transition-colors">
              <input
                type="checkbox"
                checked={filters.showAvailable}
                onChange={(e) =>
                  onFilterChange({ ...filters, showAvailable: e.target.checked })
                }
                className="sr-only"
              />
              <div
                className={`h-4 w-4 shrink-0 rounded flex items-center justify-center transition-colors border ${
                  filters.showAvailable
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "border-[#5f6368] bg-transparent"
                }`}
              >
                {filters.showAvailable && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Slot Tersedia</span>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 min-w-[20px] text-center ml-2">
                  {availableCount}
                </span>
              </div>
            </label>

            {/* Booked Slots Filter */}
            <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#2d2f31] cursor-pointer text-xs text-[#e3e3e3] transition-colors">
              <input
                type="checkbox"
                checked={filters.showBooked}
                onChange={(e) =>
                  onFilterChange({ ...filters, showBooked: e.target.checked })
                }
                className="sr-only"
              />
              <div
                className={`h-4 w-4 shrink-0 rounded flex items-center justify-center transition-colors border ${
                  filters.showBooked
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "border-[#5f6368] bg-transparent"
                }`}
              >
                {filters.showBooked && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Slot Sudah Dibooking</span>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40 min-w-[20px] text-center ml-2">
                  {bookedCount}
                </span>
              </div>
            </label>

            {/* Completed Slots Filter */}
            <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#2d2f31] cursor-pointer text-xs text-[#e3e3e3] transition-colors">
              <input
                type="checkbox"
                checked={filters.showCompleted}
                onChange={(e) =>
                  onFilterChange({ ...filters, showCompleted: e.target.checked })
                }
                className="sr-only"
              />
              <div
                className={`h-4 w-4 shrink-0 rounded flex items-center justify-center transition-colors border ${
                  filters.showCompleted
                    ? "bg-slate-600 border-slate-500 text-white"
                    : "border-[#5f6368] bg-transparent"
                }`}
              >
                {filters.showCompleted && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Jadwal Selesai</span>
                </span>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 min-w-[20px] text-center ml-2">
                  {completedCount}
                </span>
              </div>
            </label>

            {/* Student: My Bookings Only Filter */}
            {!isLecturer && (
              <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#2d2f31] cursor-pointer text-xs text-[#e3e3e3] transition-colors">
                <input
                  type="checkbox"
                  checked={filters.showMyBookingsOnly}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      showMyBookingsOnly: e.target.checked,
                    })
                  }
                  className="sr-only"
                />
                <div
                  className={`h-4 w-4 shrink-0 rounded flex items-center justify-center transition-colors border ${
                    filters.showMyBookingsOnly
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "border-[#5f6368] bg-transparent"
                  }`}
                >
                  {filters.showMyBookingsOnly && (
                    <Check className="h-3 w-3 stroke-[3]" />
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span>Hanya Jadwal Saya</span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Group 2: Tipe Pertemuan (Online / Offline) */}
        <div className="space-y-2 pt-2 border-t border-[#3c4043]/60">
          <h3 className="text-[11px] font-bold text-[#9aa0a6] uppercase tracking-wider px-1">
            Tipe Pertemuan
          </h3>

          <div className="space-y-1">
            {/* Online Filter */}
            <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#2d2f31] cursor-pointer text-xs text-[#e3e3e3] transition-colors">
              <input
                type="checkbox"
                checked={filters.showOnline}
                onChange={(e) =>
                  onFilterChange({ ...filters, showOnline: e.target.checked })
                }
                className="sr-only"
              />
              <div
                className={`h-4 w-4 shrink-0 rounded flex items-center justify-center transition-colors border ${
                  filters.showOnline
                    ? "bg-sky-600 border-sky-500 text-white"
                    : "border-[#5f6368] bg-transparent"
                }`}
              >
                {filters.showOnline && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <Video className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>Online (Daring)</span>
                </span>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-400 border border-sky-800/40 min-w-[20px] text-center ml-2">
                  {onlineCount}
                </span>
              </div>
            </label>

            {/* Offline Filter */}
            <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#2d2f31] cursor-pointer text-xs text-[#e3e3e3] transition-colors">
              <input
                type="checkbox"
                checked={filters.showOffline}
                onChange={(e) =>
                  onFilterChange({ ...filters, showOffline: e.target.checked })
                }
                className="sr-only"
              />
              <div
                className={`h-4 w-4 shrink-0 rounded flex items-center justify-center transition-colors border ${
                  filters.showOffline
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "border-[#5f6368] bg-transparent"
                }`}
              >
                {filters.showOffline && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Offline (Tatap Muka)</span>
                </span>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 min-w-[20px] text-center ml-2">
                  {offlineCount}
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* KPI Stats Box */}
      <div className="mt-auto pt-4 border-t border-[#3c4043] text-xs text-[#9aa0a6] space-y-2">
        <div className="flex items-center justify-between">
          <span>Total Slot Terdaftar:</span>
          <span className="font-semibold text-white">{totalSlots}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Tersedia:</span>
          <span className="font-semibold text-emerald-300">{availableCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-blue-400">Terisi (Aktif):</span>
          <span className="font-semibold text-blue-300">{bookedCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Selesai:</span>
          <span className="font-semibold text-slate-300">{completedCount}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-[#3c4043]/40 text-[11px]">
          <span>Online / Offline:</span>
          <span className="font-semibold text-white">
            <span className="text-sky-400">{onlineCount}</span> /{" "}
            <span className="text-emerald-400">{offlineCount}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
