import { NextRequest }          from "next/server";
import { prisma }               from "@/lib/prisma";
import { verifyFawryWebhook }   from "@/lib/security";
import { apiOk, apiError }      from "@/lib/utils";

/**
 * Fawry Payment Callback Webhook
 * Fawry POSTs to this URL when payment status changes.
 * We verify the HMAC signature before crediting the user.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      merchantCode, fawryRefNum, customerMerchantCode,
      paymentAmount, orderStatus, signature,
    } = body;

    // ── CRITICAL: Verify Fawry signature ──────────────
    const valid = verifyFawryWebhook({
      merchantCode:  merchantCode  ?? "",
      fawryRefNum:   fawryRefNum   ?? "",
      paymentAmount: String(paymentAmount ?? ""),
      orderStatus:   orderStatus   ?? "",
      signature:     signature     ?? "",
    });

    if (!valid) {
      console.warn("[FAWRY_WEBHOOK] Invalid signature from IP:", req.headers.get("x-forwarded-for"));
      return apiError("Invalid signature", 403);
    }

    // Only process PAID status
    if (orderStatus !== "PAID") {
      return apiOk({ processed: false, reason: "not_paid" });
    }

    // Find the pending transaction by Fawry reference
    const tx = await prisma.walletTransaction.findFirst({
      where: {
        reference: fawryRefNum,
        type:      "FAWRY",
        status:    "PENDING",
      },
    });

    if (!tx) {
      // Already processed or unknown ref
      return apiOk({ processed: false, reason: "not_found_or_duplicate" });
    }

    // Verify amount matches (prevent amount tampering)
    if (Math.abs(tx.amount - parseFloat(paymentAmount)) > 0.01) {
      console.error("[FAWRY_WEBHOOK] Amount mismatch", { expected: tx.amount, got: paymentAmount });
      return apiError("Amount mismatch", 400);
    }

    // ── Credit user balance + confirm transaction ──────
    await prisma.$transaction([
      prisma.walletTransaction.update({
        where: { id: tx.id },
        data:  { status: "CONFIRMED", confirmedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: tx.userId },
        data:  { balance: { increment: tx.amount } },
      }),
      prisma.notification.create({
        data: {
          userId:  tx.userId,
          title:   "تم شحن محفظتك! 💰",
          message: `تم إضافة ${tx.amount} جنيه عبر فوري بنجاح`,
          type:    "success",
        },
      }),
    ]);

    return apiOk({ processed: true });
  } catch (err) {
    console.error("[FAWRY_WEBHOOK]", err instanceof Error ? err.message : err);
    return apiError("Internal error", 500);
  }
}
