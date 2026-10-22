import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Background Cron Job: Clean up unbooked expired slots from the database.
 * Scheduled via vercel.json (daily at 00:00 WIB / 17:00 UTC).
 * Protected by Vercel CRON_SECRET bearer token and IP rate limit.
 */
export async function GET(request: NextRequest) {
  // 1. Rate Limit: 10 requests / minute per client IP
  const clientIp = extractClientIp(request.headers);
  const rateCheck = checkRateLimit(`cron-cleanup:${clientIp}`, 10, 60);

  if (!rateCheck.success) {
    return NextResponse.json(
      {
        error: `Terlalu banyak permintaan ke endpoint ini. Silakan coba lagi setelah ${rateCheck.resetInSeconds} detik.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.resetInSeconds),
        },
      }
    );
  }

  // 2. Authorize: Check Bearer CRON_SECRET if configured
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
