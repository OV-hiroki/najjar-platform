import { auth }          from "@/lib/auth";
import { redirect }      from "next/navigation";
import { prisma }        from "@/lib/prisma";
import PlatformLayout   from "@/components/layout/PlatformLayout";
import DashboardClient  from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, phone: true, balance: true, points: true,
      _count: {
        select: {
          subscriptions: { where: { status: "ACTIVE" } },
          savedVideos: true,
        },
      },
      subscriptions: {
        where: { status: "ACTIVE" },
        select: {
          progress: true,
          course: { select: { id: true, title: true, thumbnail: true } },
        },
        take: 3,
      },
    },
  });

  if (!user) redirect("/auth/login");

  // Suggested courses (not subscribed)
  const subscribedIds = user.subscriptions.map((s) => s.course.id);
  const suggested = await prisma.course.findMany({
    where: { isPublished: true, isActive: true, id: { notIn: subscribedIds } },
    orderBy: { order: "asc" },
    take: 4,
  });

  // Weekly activity (last 7 days) — placeholder zeros until real video watch tracking
  const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];

  const completedCount = await prisma.courseSubscription.count({
    where: { userId: user.id, progress: { gte: 100 } },
  });

  return (
    <PlatformLayout>
      <DashboardClient
        user={{
          id:       user.id,
          name:     user.name,
          phone:    user.phone,
          balance:  user.balance,
          points:   user.points,
          activeCourses:    user._count.subscriptions,
          completedCourses: completedCount,
          savedVideos:      user._count.savedVideos,
        }}
        activeSubs={user.subscriptions}
        suggested={suggested as never}
        weeklyActivity={weeklyActivity}
      />
    </PlatformLayout>
  );
}
