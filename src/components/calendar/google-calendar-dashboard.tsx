"use client";

import { useState, useMemo, useEffect } from "react";
import {
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from "date-fns";
import {
  CalendarViewMode,
  CalendarFilters,
  SlotWithBookedBy,
  UserSessionInfo,
} from "./types";
import { CalendarHeader } from "./calendar-header";
import { CalendarSidebar } from "./calendar-sidebar";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { CreateSlotModal } from "./create-slot-modal";
import { SlotDetailModal } from "./slot-detail-modal";
import { StudentWhitelistModal } from "./student-whitelist-modal";
import { Role, MeetingType } from "@prisma/client";
import { formatDate, formatTimeRange } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Video, MapPin, Clock, Inbox, UserCheck, X } from "lucide-react";

interface GoogleCalendarDashboardProps {
  initialSlots: SlotWithBookedBy[];
  user: UserSessionInfo;
}

export function GoogleCalendarDashboard({
  initialSlots,
  user,
}: GoogleCalendarDashboardProps) {
  const isLecturer = user.role === Role.LECTURER;

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set default sidebar open on desktop screens
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Filters State
  const [filters, setFilters] = useState<CalendarFilters>({
    showAvailable: true,
    showBooked: true,
    showMyBookingsOnly: false,
  });

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<Date | null>(null);
  const [createInitialHour, setCreateInitialHour] = useState<number | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<SlotWithBookedBy | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Student Whitelist Modal State (Lecturer only)
  const [isWhitelistModalOpen, setIsWhitelistModalOpen] = useState(false);

  // KPI Calculations
  const totalSlots = initialSlots.length;
  const availableCount = initialSlots.filter((s) => s.bookedById === null).length;
  const bookedCount = initialSlots.filter((s) => s.bookedById !== null).length;

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    return initialSlots.filter((slot) => {
      const isBooked = slot.bookedById !== null;
      const isAvailable = !isBooked;
      const isBookedByMe = slot.bookedById === user.id;

      if (!filters.showAvailable && isAvailable) return false;
      if (!filters.showBooked && isBooked) return false;
      if (filters.showMyBookingsOnly && !isBookedByMe) return false;

      return true;
    });
  }, [initialSlots, filters, user.id]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenCreateModal = (date?: Date, hour?: number) => {
    setCreateInitialDate(date || currentDate);
    setCreateInitialHour(hour ?? null);
    setIsCreateModalOpen(true);
  };

  const handleSelectSlot = (slot: SlotWithBookedBy) => {
    setSelectedSlot(slot);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#131314] text-[#e3e3e3] overflow-hidden">
      {/* 1. Google Calendar Top Header */}
      <CalendarHeader
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user}
        onOpenWhitelistModal={
          isLecturer ? () => setIsWhitelistModalOpen(true) : undefined
        }
      />

      {/* 2. Main Body: Sidebar + Active Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar (inline) */}
        {isSidebarOpen && (
          <div className="hidden lg:flex flex-col shrink-0 w-64 h-full min-h-full bg-[#1e1f20] border-r border-[#3c4043] overflow-hidden">
            <CalendarSidebar
              currentDate={currentDate}
              onSelectDate={(d) => setCurrentDate(d)}
              filters={filters}
              onFilterChange={setFilters}
              user={user}
              onOpenCreateModal={() => handleOpenCreateModal()}
              totalSlots={totalSlots}
              availableCount={availableCount}
              bookedCount={bookedCount}
            />
          </div>
        )}

        {/* Mobile / Tablet Drawer (slide-over with backdrop) */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
            />
            {/* Offcanvas Drawer Content */}
            <div className="relative z-50 h-full w-72 max-w-[85vw] bg-[#1e1f20] shadow-2xl flex flex-col border-r border-[#3c4043] animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-[#3c4043] flex items-center justify-between">
                <span className="font-semibold text-sm text-white">Menu Kalender</span>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <CalendarSidebar
                  currentDate={currentDate}
                  onSelectDate={(d) => {
                    setCurrentDate(d);
                    setIsSidebarOpen(false);
                  }}
                  filters={filters}
                  onFilterChange={setFilters}
                  user={user}
                  onOpenCreateModal={() => {
                    handleOpenCreateModal();
                    setIsSidebarOpen(false);
                  }}
                  totalSlots={totalSlots}
                  availableCount={availableCount}
                  bookedCount={bookedCount}
                />
              </div>
            </div>
          </div>
        )}

        {/* Calendar Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {viewMode === "week" && (
            <WeekView
              currentDate={currentDate}
              slots={filteredSlots}
              user={user}
              onSelectSlot={handleSelectSlot}
              onCreateAtTime={(d, h) => handleOpenCreateModal(d, h)}
            />
          )}

          {viewMode === "month" && (
            <MonthView
              currentDate={currentDate}
              slots={filteredSlots}
              user={user}
              onSelectSlot={handleSelectSlot}
              onCreateAtDate={(d) => handleOpenCreateModal(d)}
            />
          )}

          {viewMode === "list" && (
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#131314]">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#3c4043]">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Daftar Agenda Slot Konsultasi
                  </h3>
                  <Badge variant="outline" className="border-[#5f6368] text-white text-xs">
                    {filteredSlots.length} Slot
                  </Badge>
                </div>

                {filteredSlots.length === 0 ? (
                  <div className="py-16 text-center text-[#9aa0a6] space-y-2">
                    <Inbox className="h-10 w-10 mx-auto text-[#5f6368]" />
                    <p className="text-sm font-semibold">Tidak ada slot yang sesuai</p>
                    <p className="text-xs">
                      Buka menu filter kalender untuk menampilkan jadwal lainnya.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSlots.map((slot) => {
                      const isBooked = !!slot.bookedById;
                      const isBookedByMe = slot.bookedById === user.id;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => handleSelectSlot(slot)}
                          className="p-3.5 sm:p-4 rounded-xl border border-[#3c4043] bg-[#1e1f20] hover:border-blue-500/60 hover:bg-[#282a2d] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs sm:text-sm">
                                {formatDate(slot.startTime)}
                              </span>
                              <span className="text-[11px] sm:text-xs text-[#9aa0a6] flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeRange(slot.startTime, slot.endTime)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              {slot.type === MeetingType.ONLINE ? (
                                <Badge className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] sm:text-[11px] flex items-center gap-1">
                                  <Video className="h-3 w-3" />
                                  <span>Online Teams</span>
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] sm:text-[11px] flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>Tatap Muka</span>
                                </Badge>
                              )}

                              {isBooked ? (
                                <Badge className="bg-blue-600 text-white text-[10px] sm:text-[11px]">
                                  {isBookedByMe
                                    ? "Jadwal Anda"
                                    : isLecturer
                                    ? "Sudah Dibooking"
                                    : "Terisi"}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-600 text-white text-[10px] sm:text-[11px]">
                                  Tersedia
                                </Badge>
                              )}
                            </div>

                            {slot.locationDetails && (
                              <p className="text-[11px] sm:text-xs text-[#9aa0a6] truncate max-w-md">
                                {slot.locationDetails}
                              </p>
                            )}
                          </div>

                          {isLecturer && isBooked && slot.bookedBy && (
                            <div className="text-xs text-left sm:text-right text-blue-300 font-medium sm:border-l sm:border-[#3c4043] sm:pl-4">
                              <div className="flex items-center gap-1.5 sm:justify-end">
                                <UserCheck className="h-3.5 w-3.5" />
                                <span className="font-semibold text-white">
                                  {slot.bookedBy.fullName || slot.bookedBy.name}
                                </span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-[#9aa0a6]">
                                {slot.bookedBy.programStudi} ({slot.bookedBy.kelas})
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Create Slot Modal */}
      {isLecturer && (
        <CreateSlotModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialDate={createInitialDate}
          initialHour={createInitialHour}
        />
      )}

      {/* 4. Slot Detail & Action Modal */}
      <SlotDetailModal
        slot={selectedSlot}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSlot(null);
        }}
        user={user}
      />

      {/* 5. Student Whitelist Management Modal (Lecturer only) */}
      {isLecturer && (
        <StudentWhitelistModal
          isOpen={isWhitelistModalOpen}
          onClose={() => setIsWhitelistModalOpen(false)}
        />
      )}
    </div>
  );
}
