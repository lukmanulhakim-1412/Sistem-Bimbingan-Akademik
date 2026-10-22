import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatTimeRange(start: Date | string, end: Date | string): string {
  return `${formatTime(start)} - ${formatTime(end)} WIB`;
}

export type WIBParts = {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/**
 * Extracts date and time components strictly in Asia/Jakarta (WIB, UTC+7) timezone.
 * Immune to the browser's local timezone settings.
 */
export function getWIBParts(date: Date | string): WIBParts {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") {
      map[p.type] = parseInt(p.value, 10);
    }
  }
  const hour = map.hour === 24 ? 0 : (map.hour ?? 0);
  return {
    year: map.year ?? 2026,
    month: (map.month ?? 1) - 1,
    day: map.day ?? 1,
    hour,
    minute: map.minute ?? 0,
    second: map.second ?? 0,
  };
}

/**
 * Returns a Date representing the WIB day at 00:00:00
 */
export function getWIBDate(date: Date | string = new Date()): Date {
  const p = getWIBParts(date);
  return new Date(p.year, p.month, p.day);
}

/**
 * Checks whether two dates fall on the same day in WIB (Asia/Jakarta) timezone.
 */
export function isSameDayWIB(date1: Date | string, date2: Date | string): boolean {
  const p1 = getWIBParts(date1);
  const p2 = getWIBParts(date2);
  return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
}

/**
 * Checks whether a given date is today in WIB (Asia/Jakarta) timezone.
 */
export function isTodayWIB(date: Date | string): boolean {
  return isSameDayWIB(date, new Date());
}
