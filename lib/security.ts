import crypto    from "crypto";
import { auth }  from "@/lib/auth";
import { apiError } from "@/lib/utils";

// ─── Auth guards ──────────────────────────────────────

/** Require authenticated user. Returns session or 401 response. */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) return { session: null, res: apiError("يجب تسجيل الدخول", 401) };
  return { session, res: null };
}

/** Require ADMIN role. Returns session or 403 response. */
export async function requireAdmin() {
  const { session, res } = await requireAuth();
  if (res) return { session: null, res };
  if (session!.user.role !== "ADMIN") return { session: null, res: apiError("غير مصرح لك", 403) };
  return { session, res: null };
}

// ─── URL helpers ──────────────────────────────────────

/** Validate callbackUrl to prevent open redirect */
export function sanitizeCallbackUrl(url: string | null, fallback = "/platform/dashboard"): string {
  if (!url) return fallback;
  try {
    // Must be a relative path starting with /
    if (!url.startsWith("/") || url.startsWith("//")) return fallback;
    // No protocol injection
    if (/^[a-z]+:/i.test(url)) return fallback;
    // No external domains
    const decoded = decodeURIComponent(url);
    if (decoded.includes("://") || decoded.startsWith("//")) return fallback;
    return url;
  } catch {
    return fallback;
  }
}

// ─── Signed Video URLs ────────────────────────────────

const VIDEO_SECRET = process.env.VIDEO_SIGN_SECRET ?? "fallback-sign-secret-change-in-prod";

/**
 * Generate a signed token for video access.
 * Token = HMAC-SHA256(videoId + userId + expiresAt)
 * Valid for `ttlSeconds` (default: 2 hours)
 */
export function signVideoUrl(videoId: string, userId: string, ttlSeconds = 7200): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload   = `${videoId}:${userId}:${expiresAt}`;
  const sig       = crypto
    .createHmac("sha256", VIDEO_SECRET)
    .update(payload)
    .digest("hex");
  const token = Buffer.from(JSON.stringify({ videoId, userId, expiresAt, sig })).toString("base64url");
  return token;
}

/** Verify a signed video token. Returns null if invalid/expired. */
export function verifyVideoToken(token: string): { videoId: string; userId: string } | null {
  try {
    const { videoId, userId, expiresAt, sig } = JSON.parse(Buffer.from(token, "base64url").toString());
    if (Math.floor(Date.now() / 1000) > expiresAt) return null;  // expired

    const payload  = `${videoId}:${userId}:${expiresAt}`;
    const expected = crypto.createHmac("sha256", VIDEO_SECRET).update(payload).digest("hex");
    // Constant-time comparison to prevent timing attacks
    const valid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    return valid ? { videoId, userId } : null;
  } catch {
    return null;
  }
}

// ─── Fawry Webhook Signature ──────────────────────────

/**
 * Verify Fawry callback/webhook signature.
 * Fawry signs with: SHA-256(merchantCode + fawryRefNum + paymentAmount + orderStatus + securityKey)
 */
export function verifyFawryWebhook(params: {
  merchantCode:  string;
  fawryRefNum:   string;
  paymentAmount: string;
  orderStatus:   string;
  signature:     string;
}): boolean {
  const securityKey = process.env.FAWRY_SECURITY_KEY ?? "";
  const raw = params.merchantCode + params.fawryRefNum + params.paymentAmount + params.orderStatus + securityKey;
  const expected = crypto.createHash("sha256").update(raw).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(params.signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── Input Sanitization ───────────────────────────────

/** Strip HTML tags to prevent XSS in stored strings */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")            // remove HTML tags
    .replace(/javascript:/gi, "")       // remove JS URLs
    .replace(/on\w+\s*=/gi, "")         // remove event handlers
    .trim();
}

/** Sanitize a name field */
export function sanitizeName(name: string): string {
  return sanitizeString(name).slice(0, 100);
}

// ─── Safe logging ─────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === "production";

export const logger = {
  info:  (msg: string, meta?: object) => {
    if (!IS_PROD) console.log(`[INFO]  ${msg}`, meta ?? "");
  },
  warn:  (msg: string, meta?: object) => {
    console.warn(`[WARN]  ${msg}`, meta ?? "");
  },
  error: (msg: string, err?: unknown) => {
    // In production: never log full stack traces to stdout
    if (IS_PROD) {
      console.error(`[ERROR] ${msg}`, err instanceof Error ? err.message : "unknown");
    } else {
      console.error(`[ERROR] ${msg}`, err);
    }
  },
};

// ─── Rate limit response helper ───────────────────────
export function rateLimitError(retryAfterSecs: number) {
  return Response.json(
    { success: false, error: `تجاوزت الحد المسموح — حاول بعد ${retryAfterSecs} ثانية` },
    {
      status:  429,
      headers: {
        "Retry-After": String(retryAfterSecs),
        "X-RateLimit-Limit":     "exceeded",
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
