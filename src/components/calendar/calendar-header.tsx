"use client";

import { Role } from "@prisma/client";
import { CalendarViewMode, UserSessionInfo } from "./types";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Calendar as CalendarIcon,
  ChevronDown,
  BookOpen,
} from "lucide-react";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  user: UserSessionInfo;
}

export function CalendarHeader({
  currentDate,
  onPrev,
  onNext,
  onToday,
  viewMode,
  onViewModeChange,
  isSidebarOpen,
  onToggleSidebar,
  user,
}: CalendarHeaderProps) {
  const isLecturer = user.role === Role.LECTURER;
  const currentDayNum = new Date().getDate();

  // Format month and year, e.g. "Oktober 2026"
  const formattedMonthYear = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  const studentBadgeText =
    user.programStudi && user.kelas
      ? `Mahasiswa • ${user.programStudi} (${user.kelas})`
      : user.programStudi
      ? `Mahasiswa • ${user.programStudi}`
      : "Mahasiswa";

  return (
    <header className="h-16 border-b border-[#3c4043] bg-[#1e1f20] text-[#e3e3e3] px-3 sm:px-5 flex items-center justify-between select-none">
      {/* Left section: Hamburger, Logo, Navigation, Month Title */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-[#3c4043]/50 text-[#9aa0a6] hover:text-white transition-colors"
          title="Toggle Sidebar Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Google Calendar Styled Logo */}
        <div className="flex items-center gap-2.5 mr-1 sm:mr-3">
          <div className="relative h-9 w-9 rounded-lg bg-blue-600 flex flex-col items-center justify-center shadow-md font-bold text-white text-base">
            <span className="text-[9px] font-normal uppercase tracking-wider text-blue-100 -mb-1">
              Bimbingan
            </span>
            <span>{currentDayNum}</span>
          </div>
          <div className="hidden md:block">
            <span className="text-lg font-semibold tracking-tight text-white leading-none block">
              Calendar
            </span>
            <span className="text-[11px] text-[#9aa0a6] block leading-tight">
              Portal Akademik
            </span>
          </div>
        </div>

        {/* Today Button */}
        <button
          type="button"
          onClick={onToday}
          className="h-9 px-3.5 rounded-md border border-[#5f6368] hover:bg-[#3c4043]/60 text-xs sm:text-sm font-medium transition-colors"
        >
          Hari Ini
        </button>

        {/* Previous / Next Arrow Controls */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onPrev}
            className="p-1.5 rounded-full hover:bg-[#3c4043]/60 text-[#c4c7c5] hover:text-white transition-colors"
            title="Sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-1.5 rounded-full hover:bg-[#3c4043]/60 text-[#c4c7c5] hover:text-white transition-colors"
            title="Berikutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Month & Year Display */}
        <h2 className="text-base sm:text-xl font-medium tracking-tight text-white capitalize pl-1 sm:pl-2">
          {formattedMonthYear}
        </h2>
      </div>

      {/* Right section: View Switcher, Role Badge, User Info, Logout */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* View Mode Selector (Week / Month / List) */}
        <div className="relative">
          <select
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value as CalendarViewMode)}
            className="h-9 rounded-md bg-[#2d2f31] border border-[#5f6368] text-xs sm:text-sm px-3 pr-8 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
          >
            <option value="week">Minggu (Week)</option>
            <option value="month">Bulan (Month)</option>
            <option value="list">Daftar (List)</option>
          </select>
          <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-3 pointer-events-none text-[#9aa0a6]" />
        </div>

        {/* Role Badge */}
        <div className="hidden lg:block">
          {isLecturer ? (
            <Badge className="bg-blue-600/90 text-white hover:bg-blue-600 font-medium px-2.5 py-1 text-xs flex items-center gap-1 border-0">
              <BookOpen className="h-3 w-3" />
              <span>Dosen</span>
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2.5 py-1 text-xs font-medium"
            >
              {studentBadgeText}
            </Badge>
          )}
        </div>

        {/* User profile identifier */}
        <div className="hidden xl:block text-right text-xs">
          <p className="font-medium text-white truncate max-w-[140px]">
            {user.fullName || user.name || "Pengguna"}
          </p>
          <p className="text-[10px] text-[#9aa0a6] truncate max-w-[140px]">
            {user.email}
          </p>
        </div>

        {/* Logout Button */}
        <LogoutButton />
      </div>
    </header>
  );
}
