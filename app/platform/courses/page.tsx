import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";
import PlatformLayout  from "@/components/layout/PlatformLayout";
import CoursesClient   from "./CoursesClient";

export default async function CoursesPage() {
  const session = await auth();

  const courses = await prisma.course.findMany({
    where: { isPublished: true, isActive: true },
    orderBy: { order: "asc" },
  });

  // Check subscriptions for logged-in user
  let subscribedIds: string[] = [];
  if (session?.user.id) {
    const subs = await prisma.courseSubscription.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { courseId: true },
    });
    subscribedIds = subs.map((s) => s.courseId);
  }

  const coursesWithSub = courses.map((c) => ({
    ...c,
    subscribed: subscribedIds.includes(c.id),
    startDate:  c.startDate?.toISOString(),
    endDate:    c.endDate?.toISOString(),
    createdAt:  c.createdAt.toISOString(),
    updatedAt:  c.updatedAt.toISOString(),
  }));

  return (
    <PlatformLayout showBack backHref="/platform/dashboard">
      <CoursesClient courses={coursesWithSub as never} />
    </PlatformLayout>
  );
}
