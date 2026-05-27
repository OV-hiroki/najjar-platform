import { NextRequest }              from "next/server";
import { requireAuth }              from "@/lib/security";
import { prisma }                   from "@/lib/prisma";
import { initiateFawryCharge }      from "@/lib/fawry";
import { apiOk, apiError }          from "@/lib/utils";
import { fawryRateLimit }           from "@/lib/rateLimit";
import { z }                        from "zod";

const schema = z.object({
  amount: z.number()
    .min(10,    "الحد الأدنى للشحن ١٠ جنيه")
    .max(10000, "الحد الأقصى للشحن ١٠٠٠٠ جنيه")
    .multipleOf(0.01),
});

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth();
  if (res) return res;
  const userId = session!.user.id;

  // ── Rate limit: 3 initiations per 10 min ─────────
  const rl = fawryRateLimit(userId);
  if (!rl.allowed) return apiError(`حاول بعد ${rl.retryAfterSecs} ثانية`, 429);

  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const { amount } = parsed.data;

    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { phone: true },
    });
    if (!user) return apiError("المستخدم غير موجود", 404);

    // Create PENDING transaction first
    const tx = await prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type:        "FAWRY",
        status:      "PENDING",
        description: `شحن ${amount} جنيه عبر فوري`,
      },
    });

    try {
      const fawryRes = await initiateFawryCharge({
        userId,
        amount,
        phone: user.phone,
        txId:  tx.id,
      });

      await prisma.walletTransaction.update({
        where: { id: tx.id },
        data:  { reference: fawryRes.referenceNumber },
      });

      return apiOk({
        referenceNumber: fawryRes.referenceNumber,
        merchantRefNum:  fawryRes.merchantRefNum,
        expiryDate:      fawryRes.expiryDate,
        amount,
      });
    } catch (fawryErr) {
      // Mark transaction as failed
      await prisma.walletTransaction.update({
        where: { id: tx.id },
        data:  { status: "FAILED" },
      });

      // Dev fallback
      if (process.env.NODE_ENV === "development") {
        const mockRef = `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        await prisma.walletTransaction.update({
          where: { id: tx.id },
          data:  { reference: mockRef, status: "PENDING" },
        });
        return apiOk({
          referenceNumber: mockRef,
          merchantRefNum:  `ELG-DEV-${Date.now()}`,
          expiryDate:      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          amount,
          _dev: true,
        });
      }

      console.error("[FAWRY_INIT]", fawryErr instanceof Error ? fawryErr.message : fawryErr);
      return apiError("فشل الاتصال بخدمة فوري — حاول مرة أخرى", 503);
    }
  } catch (err) {
    console.error("[FAWRY_ROUTE]", err instanceof Error ? err.message : err);
    return apiError("حدث خطأ داخلي", 500);
  }
}
