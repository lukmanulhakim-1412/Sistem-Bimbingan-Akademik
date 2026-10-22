import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { LecturerDashboard } from "@/components/lecturer-dashboard";
import { StudentDashboard } from "@/components/student-dashboard";
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
      },
    });

    if (!dbUser?.isOnboarded) {
      redirect("/onboarding");
    }

    // Attach latest DB values to session user
    session.user.fullName = dbUser.fullName;
    session.user.programStudi = dbUser.programStudi;
    session.user.kelas = dbUser.kelas;
    session.user.isOnboarded = true;
  }

  if (isLecturer) {
    // Fetch all slots for lecturer view (including student relations)
    const slots = await prisma.slot.findMany({
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

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar user={session.user} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <LecturerDashboard slots={slots} />
        </main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
          Sistem Penjadwalan Bimbingan Akademik • Dikelola oleh Dosen Universitas
        </footer>
      </div>
    );
  }

  // Student View:
  // Fetch slots booked by the current student
  const myBookings = await prisma.slot.findMany({
    where: {
      bookedById: session.user.id,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Fetch all upcoming slots (not in the past)
  const upcomingSlots = await prisma.slot.findMany({
    where: {
      endTime: {
        gte: new Date(),
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session.user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <StudentDashboard
          currentUserId={session.user.id}
          myBookings={myBookings}
          upcomingSlots={upcomingSlots}
        />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
        Sistem Penjadwalan Bimbingan Akademik Mahasiswa • Terhubung Otomatis ke Cloud Serverless
      </footer>
    </div>
  );
}
