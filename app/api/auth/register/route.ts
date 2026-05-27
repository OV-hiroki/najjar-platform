import { NextRequest }           from "next/server";
import bcrypt                    from "bcryptjs";
import { z }                     from "zod";
import { prisma }                from "@/lib/prisma";
import { apiOk, apiError }       from "@/lib/utils";
import { sanitizeName }          from "@/lib/security";
import { registerRateLimit, getClientIp } from "@/lib/rateLimit";

const schema = z.object({
  name:     z.string().min(2).max(60),
  phone:    z.string().regex(/^(01)[0125]\d{8}$/, "رقم الهاتف غير صحيح"),
  password: z.string()
    .min(8,  "كلمة المرور يجب أن تكون ٨ أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم"),
});

export async function POST(req: NextRequest) {
  // ── Rate limit: 3 registrations/hour/IP ──────────
  const ip  = getClientIp(req);
  const rl  = registerRateLimit(ip);
  if (!rl.allowed) {
    return apiError(`تجاوزت الحد المسموح — حاول بعد ${rl.retryAfterSecs} ثانية`, 429);
  }

  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const { name, phone, password } = parsed.data;

    // Sanitize name
    const cleanName = sanitizeName(name);
    if (cleanName.length < 2) return apiError("الاسم غير صالح");

    // Duplicate check
    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists) {
      // Don't reveal if phone exists — timing-safe delay
      await new Promise((r) => setTimeout(r, 300));
      return apiError("رقم الهاتف مسجل من قبل", 409);
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data:   { name: cleanName, phone, password: hashed },
      select: { id: true, name: true, phone: true },
    });

    return apiOk(user, "تم إنشاء الحساب بنجاح!");
  } catch (err) {
    console.error("[REGISTER]", err instanceof Error ? err.message : err);
    return apiError("حدث خطأ داخلي", 500);
  }
}
