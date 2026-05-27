# 🎓 منصة الجوهري — دليل التشغيل الكامل

## Stack
| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14** App Router |
| Database  | **PostgreSQL** + **Prisma ORM** |
| Auth      | **NextAuth v5** (Credentials + JWT) |
| State     | **Zustand** |
| Styling   | **Tailwind CSS** |
| Charts    | **Recharts** |
| Payments  | **Fawry API** |

---

## ⚡ تشغيل في 5 أوامر

```bash
# 1. Install
npm install

# 2. Setup env
cp .env.example .env
# عدّل: DATABASE_URL, AUTH_SECRET, VIDEO_SIGN_SECRET

# 3. Database
npx prisma db push
npx prisma generate

# 4. Seed
npx ts-node --project tsconfig.json prisma/seed.ts

# 5. Run
npm run dev
```

---

## 🔑 بيانات الدخول التجريبية

| Role | Phone | Password |
|------|-------|----------|
| Admin | `01000000000` | `Admin@1234` |
| Student | `01011422035` | `Student@123` |

**كود سنتر للاختبار:** `GHR00000001` (يضيف 100 جنيه)

---

## 🔒 الأمان — ما تم تطبيقه

### 1. Race Condition Protection
- `SELECT FOR UPDATE` في كل العمليات المالية (subscribe, center-code)
- Atomic Prisma transactions على كل operations الـ balance
- لا double-spend ممكنة حتى مع concurrent requests

### 2. Rate Limiting
| Endpoint | Limit | Block Duration |
|----------|-------|----------------|
| Login | 5 محاولات / 15 دقيقة / IP | ساعة |
| Register | 3 محاولات / ساعة / IP | ساعة |
| Subscribe | 10 / ساعة / user | ساعة |
| Center Code | 5 محاولات / 30 دقيقة / user | 4 ساعات |
| Fawry Init | 3 / 10 دقائق / user | 30 دقيقة |
| General API | 60 / دقيقة / IP | 5 دقائق |

### 3. Center Codes — CRITICAL FIX
- ❌ **قبل:** Amount محسوب من آخر 3 أرقام الكود (خطر!)
- ✅ **بعد:** جدول `CenterCode` مستقل — amount محدد من الأدمن فقط
- ✅ Codes مولّدة بـ `crypto.randomBytes` (cryptographically random)
- ✅ SELECT FOR UPDATE يمنع نفس الكود يُستخدم مرتين بالتوازي
- ✅ Error messages generic — لا تكشف إذا كان الكود موجود أو مستخدم أو منتهي

### 4. Video Protection
- ❌ **قبل:** URLs مباشرة — أي حد يعرفها يشوف الفيديو
- ✅ **بعد:** Signed tokens (HMAC-SHA256) صالحة ساعتين فقط
- ✅ Subscription check قبل إصدار أي token
- ✅ Constant-time comparison يمنع timing attacks

### 5. Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: ...strict policy...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), ...
```

### 6. Open Redirect Fix
- `callbackUrl` validated — يقبل فقط relative paths تبدأ بـ `/`
- يرفض أي URL خارجي أو protocol injection

### 7. Fawry Webhook
- HMAC-SHA256 verification على كل callback
- Amount verification — يرفض لو المبلغ مختلف
- Idempotent — نفس الـ webhook مرتين لا يحسب مرتين

### 8. Auth Security
- Timing-safe bcrypt comparison (يمنع user enumeration)
- JWT sessions (7 أيام)
- Secure cookies في production
- Login history logging

### 9. Input Validation
- Zod schemas على كل API endpoints
- `.strict()` على PATCH schemas — يرفض extra fields
- HTML sanitization على user input
- Enum validation على course filters

### 10. Error Handling
- Generic error messages للـ users
- Detailed logging server-side فقط
- Stack traces مخفية في production

---

## 📁 الـ API Endpoints

```
POST /api/auth/register              التسجيل (rate limited)
POST /api/auth/signin                تسجيل الدخول (NextAuth)

GET  /api/courses                    قائمة الكورسات (public)
POST /api/courses/:id/subscribe      اشتراك (auth + atomic)

POST /api/wallet/fawry               بدء دفع فوري
POST /api/wallet/fawry-webhook       Fawry callback (HMAC verified)
POST /api/wallet/center-code         استرداد كود سنتر (atomic)

GET  /api/user/stats                 إحصائيات المستخدم
PATCH /api/user/stats                تحديث البيانات

GET  /api/videos/:id/stream          طلب token للفيديو
POST /api/videos/:id/stream          التحقق من token

POST /admin/api/center-codes         إنشاء كودات (admin only)
GET  /admin/api/center-codes         قائمة الكودات (admin only)
```

---

## 🚀 النشر

### Environment Variables للـ Production
```bash
# Generate secrets:
openssl rand -base64 32   # for AUTH_SECRET
openssl rand -base64 32   # for VIDEO_SIGN_SECRET
openssl rand -base64 32   # for JWT_SECRET
```

### Vercel
```bash
vercel deploy
# Add env vars in Vercel Dashboard
```

### VPS
```bash
npm run build
pm2 start npm --name "elgohary" -- start
```

---

## ⚠️ ملاحظات Production

1. **Rate Limiter** — الحالي in-memory. لو عندك أكتر من instance واحد استبدله بـ Redis/Upstash
2. **Video URLs** — في production استخدم Cloudflare R2 أو Bunny.net لتوليد signed URLs بدل تخزين URL مباشر
3. **HTTPS** — إجباري قبل ما تعمل deploy أي حاجة
4. **DATABASE_URL** — استخدم connection pooler (PgBouncer) في production
