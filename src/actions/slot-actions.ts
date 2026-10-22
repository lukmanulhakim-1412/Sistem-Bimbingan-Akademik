"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MeetingType, Role } from "@prisma/client";

const createSlotSchema = z.object({
  date: z.string().min(1, "Tanggal harus dipilih"),
  startTime: z.string().min(1, "Waktu mulai harus dipilih"),
  type: z.nativeEnum(MeetingType, {
    errorMap: () => ({ message: "Jenis pertemuan tidak valid" }),
  }),
  locationDetails: z.string().optional(),
  repeatWeekly: z.boolean().optional(),
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

  const raw = {
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    type: formData.get("type"),
    locationDetails: formData.get("locationDetails") || undefined,
    repeatWeekly:
      formData.get("repeatWeekly") === "on" ||
      formData.get("repeatWeekly") === "true",
  };

  const parsed = createSlotSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Input slot jadwal tidak valid.",
    };
  }

  const { date, startTime, type, locationDetails, repeatWeekly } = parsed.data;

  // Construct start DateTime
  const startDateTime = new Date(`${date}T${startTime}`);
  if (isNaN(startDateTime.getTime())) {
    return {
      success: false,
      error: "Format tanggal atau waktu tidak valid.",
    };
  }

  // End time: exactly 60 minutes after startTime
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  const slotsToCreate = [
    {
      startTime: startDateTime,
      endTime: endDateTime,
      type,
      locationDetails: locationDetails?.trim() || null,
    },
  ];

  if (repeatWeekly) {
    // Exact same day next week (+7 days in milliseconds)
    const nextWeekStart = new Date(
      startDateTime.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    const nextWeekEnd = new Date(nextWeekStart.getTime() + 60 * 60 * 1000);

    slotsToCreate.push({
      startTime: nextWeekStart,
      endTime: nextWeekEnd,
      type,
      locationDetails: locationDetails?.trim() || null,
    });
  }

  try {
    await prisma.slot.createMany({
      data: slotsToCreate,
    });

    revalidatePath("/");
    return {
      success: true,
      message: repeatWeekly
        ? "2 slot bimbingan berhasil dibuat (minggu ini & minggu depan pada hari yang sama)!"
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

  if (!slotId) {
    return {
      success: false,
      error: "ID Slot jadwal tidak valid.",
    };
  }

  try {
    // CRITICAL ATOMIC CONDITIONAL UPDATE:
    // Prevents race conditions by locking condition in a single database statement
    const result = await prisma.slot.updateMany({
      where: {
        id: slotId,
        bookedById: null, // Atomic lock condition
        startTime: { gt: new Date() }, // Prevent booking past slots
      },
      data: {
        bookedById: session.user.id,
        bookedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        error: "Maaf, slot jadwal ini baru saja dibooking oleh mahasiswa lain atau sudah kedaluwarsa.",
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
 */
export async function deleteSlot(slotId: string): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.LECTURER) {
    return {
      success: false,
      error: "Akses ditolak: Hanya Dosen yang berhak menghapus slot jadwal.",
    };
  }

  if (!slotId) {
    return {
      success: false,
      error: "ID Slot jadwal tidak valid.",
    };
  }

  try {
    await prisma.slot.delete({
      where: { id: slotId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Gagal menghapus slot:", err);
    return {
      success: false,
      error: "Gagal menghapus slot jadwal dari sistem.",
    };
  }
}
