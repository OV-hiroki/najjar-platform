import { NextRequest }       from "next/server";
import { prisma }            from "@/lib/prisma";
import { requireAdmin }      from "@/lib/security";
import { apiOk, apiError }   from "@/lib/utils";
import { z }                 from "zod";
import crypto                from "crypto";

const schema = z.object({
  count:    z.number().min(1).max(1000),
  amount:   z.number().min(10).max(5000),
  expiresAt:z.string().optional(),
  batchId:  z.string().optional(),
});

/**
 * POST /admin/api/center-codes
 * Admin-only: generate a batch of center codes with a fixed amount.
 * Amount is set HERE by admin — never derived from the code itself.
 */
export async function POST(req: NextRequest) {
  const { session, res } = await requireAdmin();
  if (res) return res;

  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const { count, amount, expiresAt, batchId } = parsed.data;

    const codes = Array.from({ length: count }, () => ({
      code:        generateCode(),
      amount,
      expiresAt:   expiresAt ? new Date(expiresAt) : null,
      batchId:     batchId ?? `BATCH-${Date.now()}`,
      createdById: session!.user.id,
    }));

    await prisma.centerCode.createMany({ data: codes });

    return apiOk({
      created: count,
      batchId: codes[0].batchId,
      amount,
      codes:   codes.map((c) => c.code),  // return codes for printing
    });
  } catch (err) {
    console.error("[ADMIN CENTER CODES]", err instanceof Error ? err.message : err);
    return apiError("فشل إنشاء الكودات", 500);
  }
}

/** GET /admin/api/center-codes — list codes */
export async function GET(req: NextRequest) {
  const { res } = await requireAdmin();
  if (res) return res;

  const { searchParams } = req.nextUrl;
  const status  = searchParams.get("status") ?? undefined;
  const batchId = searchParams.get("batchId") ?? undefined;

  const codes = await prisma.centerCode.findMany({
    where: {
      ...(status  ? { status: status as never }  : {}),
      ...(batchId ? { batchId }                  : {}),
    },
    orderBy: { createdAt: "desc" },
    take:    200,
  });

  return apiOk(codes);
}

// ── Generate cryptographically random 11-char code ─────
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";  // no 0/O/1/I confusion
  let result  = "";
  const bytes = crypto.randomBytes(11);
  for (let i = 0; i < 11; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
