"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { SlotWithBookedBy, UserSessionInfo } from "./types";
import { Role, MeetingType } from "@prisma/client";
import { formatTime } from "@/lib/utils";
import { Video, MapPin, Ban, Repeat } from "lucide-react";

interface MonthViewProps {
  currentDate: Date;
  slots: SlotWithBookedBy[];
  user: UserSessionInfo;
  onSelectSlot: (slot: SlotWithBookedBy) => void;
  onCreateAtDate: (date: Date) => void;
}

export function MonthView({
  currentDate,
  slots,
  user,
  onSelectSlot,
  onCreateAtDate,
}: MonthViewProps) {
  const isLecturer = user.role === Role.LECTURER;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  const dayHeaders = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#131314] text-[#e3e3e3] select-none">
      <div className="min-w-[650px] md:min-w-0 md:w-full flex flex-col min-h-full">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-[#3c4043] bg-[#1e1f20] text-center text-xs font-semibold py-2.5 text-[#9aa0a6] uppercase tracking-wider sticky top-0 z-20">
          {dayHeaders.map((header, idx) => (
            <div key={idx} className="truncate px-1">
              <span className="hidden sm:inline">{header}</span>
              <span className="sm:hidden">{header.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#3c4043] min-h-[550px]">
          {days.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const today = isToday(day);

            // Get slots for this day
            const daySlots = slots.filter((slot) =>
              isSameDay(new Date(slot.startTime), day)
            );

            return (
              <div
                key={index}
                onClick={() => {
                  if (isLecturer) {
                    onCreateAtDate(day);
                  }
                }}
                className={`p-1.5 sm:p-2 min-h-[95px] sm:min-h-[110px] flex flex-col justify-between transition-colors ${
                  !isCurrentMonth ? "bg-[#18191b]/60 text-[#5f6368]" : "bg-[#131314]"
                } ${isLecturer ? "hover:bg-blue-500/5 cursor-pointer" : ""}`}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      today
                        ? "bg-blue-600 text-white font-bold"
                        : isCurrentMonth
                        ? "text-[#e3e3e3]"
                        : "text-[#5f6368]"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {daySlots.length > 0 && (
                    <span className="text-[10px] text-[#9aa0a6] font-medium hidden sm:inline">
                      {daySlots.length} slot
                    </span>
                  )}
                </div>

                {/* Slot Pills in Day Cell */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                  {daySlots.slice(0, 3).map((slot) => {
                    const isBooked = !!slot.bookedById;
                    const isBookedByMe = slot.bookedById === user.id;
                    const isBlocked = !!slot.isBlocked;
                    const isExpired = !isBooked && new Date(slot.startTime) <= new Date();

                    let pillColor =
                      "bg-emerald-950/80 border border-emerald-600 text-emerald-300";
                    if (isBlocked) {
                      pillColor =
                        "bg-amber-950/80 border border-amber-600 text-amber-300";
                    } else if (isExpired) {
                      pillColor =
                        "bg-[#282a2d] border border-[#5f6368] text-[#9aa0a6]";
                    } else if (isBookedByMe || (isLecturer && isBooked)) {
                      pillColor =
                        "bg-blue-950/80 border border-blue-600 text-blue-300";
                    } else if (isBooked) {
                      pillColor =
                        "bg-[#282a2d] border border-[#3c4043] text-[#9aa0a6]";
                    }

                    return (
                      <div
                        key={slot.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSlot(slot);
                        }}
                        className={`text-[10px] sm:text-[11px] rounded px-1.5 py-0.5 truncate cursor-pointer font-medium hover:scale-[1.01] transition-transform flex items-center gap-1 ${pillColor}`}
                      >
                        {isBlocked ? (
                          <Ban className="h-2.5 w-2.5 shrink-0 text-amber-400" />
                        ) : slot.type === MeetingType.ONLINE ? (
                          <Video className="h-2.5 w-2.5 shrink-0" />
                        ) : (
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                        )}
                        <span className="font-semibold">
                          {formatTime(slot.startTime)}
                        </span>
                        <span className="truncate">
                          {isBlocked
                            ? slot.blockReason || (isLecturer ? "Diblokir" : "Tidak Tersedia")
                            : isExpired
                            ? "Kadaluarsa"
                            : isBooked
                            ? isLecturer
                              ? slot.bookedBy?.fullName || "Booked"
                              : isBookedByMe
                              ? "Jadwal Anda"
                              : "Terisi"
                            : "Tersedia"}
                        </span>
                        {slot.recurringGroupId && (
                          <Repeat className="h-2 w-2 shrink-0 text-blue-300 ml-auto" />
                        )}
                      </div>
                    );
                  })}

                  {daySlots.length > 3 && (
                    <div className="text-[10px] text-[#9aa0a6] font-semibold pl-1">
                      +{daySlots.length - 3} lainnya
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
