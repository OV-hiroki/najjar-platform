import { NextRequest }       from "next/server";
import { prisma }            from "@/lib/prisma";
import { requireAuth }       from "@/lib/security";
import { apiOk, apiError }   from "@/lib/utils";
import { sanitizeName }      from "@/lib/security";
import { z }                 from "zod";

const patchSchema = z.object({
  centerId: z.string().min(6).max(30).regex(/^[A-Z0-9\-]+$/i).optional(),
  name:     z.string().min(2).max(60).optional(),
  email:    z.string().email().optional(),
}).strict();  // no extra fields allowed

export async function GET() {
  const { session, res } = await requireAuth();
  if (res) return res;
  const userId = session!.user.id;

  try {
    const [user, completedCount, examAgg, hwAgg, savedCount, activeSubs] = await Promise.all([
      prisma.user.findUnique({
        where:  { id: userId },
        select: { balance: true, points: true },
      }),
      prisma.courseSubscription.count({
        where: { userId, progress: { gte: 100 } },
      }),
      prisma.examResult.aggregate({
        where: { userId },
        _avg:  { percentage: true },
        _count:{ id: true },
      }),
      prisma.homeworkResult.aggregate({
        where: { userId },
        _avg:  { score: true },
        _count:{ id: true },
      }),
      prisma.savedVideo.count({ where: { userId } }),
      prisma.courseSubscription.count({ where: { userId, status: "ACTIVE" } }),
    ]);

    return apiOk({
      balance:          user?.balance       ?? 0,
      points:           user?.points        ?? 0,
      completedCourses: completedCount,
      activeCourses:    activeSubs,
      savedVideos:      savedCount,
      exams:    { count: examAgg._count.id, avg: Math.round(examAgg._avg.percentage ?? 0) },
      homework: { count: hwAgg._count.id,   avg: Math.round(hwAgg._avg.score ?? 0)       },
      weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    });
  } catch (err) {
    console.error("[USER STATS GET]", err instanceof Error ? err.message : err);
    return apiError("حدث خطأ", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const { session, res } = await requireAuth();
  if (res) return res;

  try {
    const body   = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const updates = parsed.data;
    const data: Record<string, unknown> = {};

    if (updates.name)     data.name     = sanitizeName(updates.name);
    if (updates.email)    data.email    = updates.email.toLowerCase().trim();
    if (updates.centerId) data.centerId = updates.centerId.toUpperCase().trim();

    if (Object.keys(data).length === 0) return apiError("لا يوجد تحديثات");

    await prisma.user.update({ where: { id: session!.user.id }, data });

    return apiOk(null, "تم الحفظ بنجاح");
  } catch (err) {
    console.error("[USER STATS PATCH]", err instanceof Error ? err.message : err);
    return apiError("فشل الحفظ", 500);
  }
}
