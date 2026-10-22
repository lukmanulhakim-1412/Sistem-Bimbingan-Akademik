"use client";

import { useState, useMemo } from "react";
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
import { Role, MeetingType } from "@prisma/client";
import { formatDate, formatTimeRange } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Video, MapPin, Clock, Inbox, UserCheck } from "lucide-react";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      />

      {/* 2. Main Body: Sidebar + Active Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Sidebar */}
        {isSidebarOpen && (
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
        )}

        {/* Calendar Grid Viewport */}
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
            <div className="flex-1 p-6 overflow-y-auto bg-[#131314]">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#3c4043]">
                  <h3 className="text-lg font-bold text-white">
                    Daftar Agenda Slot Konsultasi
                  </h3>
                  <Badge variant="outline" className="border-[#5f6368] text-white">
                    {filteredSlots.length} Slot Ditampilkan
                  </Badge>
                </div>

                {filteredSlots.length === 0 ? (
                  <div className="py-16 text-center text-[#9aa0a6] space-y-2">
                    <Inbox className="h-10 w-10 mx-auto text-[#5f6368]" />
                    <p className="text-sm font-semibold">Tidak ada slot yang sesuai</p>
                    <p className="text-xs">
                      Ubah filter kalender di sidebar untuk menampilkan jadwal lainnya.
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
                          className="p-4 rounded-xl border border-[#3c4043] bg-[#1e1f20] hover:border-blue-500/60 hover:bg-[#282a2d] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {formatDate(slot.startTime)}
                              </span>
                              <span className="text-xs text-[#9aa0a6] flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeRange(slot.startTime, slot.endTime)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              {slot.type === MeetingType.ONLINE ? (
                                <Badge className="bg-sky-950 text-sky-400 border border-sky-800 text-[11px] flex items-center gap-1">
                                  <Video className="h-3 w-3" />
                                  <span>Online Teams</span>
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>Offline di Kampus</span>
                                </Badge>
                              )}

                              {isBooked ? (
                                <Badge className="bg-blue-600 text-white text-[11px]">
                                  {isBookedByMe
                                    ? "Jadwal Anda"
                                    : isLecturer
                                    ? "Sudah Dibooking"
                                    : "Terisi"}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-600 text-white text-[11px]">
                                  Tersedia
                                </Badge>
                              )}
                            </div>

                            {/* Details preview */}
                            {slot.locationDetails && (
                              <p className="text-xs text-[#9aa0a6] truncate max-w-md">
                                {slot.locationDetails}
                              </p>
                            )}
                          </div>

                          {/* Student Info if booked and user is lecturer */}
                          {isLecturer && isBooked && slot.bookedBy && (
                            <div className="text-xs text-right text-blue-300 font-medium sm:border-l sm:border-[#3c4043] sm:pl-4">
                              <div className="flex items-center gap-1.5 justify-end">
                                <UserCheck className="h-3.5 w-3.5" />
                                <span className="font-semibold text-white">
                                  {slot.bookedBy.fullName || slot.bookedBy.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#9aa0a6]">
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
    </div>
  );
}
