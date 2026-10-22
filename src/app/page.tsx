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

  // 2. Authoritative check for students: verify onboarding in DB
  if (!isLecturer) {
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

    if (!dbUser?.isOnboarded) {
      redirect("/onboarding");
    }

    // Attach latest DB values to session user
    session.user.fullName = dbUser.fullName;
    session.user.programStudi = dbUser.programStudi;
    session.user.kelas = dbUser.kelas;
    session.user.image = dbUser.image || session.user.image;
    session.user.isOnboarded = true;
  }

  // Fetch all slots
  const allSlots = await prisma.slot.findMany({
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
