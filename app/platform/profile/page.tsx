import { auth }         from "@/lib/auth";
import { redirect }     from "next/navigation";
import { prisma }       from "@/lib/prisma";
import PlatformLayout  from "@/components/layout/PlatformLayout";
import ProfileClient   from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: {
      id: true, name: true, phone: true, email: true,
      avatar: true, balance: true, points: true,
      centerId: true, createdAt: true,
      _count: {
        select: {
          subscriptions: { where: { progress: { gte: 100 } } },
        },
      },
    },
  });

  if (!user) redirect("/auth/login");

  const loginHistory = await prisma.loginHistory.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const examAvg = await prisma.examResult.aggregate({
    where:   { userId: session.user.id },
    _avg:    { percentage: true },
    _count:  { id: true },
  });

  const homeworkAvg = await prisma.homeworkResult.aggregate({
    where:  { userId: session.user.id },
    _avg:   { score: true },
    _count: { id: true },
  });

  return (
    <PlatformLayout showBack>
      <ProfileClient
        user={{
          ...user,
          completedCourses: user._count.subscriptions,
          createdAt:        user.createdAt.toISOString(),
        }}
        loginHistory={loginHistory.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        }))}
        examStats={{
          count: examAvg._count.id,
          avg:   Math.round(examAvg._avg.percentage ?? 0),
        }}
        homeworkStats={{
          count: homeworkAvg._count.id,
          avg:   Math.round(homeworkAvg._avg.score ?? 0),
        }}
      />
    </PlatformLayout>
  );
}
