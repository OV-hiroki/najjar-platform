import { NextRequest }            from "next/server";
import { auth }                   from "@/lib/auth";
import { prisma }                 from "@/lib/prisma";
import { apiOk, apiError }        from "@/lib/utils";
import { requireAuth }            from "@/lib/security";
import { centerCodeRateLimit }    from "@/lib/rateLimit";
import { z }                      from "zod";

const schema = z.object({
  code: z.string()
    .min(6,  "الكود قصير جداً")
    .max(20, "الكود طويل جداً")
    .regex(/^[A-Z0-9]+$/i, "الكود يحتوي على حروف غير مسموح بها"),
});

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────
  const { session, res } = await requireAuth();
  if (res) return res;
  const userId = session!.user.id;

  // ── Rate limit: 5 tries / 30 min — prevents brute force ──
  const rl = centerCodeRateLimit(userId);
  if (!rl.allowed) {
    return apiError(`تجاوزت الحد المسموح — حاول بعد ${rl.retryAfterSecs} ثانية`, 429);
  }

  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const { code } = parsed.data;
    const upperCode = code.toUpperCase().trim();

    /*
     * SECURITY FIX: SELECT FOR UPDATE on CenterCode row.
     * Prevents two concurrent requests redeeming the same code simultaneously.
     * Amount is from DB — NOT derived from the code itself.
     */
    const result = await prisma.$transaction(async (tx) => {
      // Lock the code row
      const codes = await tx.$queryRaw<{
        id: string; amount: number; status: string; usedBy: string | null; expiresAt: Date | null;
      }[]>`
        SELECT id, amount, status, "usedBy", "expiresAt"
        FROM center_codes
        WHERE code = ${upperCode}
        FOR UPDATE
      `;

      const centerCode = codes[0];

      // Always delay to prevent timing-based enumeration
      await new Promise((r) => setTimeout(r, 150 + Math.random() * 100));

      if (!centerCode)                       throw new Error("INVALID");
      if (centerCode.status !== "UNUSED")    throw new Error("USED");
      if (centerCode.expiresAt && centerCode.expiresAt < new Date()) throw new Error("EXPIRED");

      const amount = centerCode.amount;

      // Mark code as used
      await tx.$executeRaw`
        UPDATE center_codes
        SET status = 'USED', "usedBy" = ${userId}, "usedAt" = NOW()
        WHERE id = ${centerCode.id}
      `;

      // Credit user balance
      await tx.user.update({
        where: { id: userId },
        data:  { balance: { increment: amount } },
      });

      // Wallet transaction log
      await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type:        "CENTER_CODE",
          status:      "CONFIRMED",
          reference:   upperCode,
          description: `شحن بكود السنتر`,
          confirmedAt: new Date(),
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          userId,
          title:   "تم شحن محفظتك! 💰",
          message: `تم إضافة ${amount} جنيه لمحفظتك بنجاح`,
          type:    "success",
        },
      });

      // Fetch updated balance
      const updated = await tx.user.findUnique({
        where:  { id: userId },
        select: { balance: true },
      });

      return { amount, newBalance: updated?.balance ?? 0 };
    });

    return apiOk(result, `✅ تم إضافة ${result.amount} جنيه لمحفظتك!`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INVALID" || msg === "USED" || msg === "EXPIRED") {
      // Same generic message for all — don't reveal which one
      return apiError("الكود غير صحيح أو تم استخدامه من قبل", 400);
    }
    console.error("[CENTER_CODE]", msg);
    return apiError("حدث خطأ — حاول مرة أخرى", 500);
  }
}
