import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GoogleCalendarDashboard } from "@/components/calendar/google-calendar-dashboard";
import { Role } from "@prisma/client";

// Ensure fresh data on every page load
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  // 1. Guard against unauthenticated users
  if (!session?.user) {
    redirect("/login");
  }

  const isLecturer = session.user.role === Role.LECTURER;

  // 2. Authoritative check: verify student active whitelist status
  if (!isLecturer) {
    const studentEmail = session.user.email?.toLowerCase().trim() || "";
    const isWhitelisted = await prisma.allowedStudent.findUnique({
      where: { email: studentEmail },
      select: { id: true },
    });

    if (!isWhitelisted) {
      redirect("/auth-error");
    }
  }

  // 3. Fetch authoritative user profile from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isOnboarded: true,
      fullName: true,
      programStudi: true,
      kelas: true,
      image: true,
    },
  });

  if (!isLecturer && !dbUser?.isOnboarded) {
    redirect("/onboarding");
  }

  // Attach latest DB values to session user
  if (dbUser) {
    if (dbUser.fullName) session.user.fullName = dbUser.fullName;
    if (dbUser.programStudi) session.user.programStudi = dbUser.programStudi;
    if (dbUser.kelas) session.user.kelas = dbUser.kelas;
    if (dbUser.image) session.user.image = dbUser.image;
    if (!isLecturer) session.user.isOnboarded = true;
  }

  // 4. Time-bounded slot query & cleanup of unbooked expired slots
  const now = new Date();
  const pastWindow = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
  const futureWindow = new Date(now.getFullYear(), now.getMonth() + 12, 0, 23, 59, 59, 999);

  // Clean up unbooked expired slots from database so they don't clutter the system
  try {
    await prisma.slot.deleteMany({
      where: {
        bookedById: null,
        startTime: { lte: now },
      },
    });
  } catch (err) {
    console.error("Non-blocking cleanup of expired slots:", err);
  }

  const allSlots = await prisma.slot.findMany({
    where: {
      startTime: {
        gte: pastWindow,
        lte: futureWindow,
      },
      // Only include active future slots OR past slots that were actually booked
      OR: [
        { startTime: { gt: now } },
        { bookedById: { not: null } },
      ],
    },
    orderBy: {
      startTime: "asc",
    },
    include: {
      bookedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          fullName: true,
          programStudi: true,
          kelas: true,
        },
      },
    },
  });

  // Privacy protection: sanitize other students' data when viewed by a student
  const slots = isLecturer
    ? allSlots
    : allSlots.map((s) => ({
        ...s,
        bookedBy: s.bookedById === session.user.id ? s.bookedBy : null,
      }));

  return (
    <GoogleCalendarDashboard
      initialSlots={slots}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
        fullName: session.user.fullName,
        programStudi: session.user.programStudi,
        kelas: session.user.kelas,
      }}
    />
  );
}
