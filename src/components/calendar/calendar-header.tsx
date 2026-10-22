"use client";

import { Role } from "@prisma/client";
import { CalendarViewMode, UserSessionInfo } from "./types";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  ChevronDown,
  BookOpen,
  User,
  Users,
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
  onOpenWhitelistModal?: () => void;
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
  onOpenWhitelistModal,
}: CalendarHeaderProps) {
  const isLecturer = user.role === Role.LECTURER;
  const currentDayNum = new Date().getDate();

  // Full format for tablet/desktop (e.g. "Oktober 2026")
  const fullMonthYear = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  // Short format for mobile (e.g. "Okt 2026")
  const shortMonthYear = new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "numeric",
  }).format(currentDate);

  const studentBadgeText =
    user.programStudi && user.kelas
      ? `Mahasiswa • ${user.programStudi} (${user.kelas})`
      : user.programStudi
      ? `Mahasiswa • ${user.programStudi}`
      : "Mahasiswa";

  return (
    <header className="h-14 sm:h-16 border-b border-[#3c4043] bg-[#1e1f20] text-[#e3e3e3] px-2 sm:px-4 flex items-center justify-between select-none shrink-0 z-30 gap-2">
      {/* Left section: Hamburger, Logo, Navigation, Month Title */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 sm:p-2 rounded-full hover:bg-[#3c4043]/50 text-[#9aa0a6] hover:text-white transition-colors"
          title="Toggle Menu / Kalender"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Google Calendar Logo Tile */}
        <div className="flex items-center gap-2 mr-0.5 sm:mr-2">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md font-bold text-white text-sm sm:text-base tracking-tight select-none border border-blue-400/30 shrink-0">
            {currentDayNum}
          </div>
          <span className="text-base sm:text-lg font-normal tracking-tight text-white hidden xs:inline-block">
            Calendar
          </span>
          <span className="hidden lg:inline-block px-2 py-0.5 rounded-md bg-[#2d2f31] text-[#9aa0a6] text-[11px] font-medium border border-[#3c4043]">
            Bimbingan
          </span>
        </div>

        {/* Today Button */}
        <button
          type="button"
          onClick={onToday}
          className="h-8 sm:h-9 px-2 sm:px-3 rounded-md border border-[#5f6368] hover:bg-[#3c4043]/60 text-xs sm:text-sm font-medium transition-colors shrink-0"
        >
          Hari Ini
        </button>

        {/* Previous / Next Arrow Controls */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrev}
            className="p-1 sm:p-1.5 rounded-full hover:bg-[#3c4043]/60 text-[#c4c7c5] hover:text-white transition-colors"
            title="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-1 sm:p-1.5 rounded-full hover:bg-[#3c4043]/60 text-[#c4c7c5] hover:text-white transition-colors"
            title="Berikutnya"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Month & Year Display */}
        <div className="truncate pl-0.5 sm:pl-1">
          <span className="text-xs sm:text-base md:text-lg font-semibold tracking-tight text-white capitalize hidden sm:inline">
            {fullMonthYear}
          </span>
          <span className="text-xs font-semibold tracking-tight text-white capitalize sm:hidden">
            {shortMonthYear}
          </span>
        </div>
      </div>

      {/* Right section: View Switcher, Profile Button, Role Badge, Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* View Mode Selector (Week / Month / List) */}
        <div className="relative">
          <select
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value as CalendarViewMode)}
            className="h-8 sm:h-9 rounded-md bg-[#2d2f31] border border-[#5f6368] text-xs sm:text-sm pl-2.5 pr-7 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none font-medium"
          >
            <option value="week">Minggu</option>
            <option value="month">Bulan</option>
            <option value="list">Daftar</option>
          </select>
          <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-2.5 sm:top-3 pointer-events-none text-[#9aa0a6]" />
        </div>

        {/* Whitelist Management Button for Lecturer */}
        {isLecturer && onOpenWhitelistModal && (
          <button
            type="button"
            onClick={onOpenWhitelistModal}
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-md bg-[#2d2f31] hover:bg-[#3c4043] border border-[#5f6368] text-xs font-medium text-white transition-colors flex items-center gap-1.5 shrink-0"
            title="Kelola Daftar Mahasiswa Bimbingan (Whitelist)"
          >
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Mahasiswa</span>
          </button>
        )}

        {/* Profile Link for Students */}
        {!isLecturer && (
          <Link
            href="/profile"
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-md bg-[#2d2f31] hover:bg-[#3c4043] border border-[#5f6368] text-xs font-medium text-white transition-colors flex items-center gap-1.5 shrink-0"
            title="Ubah Profil Mahasiswa (Nama, Prodi, Kelas)"
          >
            <User className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Profil</span>
          </Link>
        )}

        {/* Role Badge (Desktop only) */}
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

        {/* Logout Button */}
        <div className="shrink-0">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
