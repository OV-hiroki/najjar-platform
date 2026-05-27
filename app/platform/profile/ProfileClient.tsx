"use client";
import { useState }  from "react";
import { useRouter } from "next/navigation";
import { useStore }  from "@/store/useStore";
import { formatDateAr } from "@/lib/utils";

type Section = "main" | "edit" | "security" | "center" | "exams" | "homework" | "errors";

interface Props {
  user: {
    id: string; name: string; phone: string; email?: string | null;
    avatar?: string | null; balance: number; points: number;
    centerId?: string | null; completedCourses: number; createdAt: string;
  };
  loginHistory: { id: string; ip?: string | null; device?: string | null; createdAt: string }[];
  examStats:    { count: number; avg: number };
  homeworkStats:{ count: number; avg: number };
}

export default function ProfileClient({ user, loginHistory, examStats, homeworkStats }: Props) {
  const router = useRouter();
  const { showToast } = useStore();
  const [section, setSection] = useState<Section>("main");
  const [centerId, setCenterId] = useState(user.centerId ?? "");
  const [saving,   setSaving]   = useState(false);

  const MENU = [
    { key:"edit",     icon:"ti-arrow-up-right",    lbl:"الملف الشخصي" },
    { key:"security", icon:"ti-clock",             lbl:"الامان وتاريخ تسجيل الدخول" },
    { key:"center",   icon:"ti-qrcode",            lbl:"ربط ID السنتر" },
    { key:"exams",    icon:"ti-file-description",  lbl:"نتائج الامتحانات" },
    { key:"homework", icon:"ti-clipboard-list",    lbl:"نتائج الواجب" },
    { key:"errors",   icon:"ti-refresh",           lbl:"مراجعة أخطائي" },
  ] as const;

  async function saveCenterId() {
    if (!centerId || centerId.length < 6) { showToast("ID غير صحيح", "error"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/user/stats", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ centerId }),
      });
      const json = await res.json();
      if (json.success) showToast("✅ تم ربط ID السنتر بنجاح!");
      else showToast(json.error ?? "فشل الحفظ", "error");
    } catch { showToast("حدث خطأ", "error"); }
    finally   { setSaving(false); }
  }

  return (
    <div className="page-wrap max-w-2xl">

      {/* ── Main profile card ─────────────────────── */}
      <div className="card mb-4">
        {/* Avatar + name */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-800 to-card flex items-center justify-center text-3xl mb-3 border-2 border-primary/20">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <i className="ti ti-user text-white/30" />
            )}
          </div>
          <h2 className="text-lg font-semibold">{user.name}</h2>
          <p className="text-sm text-gray-400 dark:text-white/40">{user.phone}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-primary">{user.completedCourses}</div>
            <div className="text-xs text-gray-400 dark:text-white/35 mt-1">كورسات منتهية</div>
          </div>
          <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-primary">{user.points}</div>
            <div className="text-xs text-gray-400 dark:text-white/35 mt-1">نقاط</div>
          </div>
        </div>

        {/* Menu */}
        <p className="text-sm font-medium text-gray-500 dark:text-white/40 mb-2">اختيارات اخرى</p>
        <div className="space-y-2">
          {MENU.map((m) => (
            <button
              key={m.key}
              onClick={() => setSection(section === m.key ? "main" : m.key as Section)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm
                border transition-all
                ${section === m.key
                  ? "bg-primary/8 border-primary/30 text-primary"
                  : "bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/6 hover:border-primary/25"
                }`}
            >
              <span className="flex items-center gap-2.5">
                <i className={`ti ${m.icon} text-base`} style={{ color: section === m.key ? "var(--pk)" : undefined }} />
                {m.lbl}
              </span>
              <i className={`ti ti-chevron-${section === m.key ? "down" : "left"} text-xs opacity-40`} />
            </button>
          ))}
        </div>

        <div className="mt-4 text-left">
          <button onClick={() => router.push("/platform/dashboard")} className="btn-outline text-xs py-2 px-5">
            العودة →
          </button>
        </div>
      </div>

      {/* ── Expanded sections ────────────────────── */}

      {section === "edit" && (
        <div className="card animate-fade-up">
          <h3 className="section-title">الملف الشخصي</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">الاسم</label>
              <input className="input" defaultValue={user.name} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">رقم الهاتف</label>
              <input className="input" value={user.phone} disabled />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">البريد الإلكتروني</label>
              <input className="input" type="email" defaultValue={user.email ?? ""} placeholder="example@email.com" />
            </div>
            <button className="btn-primary w-full">حفظ التغييرات</button>
          </div>
        </div>
      )}

      {section === "security" && (
        <div className="card animate-fade-up">
          <h3 className="section-title">الامان وتاريخ تسجيل الدخول</h3>
          <div className="mb-4 space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">كلمة المرور الحالية</label>
              <input className="input" type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">كلمة المرور الجديدة</label>
              <input className="input" type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">تأكيد كلمة المرور</label>
              <input className="input" type="password" placeholder="••••••••" />
            </div>
            <button className="btn-primary w-full">تغيير كلمة المرور</button>
          </div>

          <h4 className="text-sm font-medium mb-3 border-t border-gray-100 dark:border-white/8 pt-4">
            سجل تسجيل الدخول
          </h4>
          {loginHistory.length > 0 ? (
            <div className="space-y-2">
              {loginHistory.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/3 text-xs">
                  <span className="text-gray-400 dark:text-white/35">{formatDateAr(l.createdAt)}</span>
                  <span className="badge-gray">{l.device ?? "غير معروف"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-white/30 text-center py-4">لا يوجد سجل بعد</p>
          )}
        </div>
      )}

      {section === "center" && (
        <div className="card animate-fade-up">
          <h3 className="section-title">ربط ID السنتر</h3>
          <p className="text-xs text-gray-400 dark:text-white/35 mb-4 leading-relaxed">
            اكتب كود السنتر الخاص بك عشان يتربط بحسابك ويقدر المسؤول يتحقق منك.
          </p>
          <div className="flex gap-2">
            <input
              className="input flex-1 font-mono"
              placeholder="كود السنتر (٦ أرقام على الأقل)"
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
            />
            <button onClick={saveCenterId} disabled={saving} className="btn-primary whitespace-nowrap">
              {saving ? <i className="ti ti-loader animate-spin" /> : "حفظ"}
            </button>
          </div>
          {user.centerId && (
            <p className="text-xs text-green-500 mt-2">
              ✅ الكود الحالي: <span className="font-mono">{user.centerId}</span>
            </p>
          )}
        </div>
      )}

      {section === "exams" && (
        <div className="card animate-fade-up">
          <h3 className="section-title">نتائج الامتحانات</h3>
          {examStats.count > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{examStats.avg}%</div>
                  <div className="text-xs text-gray-400 mt-1">متوسط النتائج</div>
                </div>
                <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{examStats.count}</div>
                  <div className="text-xs text-gray-400 mt-1">إجمالي الامتحانات</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-white/8 rounded-full h-2">
                <div className="h-full bg-primary rounded-full" style={{ width:`${examStats.avg}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">عاش! ✅</p>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-2xl font-bold text-primary mb-2">ممتحنتش خالص!</p>
              <p className="text-xs text-gray-400 dark:text-white/30">0 / 0</p>
            </div>
          )}
        </div>
      )}

      {section === "homework" && (
        <div className="card animate-fade-up">
          <h3 className="section-title">نتائج الواجب</h3>
          {homeworkStats.count > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-primary">{homeworkStats.avg}</div>
                <div className="text-xs text-gray-400 mt-1">متوسط الدرجات</div>
              </div>
              <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-primary">{homeworkStats.count}</div>
                <div className="text-xs text-gray-400 mt-1">واجبات منجزة</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-bold text-primary">لا يوجد واجبات بعد!</p>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-2">0 / 0</p>
            </div>
          )}
        </div>
      )}

      {section === "errors" && (
        <div className="card animate-fade-up text-center py-10">
          <i className="ti ti-refresh text-4xl text-gray-300 dark:text-white/20 block mb-3" />
          <p className="text-sm text-gray-400 dark:text-white/30">
            لا توجد أخطاء للمراجعة بعد — خلّي بالك من الامتحانات!
          </p>
        </div>
      )}

      {/* ── Wallet quick access ───────────────────── */}
      <div className="card mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 dark:text-white/35 mb-0.5">الرصيد المتبقي</p>
            <p className="text-xl font-bold text-primary">{user.balance.toLocaleString("ar-EG")} جنيه</p>
          </div>
          <button onClick={() => router.push("/platform/wallet")} className="btn-primary text-xs py-2 px-4">
            اشحن رصيد →
          </button>
        </div>
      </div>
    </div>
  );
}
