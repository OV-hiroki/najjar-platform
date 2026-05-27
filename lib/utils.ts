import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Format currency ──────────────────────────────────
export function formatEGP(amount: number): string {
  return `${amount.toLocaleString("ar-EG")} جنيه`;
}

// ─── Format date in Arabic ────────────────────────────
const AR_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];
const AR_DAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

export function formatDateAr(date: string | Date): string {
  const d = new Date(date);
  return `${AR_DAYS[d.getDay()]}، ${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Pad numbers ──────────────────────────────────────
export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// ─── Countdown from target date ───────────────────────
export function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
  };
}

// ─── Validate Egyptian phone ──────────────────────────
export function isValidPhone(phone: string): boolean {
  return /^(01)[0125]\d{8}$/.test(phone.replace(/\s/g, ""));
}

// ─── Truncate text ────────────────────────────────────
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "..." : str;
}

// ─── Subject label ────────────────────────────────────
export function subjectLabel(s: string): string {
  const map: Record<string, string> = { BIO: "أحياء", GEO: "جيولوجيا", ALL: "كل المواد" };
  return map[s] ?? s;
}

// ─── Course type label ────────────────────────────────
export function typeLabel(t: string): string {
  const map: Record<string, string> = {
    FINAL_FULL: "مراجعة نهائية كاملة ✅",
    LECTURE:    "محاضرات منفصلة",
    SINGLE:     "اشتراك بالمحاضرة",
    WORKSHOP:   "كورس + الورشة (الأفضل)",
    CAMP:       "معسكر مراجعة",
    EXAM:       "امتحانات شاملة",
  };
  return map[t] ?? t;
}

// ─── API helper ───────────────────────────────────────
export function apiError(msg: string, status = 400) {
  return Response.json({ success: false, error: msg }, { status });
}
export function apiOk<T>(data: T, msg?: string) {
  return Response.json({ success: true, data, message: msg });
}

// ─── sanitizeCallbackUrl (also used client-side) ──────
export function sanitizeCallbackUrl(url: string | null, fallback = "/platform/dashboard"): string {
  if (!url) return fallback;
  try {
    if (!url.startsWith("/") || url.startsWith("//")) return fallback;
    if (/^[a-z]+:/i.test(url)) return fallback;
    const decoded = decodeURIComponent(url);
    if (decoded.includes("://") || decoded.startsWith("//")) return fallback;
    return url;
  } catch {
    return fallback;
  }
}
