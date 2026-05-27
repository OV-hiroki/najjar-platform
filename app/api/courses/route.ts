import { NextRequest }       from "next/server";
import { prisma }            from "@/lib/prisma";
import { auth }              from "@/lib/auth";
import { apiOk, apiError }   from "@/lib/utils";
import { apiRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // Generic API rate limit
  const ip = getClientIp(req);
  const rl = apiRateLimit(ip);
  if (!rl.allowed) return apiError("تجاوزت الحد المسموح", 429);

  try {
    const { searchParams } = req.nextUrl;
    const subject = searchParams.get("subject");
    const type    = searchParams.get("type");
    const search  = (searchParams.get("search") ?? "").slice(0, 100); // limit search length
    const page    = Math.max(1, Math.min(100, parseInt(searchParams.get("page")  ?? "1")));
    const limit   = Math.max(1, Math.min(24,  parseInt(searchParams.get("limit") ?? "6")));

    // Validate enum values
    const validSubjects = ["MECH", "ELEC", "WAVES", "ALL"];
    const validTypes    = ["FINAL_FULL", "LECTURE", "SINGLE", "WORKSHOP", "CAMP", "EXAM"];
    const safeSubject   = subject && validSubjects.includes(subject) ? subject : null;
    const safeType      = type    && validTypes.includes(type)       ? type    : null;

    const where: Record<string, unknown> = {
      isPublished: true,
      isActive:    true,
    };

    if (safeSubject) where.subject = { in: [safeSubject, "ALL"] };
    if (safeType)    where.type    = safeType;
    if (search)      where.OR      = [
      { title:       { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: { order: "asc" },
        skip:    (page - 1) * limit,
        take:    limit,
        // Never return internal fields in API
        select: {
          id: true, title: true, description: true, subject: true,
          type: true, price: true, oldPrice: true, grade: true,
          thumbnail: true, startDate: true, endDate: true,
          totalVideos: true, order: true, createdAt: true,
        },
      }),
      prisma.course.count({ where }),
    ]);

    // Attach subscription status
    const session = await auth();
    let subscribedIds: string[] = [];
    if (session?.user.id) {
      const subs = await prisma.courseSubscription.findMany({
        where:  { userId: session.user.id, status: "ACTIVE" },
        select: { courseId: true },
      });
      subscribedIds = subs.map((s) => s.courseId);
    }

    return apiOk({
      courses: courses.map((c) => ({
        ...c,
        subscribed: subscribedIds.includes(c.id),
        startDate:  c.startDate?.toISOString() ?? null,
        endDate:    c.endDate?.toISOString()   ?? null,
        createdAt:  c.createdAt.toISOString(),
      })),
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    console.error("[GET /api/courses]", err instanceof Error ? err.message : err);
    return apiError("حدث خطأ في جلب الكورسات", 500);
  }
}
