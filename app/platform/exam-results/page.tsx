import { auth }             from "@/lib/auth";
import { redirect }         from "next/navigation";
import { prisma }           from "@/lib/prisma";
import PlatformLayout      from "@/components/layout/PlatformLayout";
import ExamResultsClient   from "./ExamResultsClient";

export default async function ExamResultsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const examResults = await prisma.examResult.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { exam: { select: { title: true, duration: true } } },
  });

  const hwResults = await prisma.homeworkResult.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { homework: { select: { title: true } } },
  });

  const avg = examResults.length > 0
    ? Math.round(examResults.reduce((a, r) => a + r.percentage, 0) / examResults.length)
    : null;

  return (
    <PlatformLayout showBack backHref="/platform/profile">
      <ExamResultsClient
        examResults={examResults.map((r) => ({
          id:         r.id,
          score:      r.score,
          total:      r.total,
          percentage: r.percentage,
          createdAt:  r.createdAt.toISOString(),
          examTitle:  r.exam.title,
          duration:   r.duration,
        }))}
        hwResults={hwResults.map((r) => ({
          id:        r.id,
          score:     r.score,
          total:     r.total,
          createdAt: r.createdAt.toISOString(),
          hwTitle:   r.homework.title,
        }))}
        avgPercentage={avg}
      />
    </PlatformLayout>
  );
}
