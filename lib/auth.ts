import NextAuth        from "next-auth";
import Credentials    from "next-auth/providers/credentials";
import bcrypt         from "bcryptjs";
import { z }          from "zod";
import { prisma }     from "@/lib/prisma";
import { loginRateLimit } from "@/lib/rateLimit";

const loginSchema = z.object({
  phone:    z.string().regex(/^(01)[0125]\d{8}$/, "رقم الهاتف غير صحيح"),
  password: z.string().min(6),
  ip:       z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session:  { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },   // 7 days

  pages: {
    signIn: "/auth/login",
    error:  "/auth/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone:    { label: "Phone",    type: "text"     },
        password: { label: "Password", type: "password" },
        ip:       { label: "IP",       type: "text"     },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new Error("بيانات الدخول غير صحيحة");

        const { phone, password, ip } = parsed.data;

        // ── Rate limit per IP ────────────────────────
        if (ip) {
          const rl = loginRateLimit(ip);
          if (!rl.allowed) {
            throw new Error(`تم إيقاف حسابك مؤقتاً — حاول بعد ${rl.retryAfterSecs} ثانية`);
          }
        }

        const user = await prisma.user.findUnique({ where: { phone } });

        // Always run bcrypt — prevent timing-based user enumeration
        const dummyHash = "$2b$12$invalidhashfordummycompare000000000000000000000";
        const valid = user
          ? await bcrypt.compare(password, user.password)
          : await bcrypt.compare(password, dummyHash).then(() => false);

        if (!user || !valid) throw new Error("رقم الهاتف أو كلمة المرور غير صحيحة");
        if (!user.isActive)  throw new Error("تم تعليق حسابك — تواصل مع الدعم الفني");

        // Log login
        await prisma.loginHistory.create({
          data: { userId: user.id, ip: ip ?? null },
        });

        return {
          id:     user.id,
          name:   user.name,
          phone:  user.phone,
          email:  user.email ?? undefined,
          role:   user.role,
          avatar: user.avatar ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id     = user.id;
        token.phone  = (user as { phone: string }).phone;
        token.role   = (user as { role: string }).role;
        token.avatar = (user as { avatar?: string }).avatar;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id     = token.id     as string;
        session.user.phone  = token.phone  as string;
        session.user.role   = token.role   as string;
        session.user.avatar = token.avatar as string | undefined;
      }
      return session;
    },
  },

  // Prevent session fixation
  useSecureCookies: process.env.NODE_ENV === "production",
});
