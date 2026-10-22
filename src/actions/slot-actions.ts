"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MeetingType, Role } from "@prisma/client";
import { formatDate, formatTimeRange } from "@/lib/utils";
import { assertRateLimit } from "@/lib/rate-limit";

const createSlotSchema = z.object({
  date: z.string().min(1, "Tanggal harus dipilih"),
  startTime: z.string().min(1, "Waktu mulai harus dipilih"),
  type: z.nativeEnum(MeetingType, {
    errorMap: () => ({ message: "Jenis pertemuan tidak valid" }),
  }).default(MeetingType.ONLINE),
  locationDetails: z
    .string()
    .max(300, "Tautan / lokasi maksimal 300 karakter")
    .optional(),
  isBlocked: z.boolean().optional(),
  blockReason: z
    .string()
    .max(150, "Alasan blokir maksimal 150 karakter")
    .optional(),
  repeatWeekly: z.boolean().optional(),
  repeatWeeksCount: z.number().min(2).max(24).optional().default(12),
});

export type ActionResponse = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * Create a new consultation slot (LECTURER ONLY)
 * End time is automatically set to startTime + 60 minutes (1 hour)
 * If repeatWeekly is true, automatically creates a second slot exactly 7 days later (same day & time next week)
 */
export async function createSlot(formData: FormData): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang memiliki hak untuk membuat slot jadwal.",
    };
  }

  const rateCheck = await assertRateLimit("createSlot", {
    limit: 12,
    userId: session.user.id,
  });
  if (!rateCheck.success) {
    return { success: false, error: rateCheck.error };
  }

  const raw = {
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    type: formData.get("type") || MeetingType.ONLINE,
    locationDetails: formData.get("locationDetails") || undefined,
    isBlocked:
      formData.get("isBlocked") === "on" ||
      formData.get("isBlocked") === "true",
    blockReason: formData.get("blockReason") || undefined,
    repeatWeekly:
      formData.get("repeatWeekly") === "on" ||
      formData.get("repeatWeekly") === "true",
    repeatWeeksCount: formData.get("repeatWeeksCount")
      ? Number(formData.get("repeatWeeksCount"))
      : 12,
  };

  const parsed = createSlotSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Input slot jadwal tidak valid.",
    };
  }

  const {
    date,
    startTime,
    type,
    locationDetails,
    isBlocked,
    blockReason,
    repeatWeekly,
    repeatWeeksCount,
  } = parsed.data;

  // Construct start DateTime explicitly in WIB timezone (+07:00)
  const timeWithSeconds = startTime.length === 5 ? `${startTime}:00` : startTime;
  const startDateTime = new Date(`${date}T${timeWithSeconds}+07:00`);
  if (isNaN(startDateTime.getTime())) {
    return {
      success: false,
      error: "Format tanggal atau waktu tidak valid.",
    };
  }

  // Prevent creating slots in the past
  if (startDateTime.getTime() <= Date.now()) {
    return {
      success: false,
      error: "Tidak dapat membuat jadwal di waktu yang sudah lewat.",
    };
  }

  const recurringGroupId = repeatWeekly ? crypto.randomUUID() : null;
  const weeksToGenerate = repeatWeekly ? (repeatWeeksCount || 12) : 1;
  const slotsToCreate = [];

  for (let k = 0; k < weeksToGenerate; k++) {
    const slotStart = new Date(
      startDateTime.getTime() + k * 7 * 24 * 60 * 60 * 1000
    );
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    slotsToCreate.push({
      startTime: slotStart,
      endTime: slotEnd,
      type: isBlocked ? MeetingType.ONLINE : type,
      locationDetails: isBlocked ? null : locationDetails?.trim() || null,
      isBlocked: Boolean(isBlocked),
      blockReason: isBlocked ? blockReason?.trim() || "Dosen Sibuk / Rapat" : null,
      recurringGroupId,
    });
  }

  try {
    // 1. Overlap Prevention: Check for any conflicting schedule in database
    const conflictingSlot = await prisma.slot.findFirst({
      where: {
        OR: slotsToCreate.map((s) => ({
          startTime: { lt: s.endTime },
          endTime: { gt: s.startTime },
        })),
      },
      select: {
        startTime: true,
        endTime: true,
        isBlocked: true,
        blockReason: true,
      },
    });

    if (conflictingSlot) {
      const formattedDate = formatDate(conflictingSlot.startTime);
      const formattedRange = formatTimeRange(
        conflictingSlot.startTime,
        conflictingSlot.endTime
      );
      return {
        success: false,
        error: `Gagal membuat jadwal: Waktu bentrok dengan jadwal lain yang sudah terdaftar pada ${formattedDate} (${formattedRange}).`,
      };
    }

    // 2. Insert new non-overlapping slots
    await prisma.slot.createMany({
      data: slotsToCreate,
    });

    revalidatePath("/");
    return {
      success: true,
      message: repeatWeekly
        ? `${weeksToGenerate} slot mingguan berhasil dibuat secara otomatis!`
        : isBlocked
        ? "Jadwal berhasil diblokir (1 jam)."
        : "Slot bimbingan 1 jam berhasil ditambahkan!",
    };
  } catch (err) {
    console.error("Gagal membuat slot:", err);
    return {
      success: false,
      error: "Gagal menyimpan slot jadwal baru.",
    };
  }
}

/**
 * Update slot's meeting link or location details (LECTURER ONLY)
 */
export async function updateSlotLocation(
  slotId: string,
  locationDetails: string
): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang berhak mengubah tautan pertemuan.",
    };
  }

  const rateCheck = await assertRateLimit("updateSlotLocation", {
    limit: 30,
    userId: session.user.id,
  });
  if (!rateCheck.success) {
    return { success: false, error: rateCheck.error };
  }

  if (!slotId) {
    return {
      success: false,
      error: "ID Slot jadwal tidak valid.",
    };
  }

  if (locationDetails && locationDetails.length > 300) {
    return {
      success: false,
      error: "Tautan / lokasi maksimal 300 karakter.",
    };
  }

  try {
    await prisma.slot.update({
      where: { id: slotId },
      data: {
        locationDetails: locationDetails.trim() || null,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Tautan pertemuan berhasil diperbarui!",
    };
  } catch (err) {
    console.error("Gagal mengubah tautan slot:", err);
    return {
      success: false,
      error: "Gagal menyimpan perubahan tautan pertemuan.",
    };
  }
}

/**
 * Book an available slot (STUDENT ONLY & MUST BE ONBOARDED)
 * Uses atomic conditional updateMany to prevent race conditions.
 */
export async function bookSlot(slotId: string): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Silakan login terlebih dahulu untuk membooking jadwal.",
    };
  }

  const rateCheck = await assertRateLimit("bookSlot", {
    limit: 10,
    userId: session.user.id,
  });
  if (!rateCheck.success) {
    return { success: false, error: rateCheck.error };
  }

  if (session.user.role !== Role.STUDENT) {
    return {
      success: false,
      error: "Akses ditolak: Hanya akun Mahasiswa yang dapat membooking jadwal bimbingan.",
    };
  }

  if (!session.user.isOnboarded) {
    return {
      success: false,
      error: "Anda harus melengkapi profil onboarding sebelum melakukan booking.",
    };
  }

  // Active Whitelist Guard: Verify student is currently authorized by Lecturer
  const studentEmail = session.user.email?.toLowerCase().trim() || "";
  const isWhitelisted = await prisma.allowedStudent.findUnique({
    where: { email: studentEmail },
    select: { id: true },
  });

  if (!isWhitelisted) {
    return {
      success: false,
      error:
        "Akses ditolak: Akun Anda tidak lagi terdaftar dalam daftar mahasiswa bimbingan yang diizinkan.",
    };
  }

  if (!slotId) {
    return {
      success: false,
      error: "ID Slot jadwal tidak valid.",
    };
  }

  try {
    // 1. Check existing slot status first to provide precise, friendly feedback
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        startTime: true,
        bookedById: true,
        isBlocked: true,
      },
    });

    if (!slot) {
      return {
        success: false,
        error: "Slot jadwal tidak ditemukan atau telah dihapus.",
      };
    }

    if (slot.isBlocked) {
      return {
        success: false,
        error: "Maaf, slot jadwal ini sedang diblokir oleh Dosen dan tidak dapat dipesan.",
      };
    }

    if (slot.bookedById) {
      return {
        success: false,
        error: "Maaf, slot jadwal ini baru saja dibooking oleh mahasiswa lain.",
      };
    }

    // Prevent booking past slots with a friendly and clear error message
    if (new Date(slot.startTime) <= new Date()) {
      return {
        success: false,
        error: "Tidak dapat membooking jadwal ini karena waktu pelaksanaan konsultasi sudah lewat (kadaluarsa).",
      };
    }

    // 2. CRITICAL ATOMIC CONDITIONAL UPDATE:
    // Prevents race conditions by locking condition in a single database statement
    const result = await prisma.slot.updateMany({
      where: {
        id: slotId,
        bookedById: null, // Atomic lock condition: must not be booked yet
        isBlocked: false, // Cannot book blocked slots
        startTime: { gt: new Date() },
      },
      data: {
        bookedById: session.user.id,
        bookedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        error: "Maaf, slot jadwal ini baru saja dibooking oleh mahasiswa lain atau waktu pelaksanaan telah lewat.",
      };
    }

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Gagal membooking slot:", err);
    return {
      success: false,
      error: "Terjadi kesalahan internal saat memproses booking.",
    };
  }
}

/**
 * Unassign a booked slot (LECTURER ONLY)
 * Clears bookedById and bookedAt, restoring slot availability without deleting the slot.
 */
export async function unassignSlot(slotId: string): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang berhak membatalkan alokasi slot booking.",
    };
  }

  const rateCheck = await assertRateLimit("unassignSlot", {
    limit: 10,
    userId: session.user.id,
  });
  if (!rateCheck.success) {
    return { success: false, error: rateCheck.error };
  }

  if (!slotId) {
    return {
      success: false,
      error: "ID Slot jadwal tidak valid.",
    };
  }

  try {
    await prisma.slot.update({
      where: { id: slotId },
      data: {
        bookedById: null,
        bookedAt: null,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Gagal unassign slot:", err);
    return {
      success: false,
      error: "Gagal membatalkan alokasi booking slot.",
    };
  }
}

/**
 * Delete a slot permanently (LECTURER ONLY)
 * If deleteFollowing is true and the slot belongs to a recurring series,
 * deletes this slot and all following slots in that series.
 */
export async function deleteSlot(
  slotId: string,
  deleteFollowing = false
): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang berhak menghapus slot jadwal.",
    };
  }

  const rateCheck = await assertRateLimit("deleteSlot", {
    limit: 30,
    userId: session.user.id,
  });
  if (!rateCheck.success) {
    return { success: false, error: rateCheck.error };
  }

  if (!slotId) {
    return {
      success: false,
      error: "ID Slot jadwal tidak valid.",
    };
  }

  try {
    const targetSlot = await prisma.slot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        recurringGroupId: true,
        startTime: true,
        bookedById: true,
      },
    });

    if (!targetSlot) {
      return {
        success: false,
        error: "Slot jadwal tidak ditemukan.",
      };
    }

    // Guardrail: Do not allow direct deletion if the slot is currently booked by a student
    if (targetSlot.bookedById) {
      return {
        success: false,
        error:
          "Jadwal yang sudah dibooking oleh mahasiswa tidak dapat langsung dihapus. Silakan batalkan booking terlebih dahulu.",
      };
    }

    if (deleteFollowing && targetSlot.recurringGroupId) {
      // Guardrail: Ensure no subsequent slots in this recurring series are booked
      const hasBookedFollowing = await prisma.slot.findFirst({
        where: {
          recurringGroupId: targetSlot.recurringGroupId,
          startTime: { gte: targetSlot.startTime },
          bookedById: { not: null },
        },
        select: { id: true },
      });

      if (hasBookedFollowing) {
        return {
          success: false,
          error:
            "Tidak dapat menghapus seluruh rangkaian: Terdapat jadwal pada minggu berikutnya yang sudah dibooking mahasiswa. Silakan batalkan booking pada jadwal terkait terlebih dahulu.",
        };
      }

      const deleted = await prisma.slot.deleteMany({
        where: {
          recurringGroupId: targetSlot.recurringGroupId,
          startTime: { gte: targetSlot.startTime },
        },
      });

      revalidatePath("/");
      return {
        success: true,
        message: `${deleted.count} jadwal berseri mingguan berhasil dihapus.`,
      };
    }

    // Default: delete single slot
    await prisma.slot.delete({
      where: { id: slotId },
    });

    revalidatePath("/");
    return { success: true, message: "Slot jadwal berhasil dihapus." };
  } catch (err) {
    console.error("Gagal menghapus slot:", err);
    return {
      success: false,
      error: "Gagal menghapus slot jadwal dari sistem.",
    };
  }
}

/**
 * Toggle block status on a slot (LECTURER ONLY)
 */
export async function toggleSlotBlock(
  slotId: string,
  blockReason?: string
): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang berhak mengubah status blokir jadwal.",
    };
  }

  const rateCheck = await assertRateLimit("toggleSlotBlock", {
    limit: 30,
    userId: session.user.id,
  });
  if (!rateCheck.success) {
    return { success: false, error: rateCheck.error };
  }

  if (!slotId) {
    return { success: false, error: "ID Slot jadwal tidak valid." };
  }

  if (blockReason && blockReason.trim().length > 150) {
    return {
      success: false,
      error: "Alasan blokir maksimal 150 karakter.",
    };
  }

  try {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return { success: false, error: "Slot tidak ditemukan." };
    }

    if (slot.bookedById) {
      return {
        success: false,
        error:
          "Slot yang sudah dibooking oleh mahasiswa tidak dapat diblokir langsung. Batalkan booking terlebih dahulu.",
      };
    }

    const nextBlockedState = !slot.isBlocked;

    await prisma.slot.update({
      where: { id: slotId },
      data: {
        isBlocked: nextBlockedState,
        blockReason: nextBlockedState
          ? blockReason?.trim() || "Dosen Sibuk / Rapat"
          : null,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: nextBlockedState
        ? "Jadwal berhasil diblokir."
        : "Blokir jadwal berhasil dibuka (slot kini tersedia).",
    };
  } catch (err) {
    console.error("Gagal mengubah status blokir:", err);
    return {
      success: false,
      error: "Gagal mengubah status blokir jadwal.",
    };
  }
}

/**
 * Update private lecturer notes on a booked slot (LECTURER ONLY)
 * Max 280 characters. Visible exclusively to lecturers.
 */
export async function updateLecturerNotes(
  slotId: string,
  notes: string
): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang memiliki hak untuk menambahkan catatan.",
    };
  }

  const rateCheck = await assertRateLimit("updateLecturerNotes", {
    limit: 30,
    userId: session.user.id,
  });
  if (!rateCheck.success) {
    return { success: false, error: rateCheck.error };
  }

  if (!slotId) {
    return { success: false, error: "ID Slot jadwal tidak valid." };
  }

  const trimmedNotes = notes?.trim() || "";
  if (trimmedNotes.length > 280) {
    return {
      success: false,
      error: "Catatan maksimal 280 karakter.",
    };
  }

  try {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      select: { id: true, bookedById: true },
    });

    if (!slot) {
      return { success: false, error: "Slot tidak ditemukan." };
    }

    if (!slot.bookedById) {
      return {
        success: false,
        error: "Catatan hanya dapat ditambahkan pada jadwal yang sudah dibooking oleh mahasiswa.",
      };
    }

    await prisma.slot.update({
      where: { id: slotId },
      data: {
        lecturerNotes: trimmedNotes.length > 0 ? trimmedNotes : null,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: trimmedNotes.length > 0
        ? "Catatan dosen berhasil disimpan."
        : "Catatan dosen berhasil dihapus.",
    };
  } catch (err) {
    console.error("Gagal menyimpan catatan dosen:", err);
    return {
      success: false,
      error: "Gagal menyimpan catatan dosen.",
    };
  }
}
