"use client";
import { useState, useEffect }  from "react";
import { signIn }               from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme }             from "next-themes";
import { isValidPhone, sanitizeCallbackUrl } from "@/lib/utils";

// ── Re-export sanitizeCallbackUrl in utils since we need it client-side ──
// (It's a pure string function, safe in browser)

export default function LoginPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Show success message if redirected from register
  const registered = searchParams.get("registered");

  // Get safe callback URL
  const rawCallback   = searchParams.get("callbackUrl") ?? "";
  const callbackUrl   = rawCallback.startsWith("/")
    ? rawCallback
    : "/platform/dashboard";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidPhone(phone))  { setError("رقم الهاتف غير صحيح (مثال: 01012345678)"); return; }
    if (password.length < 6)   { setError("كلمة المرور قصيرة جداً"); return; }

    setLoading(true);
    try {
      // Pass IP via header trick (Next.js handles it)
      const res = await signIn("credentials", {
        phone, password, redirect: false,
      });
      if (res?.error) {
        setError(
          res.error.includes("مؤقتاً")
            ? res.error
            : "رقم الهاتف أو كلمة المرور غير صحيحة"
        );
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/8 flex items-center justify-center"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">محمود النجار</h1>
          <p className="text-sm text-white/40">منصة التعليم الإلكتروني</p>
        </div>

        <div className="bg-card border border-white/8 rounded-3xl p-7 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">أهلاً بك! 👋</h2>
          <p className="text-sm text-white/40 mb-6">سجل دخولك عشان تكمل رحلتك</p>

          {registered && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-3 mb-4 text-sm text-center">
              ✅ تم إنشاء حسابك — سجل دخولك الآن
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">رقم الهاتف</label>
              <div className="relative">
                <i className="ti ti-phone absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-9 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  type="tel" placeholder="01xxxxxxxxx"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel" dir="ltr" maxLength={11}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">كلمة المرور</label>
              <div className="relative">
                <i className="ti ti-lock absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-9 pl-10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  type={showPass ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  <i className={`ti ${showPass ? "ti-eye-off" : "ti-eye"}`} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark active:scale-95 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm">
              {loading
                ? <span className="flex items-center justify-center gap-2"><i className="ti ti-loader animate-spin" /> جاري تسجيل الدخول...</span>
                : "سجل دخول"
              }
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            مش عندك حساب؟{" "}
            <button onClick={() => router.push("/auth/register")} className="text-primary hover:underline font-medium">
              سجل دلوقتي
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
