import { NextRequest }               from "next/server";
import { prisma }                    from "@/lib/prisma";
import { requireAuth }               from "@/lib/security";
import { apiOk, apiError }           from "@/lib/utils";
import { subscribeRateLimit }        from "@/lib/rateLimit";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── Auth ─────────────────────────────────────────
  const { session, res } = await requireAuth();
  if (res) return res;
  const userId   = session!.user.id;
  const courseId = params.id;

  // ── Rate limit ────────────────────────────────────
  const rl = subscribeRateLimit(userId);
  if (!rl.allowed) return apiError(`حاول بعد ${rl.retryAfterSecs} ثانية`, 429);

  // ── Validate courseId ──────────────────────────────
  if (!courseId || courseId.length > 30 || !/^[a-z0-9]+$/i.test(courseId)) {
    return apiError("معرف الكورس غير صالح", 400);
  }

  try {
    // ── Fetch course ──────────────────────────────────
    const course = await prisma.course.findUnique({
      where:  { id: courseId },
      select: { id: true, price: true, title: true, isActive: true, isPublished: true },
    });
    if (!course || !course.isActive || !course.isPublished) {
      return apiError("الكورس غير متاح", 404);
    }

    // ── Check existing subscription ────────────────────
    const existing = await prisma.courseSubscription.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return apiError("أنت مشترك بالفعل في هذا الكورس", 409);

    /*
     * SECURITY FIX: Use SELECT FOR UPDATE via raw query to prevent race conditions.
     * This locks the user row during the transaction, preventing double-spend
     * from concurrent requests.
     */
    const result = await prisma.$transaction(async (tx) => {
      // Lock and fetch current balance atomically
      const users = await tx.$queryRaw<{ balance: number }[]>`
        SELECT balance FROM users WHERE id = ${userId} FOR UPDATE
      `;
      const user = users[0];
      if (!user) throw new Error("USER_NOT_FOUND");

      if (user.balance < course.price) {
        throw new Error(`INSUFFICIENT:${course.price - user.balance}`);
      }

      // Deduct balance
      await tx.user.update({
        where: { id: userId },
        data:  { balance: { decrement: course.price } },
      });

      // Create subscription
      await tx.courseSubscription.create({
        data: { userId, courseId },
      });

      // Wallet transaction log
      await tx.walletTransaction.create({
        data: {
          userId,
          amount:      course.price,
          type:        "PURCHASE",
          status:      "CONFIRMED",
          description: `اشتراك في: ${course.title}`,
          confirmedAt: new Date(),
        },
      });

      // Invoice
      const invoice = await tx.invoice.create({
        data: {
          userId,
          total:    course.price,
          discount: 0,
          items: {
            create: { courseId, price: course.price, quantity: 1 },
          },
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          userId,
          title:   "تم الاشتراك بنجاح! 🎉",
          message: `تم اشتراكك في "${course.title}" — ابدأ دلوقتي!`,
          type:    "success",
          link:    `/platform/courses/${courseId}`,
        },
      });

      return { invoiceId: invoice.id, newBalance: user.balance - course.price };
    });

    return apiOk(
      { subscribed: true, newBalance: result.newBalance, invoiceId: result.invoiceId },
      "تم الاشتراك بنجاح!"
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("INSUFFICIENT:")) {
      const needed = msg.split(":")[1];
      return apiError(`رصيدك غير كافٍ — تحتاج ${needed} جنيه إضافية`, 402);
    }
    if (msg === "USER_NOT_FOUND") return apiError("المستخدم غير موجود", 404);
    console.error("[SUBSCRIBE]", msg);
    return apiError("حدث خطأ — حاول مرة أخرى", 500);
  }
}
