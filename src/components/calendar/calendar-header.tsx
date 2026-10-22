"use client";

import { useState, useRef, useEffect } from "react";
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
  Settings,
  GraduationCap,
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

  // Student profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileDropdownOpen(false);
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileDropdownOpen]);

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

        {/* Student Profile Avatar & Account Dropdown */}
        {!isLecturer && (
          <div className="relative shrink-0" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="relative p-0.5 rounded-full ring-2 ring-transparent hover:ring-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer flex items-center justify-center"
              title="Akun Mahasiswa"
              aria-label="Akun Mahasiswa"
            >
              {user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt={user.fullName || user.name || "Avatar"}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-[#5f6368]"
                />
              ) : (
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center border border-blue-400">
                  {user.fullName?.[0] || user.name?.[0] || "M"}
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[#1e1f20] border border-[#3c4043] shadow-2xl p-4 z-50 text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-150">
                {/* Account info section */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-[#3c4043]">
                  <div className="mb-2.5">
                    {user.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={user.image}
                        alt="Avatar"
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 rounded-full object-cover border-2 border-blue-500 shadow-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center border-2 border-blue-400 shadow-lg">
                        {user.fullName?.[0] || user.name?.[0] || "M"}
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-white text-sm">
                    {user.fullName || user.name || "Mahasiswa"}
                  </h3>

                  <p className="text-xs text-[#9aa0a6] mt-0.5 break-all max-w-full font-mono">
                    {user.email}
                  </p>

                  {(user.programStudi || user.kelas) && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2d2f31] border border-[#3c4043] text-[11px] text-[#c4c7c5]">
                      <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                      <span>
                        {user.programStudi} {user.kelas ? `(${user.kelas})` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Settings Action Link */}
                <div className="pt-3">
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs text-[#e3e3e3] hover:text-white hover:bg-[#2d2f31] border border-transparent hover:border-[#3c4043] transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[#2d2f31] group-hover:bg-[#3c4043] flex items-center justify-center text-blue-400 shrink-0 transition-colors">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium text-white group-hover:text-blue-300">
                        Pengaturan Akun
                      </p>
                      <p className="text-[10px] text-[#9aa0a6] truncate">
                        Ubah nama, program studi, atau kelas
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role Badge for Lecturer (Desktop only) */}
        {isLecturer && (
          <div className="hidden lg:block">
            <Badge className="bg-blue-600/90 text-white hover:bg-blue-600 font-medium px-2.5 py-1 text-xs flex items-center gap-1 border-0">
              <BookOpen className="h-3 w-3" />
              <span>Dosen</span>
            </Badge>
          </div>
        )}

        {/* Logout Button */}
        <div className="shrink-0">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
