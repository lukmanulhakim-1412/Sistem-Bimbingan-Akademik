import { Slot, User, MeetingType, Role } from "@prisma/client";

export type CalendarViewMode = "week" | "month" | "list";

export type SlotWithBookedBy = Slot & {
  bookedBy: Pick<User, "id" | "name" | "email" | "fullName" | "programStudi" | "kelas"> | null;
};

export interface CalendarFilters {
  showAvailable: boolean;
  showBooked: boolean;
  showMyBookingsOnly: boolean;
  showOnline: boolean;
  showOffline: boolean;
}

export interface UserSessionInfo {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
  fullName?: string | null;
  programStudi?: string | null;
  kelas?: string | null;
}
