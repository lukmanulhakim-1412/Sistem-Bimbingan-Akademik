"use client";

import { Role } from "@prisma/client";
import { MiniCalendar } from "./mini-calendar";
import { CalendarFilters, UserSessionInfo } from "./types";
import { Check, Calendar, CheckCircle2 } from "lucide-react";

interface CalendarSidebarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  filters: CalendarFilters;
  onFilterChange: (filters: CalendarFilters) => void;
  user: UserSessionInfo;
  onOpenCreateModal?: () => void;
  totalSlots: number;
  availableCount: number;
  bookedCount: number;
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
}: CalendarSidebarProps) {
  const isLecturer = user.role === Role.LECTURER;

  return (
    <aside className="w-full h-full min-h-full flex-1 bg-[#1e1f20] border-r border-[#3c4043] flex flex-col p-4 gap-6 select-none overflow-y-auto">
      {/* Mini Calendar Picker */}
      <div className="border-b border-[#3c4043] pb-5">
        <MiniCalendar currentDate={currentDate} onSelectDate={onSelectDate} />
      </div>

      {/* Calendar Filter Checkboxes */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#9aa0a6] uppercase tracking-wider px-1">
          Filter Kalender
        </h3>

        <div className="space-y-1.5">
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
              className={`h-4 w-4 rounded flex items-center justify-center transition-colors border ${
                filters.showAvailable
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "border-[#5f6368] bg-transparent"
              }`}
            >
              {filters.showAvailable && <Check className="h-3 w-3 stroke-[3]" />}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span>Slot Tersedia</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
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
              className={`h-4 w-4 rounded flex items-center justify-center transition-colors border ${
                filters.showBooked
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-[#5f6368] bg-transparent"
              }`}
            >
              {filters.showBooked && <Check className="h-3 w-3 stroke-[3]" />}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span>Slot Sudah Dibooking</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40">
                {bookedCount}
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
                className={`h-4 w-4 rounded flex items-center justify-center transition-colors border ${
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
          <span className="text-blue-400">Terisi:</span>
          <span className="font-semibold text-blue-300">{bookedCount}</span>
        </div>
      </div>
    </aside>
  );
}
