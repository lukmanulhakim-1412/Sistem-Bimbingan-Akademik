"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { SlotWithBookedBy, UserSessionInfo } from "./types";
import { Role, MeetingType } from "@prisma/client";
import { formatTime } from "@/lib/utils";
import { Video, MapPin, Lock, User, Plus } from "lucide-react";

interface WeekViewProps {
  currentDate: Date;
  slots: SlotWithBookedBy[];
  user: UserSessionInfo;
  onSelectSlot: (slot: SlotWithBookedBy) => void;
  onCreateAtTime: (date: Date, hour: number) => void;
}

// Full 24-hour day coverage on the calendar grid (00:00 to 23:59)
const START_HOUR = 0;
const END_HOUR = 23;
const HOUR_HEIGHT = 64; // px per hour

export function WeekView({
  currentDate,
  slots,
  user,
  onSelectSlot,
  onCreateAtTime,
}: WeekViewProps) {
  const isLecturer = user.role === Role.LECTURER;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to daytime / current time on initial mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const targetHour = Math.max(
        0,
        Math.min(currentHour > 7 ? currentHour - 1 : 7, 18)
      );
      scrollContainerRef.current.scrollTop = targetHour * HOUR_HEIGHT;
    }
  }, []);

  // Calculate 7 days for the current week starting on Sunday
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Live current time calculation for the red line
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentIndicatorTop = (nowMinutes / 60) * HOUR_HEIGHT;
  const isNowWithinHours = true;

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-auto bg-[#131314] text-[#e3e3e3] select-none"
    >
      {/* Responsive Wrapper: Min-width on mobile allows smooth horizontal swipe, flex-1 on desktop */}
      <div className="min-w-[700px] md:min-w-0 md:w-full flex flex-col">
        {/* 1. Week Header Row (Sticky at Top) */}
        <div className="flex border-b border-[#3c4043] bg-[#1e1f20] shrink-0 sticky top-0 z-20">
          {/* Timezone label (Sticky top-left intersection) */}
          <div className="w-14 sm:w-20 shrink-0 border-r border-[#3c4043] flex flex-col items-center justify-end pb-2 text-[10px] sm:text-xs text-[#9aa0a6] font-medium sticky left-0 z-30 bg-[#1e1f20]">
            <span>GMT+07</span>
          </div>

          {/* 7 Day Header Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-[#3c4043]">
            {weekDays.map((day, idx) => {
              const today = isToday(day);
              const dayName = format(day, "EEE").toUpperCase();
              const dayNum = day.getDate();

              return (
                <div
                  key={idx}
                  className="py-2 sm:py-3 flex flex-col items-center justify-center gap-1 text-center"
                >
                  <span
                    className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                      today ? "text-blue-400 font-bold" : "text-[#9aa0a6]"
                    }`}
                  >
                    {dayName}
                  </span>

                  <div
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                      today
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold"
                        : "text-[#e3e3e3] hover:bg-[#3c4043]/50"
                    }`}
                  >
                    {dayNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Calendar Grid (Hours & 7 Days) */}
        <div className="flex relative">
          {/* Sticky Time Gutter Column */}
          <div className="w-14 sm:w-20 shrink-0 border-r border-[#3c4043] bg-[#18191b] sticky left-0 z-10 select-none text-[#9aa0a6]">
            {hoursArray.map((hour) => {
              const nextHour = (hour + 1) % 24;
              const period = nextHour >= 12 ? "PM" : "AM";
              const displayHour =
                nextHour > 12 ? nextHour - 12 : nextHour === 0 ? 12 : nextHour;

              return (
                <div
                  key={hour}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="border-b border-[#2d2f31] relative pr-1.5 sm:pr-2 flex items-start justify-end text-[10px] sm:text-[11px] font-medium"
                >
                  {/* Time label sitting centered on the hour dividing line */}
                  <span className="absolute -bottom-2.5 right-1.5 sm:right-2 bg-[#18191b] px-0.5 sm:px-1 leading-none text-[#9aa0a6] z-10">
                    {displayHour} {period}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 7 Day Columns Grid */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-[#3c4043] relative">
            {weekDays.map((day, dayIndex) => {
              const today = isToday(day);

              // Filter slots falling on this day
              const daySlots = slots.filter((slot) =>
                isSameDay(new Date(slot.startTime), day)
              );

              return (
                <div
                  key={dayIndex}
                  className="relative flex flex-col"
                  style={{ height: `${hoursArray.length * HOUR_HEIGHT}px` }}
                >
                  {/* Horizontal Hour Lines (and click to create slot for lecturer) */}
                  {hoursArray.map((hour) => (
                    <div
                      key={hour}
                      onClick={() => {
                        if (isLecturer) {
                          onCreateAtTime(day, hour);
                        }
                      }}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className={`border-b border-[#2d2f31] relative group transition-colors ${
                        isLecturer ? "hover:bg-blue-500/5 cursor-pointer" : ""
                      }`}
                    >
                      {/* Hover indicator for lecturers */}
                      {isLecturer && (
                        <div className="hidden group-hover:flex items-center gap-1 absolute inset-x-1 inset-y-1 rounded border border-dashed border-blue-500/40 bg-blue-500/10 text-blue-300 text-[10px] px-1 font-medium z-0 truncate">
                          <Plus className="h-3 w-3 shrink-0" />
                          <span className="truncate">Slot {hour}:00</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Red Live Time Indicator on Today's Column */}
                  {today && isNowWithinHours && (
                    <div
                      style={{ top: `${currentIndicatorTop}px` }}
                      className="absolute inset-x-0 z-20 pointer-events-none flex items-center"
                    >
                      <div className="h-2.5 w-2.5 rounded-full bg-[#ea4335] -ml-1.5 shadow" />
                      <div className="flex-1 border-t-2 border-[#ea4335]" />
                    </div>
                  )}

                  {/* Render Slot Cards in this Column */}
                  {daySlots.map((slot) => {
                    const start = new Date(slot.startTime);
                    const end = new Date(slot.endTime);

                    const startH = start.getHours();
                    const startM = start.getMinutes();
                    const durationMinutes =
                      (end.getTime() - start.getTime()) / (1000 * 60);

                    // Calculate position
                    const top =
                      ((startH * 60 + startM - START_HOUR * 60) / 60) *
                      HOUR_HEIGHT;
                    const height = Math.max(
                      (durationMinutes / 60) * HOUR_HEIGHT,
                      36
                    );

                    const isBooked = !!slot.bookedById;
                    const isBookedByMe = slot.bookedById === user.id;

                    // Google Calendar Card Theme Styles
                    let cardStyles = "";
                    if (isBookedByMe) {
                      cardStyles =
                        "bg-[#1b3a57] border-l-4 border-l-blue-400 border border-blue-500/40 text-blue-100 hover:bg-[#204777]";
                    } else if (isLecturer && isBooked) {
                      cardStyles =
                        "bg-[#1e3a5f] border-l-4 border-l-blue-400 border border-blue-500/40 text-blue-100 hover:bg-[#264a77]";
                    } else if (!isBooked) {
                      cardStyles =
                        "bg-[#0d381e] border-l-4 border-l-emerald-400 border border-emerald-500/40 text-emerald-100 hover:bg-[#134927]";
                    } else {
                      // Booked by other student
                      cardStyles =
                        "bg-[#282a2d] border border-[#3c4043] text-[#9aa0a6] opacity-70 hover:opacity-85";
                    }

                    return (
                      <div
                        key={slot.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSlot(slot);
                        }}
                        style={{
                          top: `${top}px`,
                          height: `${height - 3}px`,
                        }}
                        className={`absolute inset-x-1 rounded-md p-1.5 z-10 cursor-pointer shadow-md transition-all overflow-hidden flex flex-col justify-between ${cardStyles}`}
                      >
                        <div>
                          {/* Title & Type */}
                          <div className="flex items-center gap-1 font-semibold text-[11px] leading-tight truncate">
                            {slot.type === MeetingType.ONLINE ? (
                              <Video className="h-3 w-3 shrink-0 text-sky-400" />
                            ) : (
                              <MapPin className="h-3 w-3 shrink-0 text-emerald-400" />
                            )}
                            <span className="truncate">
                              {slot.type === MeetingType.ONLINE
                                ? "Teams"
                                : "Tatap Muka"}
                            </span>
                          </div>

                          {/* Time Range */}
                          <div className="text-[10px] text-white/80 font-medium mt-0.5">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </div>
                        </div>

                        {/* Status / Student Info */}
                        <div className="text-[10px] truncate mt-0.5">
                          {isBooked ? (
                            isLecturer ? (
                              <span className="flex items-center gap-1 font-medium text-blue-200">
                                <User className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">
                                  {slot.bookedBy?.fullName ||
                                    slot.bookedBy?.name ||
                                    "Mahasiswa"}
                                </span>
                              </span>
                            ) : isBookedByMe ? (
                              <span className="font-semibold text-blue-300">
                                Jadwal Anda
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[#9aa0a6]">
                                <Lock className="h-2.5 w-2.5 shrink-0" />
                                <span>Terisi</span>
                              </span>
                            )
                          ) : (
                            <span className="text-emerald-300 font-medium">
                              Tersedia
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
