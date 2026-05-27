/**
 * In-memory rate limiter — no external dependency needed.
 * For production with multiple instances → swap store to Redis/Upstash.
 */

interface RateLimitEntry {
  count:     number;
  resetAt:   number;  // ms timestamp
  blocked:   boolean;
  blockUntil:number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt && now > entry.blockUntil) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  windowMs:   number;  // window duration in ms
  maxAttempts:number;  // max requests in window
  blockMs:    number;  // how long to block after exceeding
}

interface RateLimitResult {
  allowed:         boolean;
  remaining:       number;
  retryAfterMs:    number;
  retryAfterSecs:  number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now  = Date.now();
  const entry = store.get(key);

  // If currently blocked
  if (entry?.blocked && now < entry.blockUntil) {
    return {
      allowed:        false,
      remaining:      0,
      retryAfterMs:   entry.blockUntil - now,
      retryAfterSecs: Math.ceil((entry.blockUntil - now) / 1000),
    };
  }

  // Reset window if expired
  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count:     1,
      resetAt:   now + config.windowMs,
      blocked:   false,
      blockUntil:0,
    });
    return { allowed: true, remaining: config.maxAttempts - 1, retryAfterMs: 0, retryAfterSecs: 0 };
  }

  entry.count++;

  // Exceeded → block
  if (entry.count > config.maxAttempts) {
    entry.blocked    = true;
    entry.blockUntil = now + config.blockMs;
    return {
      allowed:        false,
      remaining:      0,
      retryAfterMs:   config.blockMs,
      retryAfterSecs: Math.ceil(config.blockMs / 1000),
    };
  }

  return {
    allowed:        true,
    remaining:      config.maxAttempts - entry.count,
    retryAfterMs:   0,
    retryAfterSecs: 0,
  };
}

// ─── Pre-defined profiles ─────────────────────────────

/** Login: 5 attempts per 15 min → block 1 hour */
export function loginRateLimit(ip: string) {
  return checkRateLimit(`login:${ip}`, {
    windowMs:    15 * 60 * 1000,
    maxAttempts: 5,
    blockMs:     60 * 60 * 1000,
  });
}

/** Register: 3 per hour per IP */
export function registerRateLimit(ip: string) {
  return checkRateLimit(`register:${ip}`, {
    windowMs:    60 * 60 * 1000,
    maxAttempts: 3,
    blockMs:     60 * 60 * 1000,
  });
}

/** Subscribe: 10 per hour per user */
export function subscribeRateLimit(userId: string) {
  return checkRateLimit(`subscribe:${userId}`, {
    windowMs:    60 * 60 * 1000,
    maxAttempts: 10,
    blockMs:     60 * 60 * 1000,
  });
}

/** Center code: 5 attempts per 30 min per user — brute-force protection */
export function centerCodeRateLimit(userId: string) {
  return checkRateLimit(`centercode:${userId}`, {
    windowMs:    30 * 60 * 1000,
    maxAttempts: 5,
    blockMs:     4 * 60 * 60 * 1000,   // block 4 hours after 5 failed attempts
  });
}

/** Fawry initiate: 3 per 10 min per user */
export function fawryRateLimit(userId: string) {
  return checkRateLimit(`fawry:${userId}`, {
    windowMs:    10 * 60 * 1000,
    maxAttempts: 3,
    blockMs:     30 * 60 * 1000,
  });
}

/** Generic API: 60 per min per IP */
export function apiRateLimit(ip: string) {
  return checkRateLimit(`api:${ip}`, {
    windowMs:    60 * 1000,
    maxAttempts: 60,
    blockMs:     5 * 60 * 1000,
  });
}

// ─── Helper: get real IP from headers ─────────────────
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as { headers: Headers }).headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
