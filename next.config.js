/** @type {import('next').NextConfig} */

const securityHeaders = [
  // ── Prevent clickjacking ──────────────────────────
  { key: "X-Frame-Options",          value: "DENY" },

  // ── Prevent MIME sniffing ─────────────────────────
  { key: "X-Content-Type-Options",   value: "nosniff" },

  // ── XSS protection (legacy browsers) ─────────────
  { key: "X-XSS-Protection",         value: "1; mode=block" },

  // ── Referrer policy ───────────────────────────────
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },

  // ── HSTS — force HTTPS for 1 year ─────────────────
  { key: "Strict-Transport-Security",value: "max-age=31536000; includeSubDomains; preload" },

  // ── Permissions policy — disable dangerous APIs ───
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=()"
  },

  // ── Content Security Policy ───────────────────────
  // Allows: self + Google Fonts + Tabler Icons CDN + Recharts
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",   // unsafe-eval needed by Next.js dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "connect-src 'self' https://atfawry.fawrystaging.com https://www.atfawry.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },

  // ── Don't expose server info ──────────────────────
  { key: "X-Powered-By",             value: "" },       // Remove "Next.js" header
  { key: "Server",                   value: "" },
];

const nextConfig = {
  // ── Security headers on ALL routes ────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders.filter((h) => h.value !== ""),
      },
    ];
  },

  // ── Powered-By header off ──────────────────────────
  poweredByHeader: false,

  // ── Strict mode ───────────────────────────────────
  reactStrictMode: true,

  // ── Compress responses ─────────────────────────────
  compress: true,

  // ── Allowed image hosts ────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'none'; script-src 'none'; sandbox;",
  },

  experimental: {
    serverActions: { allowedOrigins: [process.env.NEXTAUTH_URL ?? "http://localhost:3000"] },
  },
};

module.exports = nextConfig;
