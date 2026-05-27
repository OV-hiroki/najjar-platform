"use client";
import { useState }     from "react";
import { useRouter }    from "next/navigation";
import { isValidPhone } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:"", phone:"", password:"", confirm:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass,setShowPass]= useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim())          { setError("الاسم مطلوب"); return; }
    if (!isValidPhone(form.phone))  { setError("رقم الهاتف غير صحيح"); return; }
    if (form.password.length < 8)   { setError("كلمة المرور يجب أن تكون ٨ أحرف على الأقل"); return; }
    if (form.password !== form.confirm) { setError("كلمتا المرور غير متطابقتين"); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: form.name, phone: form.phone, password: form.password }),
      });
      const json = await res.json();

      if (json.success) {
        router.push("/auth/login?registered=1");
      } else {
        setError(json.error ?? "فشل التسجيل — حاول تاني");
      }
    } catch {
      setError("حدث خطأ — تحقق من الاتصال بالإنترنت");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">محمود النجار</h1>
          <p className="text-sm text-white/40">انضم لأكبر منصة تعليمية</p>
        </div>

        <div className="bg-card border border-white/8 rounded-3xl p-7 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">حساب جديد 🎓</h2>
          <p className="text-sm text-white/40 mb-6">ابدأ رحلتك التعليمية دلوقتي</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {[
              { k:"name",    lbl:"الاسم كامل",  type:"text",     icon:"ti-user",   ph:"ادهم محمد" },
              { k:"phone",   lbl:"رقم الهاتف",  type:"tel",      icon:"ti-phone",  ph:"01xxxxxxxxx", dir:"ltr" as const },
              { k:"password",lbl:"كلمة المرور", type:"password", icon:"ti-lock",   ph:"••••••••" },
              { k:"confirm", lbl:"تأكيد كلمة المرور", type:"password", icon:"ti-lock", ph:"••••••••" },
            ].map((f) => (
              <div key={f.k}>
                <label className="text-xs text-white/40 mb-1.5 block">{f.lbl}</label>
                <div className="relative">
                  <i className={`ti ${f.icon} absolute right-3 top-1/2 -translate-y-1/2 text-white/30`} />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-9 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                    type={f.type === "password" && f.k !== "confirm" ? (showPass ? "text" : "password") : f.type}
                    placeholder={f.ph}
                    value={form[f.k as keyof typeof form]}
                    onChange={update(f.k)}
                    dir={f.dir}
                  />
                  {f.k === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      <i className={`ti ${showPass ? "ti-eye-off" : "ti-eye"}`} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark active:scale-95 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm mt-2"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><i className="ti ti-loader animate-spin" /> جاري التسجيل...</span>
                : "إنشاء الحساب"
              }
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            عندك حساب؟{" "}
            <button onClick={() => router.push("/auth/login")} className="text-primary hover:underline font-medium">
              سجل دخول
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
