import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Background Cron Job: Clean up unbooked expired slots from the database.
 * Scheduled via vercel.json (daily at 00:00 WIB / 17:00 UTC).
 * Protected by Vercel CRON_SECRET bearer token.
 */
export async function GET(request: NextRequest) {
  // 1. Authorize: Check Bearer CRON_SECRET if configured
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // In production, reject if secret doesn't match
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();

    // Delete unbooked slots that have already started in the past
    const result = await prisma.slot.deleteMany({
      where: {
        bookedById: null,
        startTime: { lte: now },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil membersihkan ${result.count} slot kadaluarsa yang tidak dibooking.`,
      deletedCount: result.count,
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[CRON_CLEANUP_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Gagal membersihkan slot kadaluarsa." },
      { status: 500 }
    );
  }
}
