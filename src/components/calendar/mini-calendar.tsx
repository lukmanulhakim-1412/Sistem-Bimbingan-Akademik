"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { isSameDayWIB, isTodayWIB } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
}

export function MiniCalendar({ currentDate, onSelectDate }: MiniCalendarProps) {
  const [pickerMonth, setPickerMonth] = useState(currentDate);

  const monthStart = startOfMonth(pickerMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const formattedMonthYear = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(pickerMonth);

  const dayHeaders = ["M", "S", "S", "R", "K", "J", "S"]; // Min, Sen, Sel, Rab, Kam, Jum, Sab

  return (
    <div className="w-full text-xs select-none">
      {/* Mini Calendar Header */}
      <div className="flex items-center justify-between py-1 px-1 mb-1 text-[#e3e3e3]">
        <span className="font-semibold capitalize text-sm">{formattedMonthYear}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setPickerMonth(subMonths(pickerMonth, 1))}
            className="p-1 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPickerMonth(addMonths(pickerMonth, 1))}
            className="p-1 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels (S M T W T F S) */}
      <div className="grid grid-cols-7 text-center text-[#9aa0a6] text-[11px] font-medium py-1">
        {dayHeaders.map((day, idx) => (
          <div key={idx} className="h-6 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Dates Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, pickerMonth);
          const isSelected = isSameDayWIB(day, currentDate);
          const isCurrentDay = isTodayWIB(day);

          return (
            <div key={index} className="flex items-center justify-center h-7">
              <button
                type="button"
                onClick={() => onSelectDate(day)}
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-all ${
                  isCurrentDay
                    ? "bg-blue-600 text-white font-bold"
                    : isSelected
                    ? "bg-blue-400/30 text-blue-300 font-bold"
                    : isCurrentMonth
                    ? "text-[#e3e3e3] hover:bg-[#3c4043]"
                    : "text-[#5f6368] hover:bg-[#3c4043]/50"
                }`}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
