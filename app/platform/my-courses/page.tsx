import { auth }         from "@/lib/auth";
import { redirect }     from "next/navigation";
import { prisma }       from "@/lib/prisma";
import PlatformLayout  from "@/components/layout/PlatformLayout";
import MyCoursesClient from "./MyCoursesClient";

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const subscriptions = await prisma.courseSubscription.findMany({
    where:   { userId: session.user.id, status: "ACTIVE" },
    include: {
      course: {
        select: {
          id: true, title: true, subject: true, type: true,
          price: true, thumbnail: true, totalVideos: true,
        },
      },
    },
    orderBy: { subscribedAt: "desc" },
  });

  const data = subscriptions.map((s) => ({
    id:             s.id,
    progress:       s.progress,
    videosWatched:  s.videosWatched,
    examsCompleted: s.examsCompleted,
    subscribedAt:   s.subscribedAt.toISOString(),
    course: {
      ...s.course,
      createdAt:  "",
      updatedAt:  "",
      isActive:   true,
      isPublished:true,
      grade:      "٣ ث",
      order:      0,
    },
  }));

  return (
    <PlatformLayout showBack>
      <MyCoursesClient subscriptions={data as never} />
    </PlatformLayout>
  );
}
