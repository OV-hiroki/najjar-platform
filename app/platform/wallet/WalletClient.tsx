"use client";
import { useState }      from "react";
import { useStore }      from "@/store/useStore";
import type { Invoice, WalletTransaction } from "@/types";

type Tab = "invoices" | "subs" | "my";

interface Props {
  balance:      number;
  phone:        string;
  invoices:     Invoice[];
  transactions: WalletTransaction[];
}

export default function WalletClient({ balance, phone, invoices, transactions }: Props) {
  const { showToast, updateBalance } = useStore();
  const [tab,    setTab]    = useState<Tab>("invoices");
  const [amount, setAmount] = useState("");
  const [code,   setCode]   = useState("");
  const [loading,setLoading]= useState<"fawry"|"code"|null>(null);
  const [fawryRef, setFawryRef] = useState<string|null>(null);

  // ── Fawry initiate ───────────────────────────────────
  async function handleFawry() {
    const n = parseFloat(amount);
    if (!n || n < 10) { showToast("الحد الأدنى للشحن ١٠ جنيه", "error"); return; }
    setLoading("fawry");
    try {
      const res  = await fetch("/api/wallet/fawry", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: n }),
      });
      const json = await res.json();
      if (json.success) {
        setFawryRef(json.data.referenceNumber);
        showToast(`✅ كود الدفع: ${json.data.referenceNumber} — توجه لأقرب فرع فوري`);
        setAmount("");
      } else {
        showToast(json.error ?? "فشل الاتصال بفوري", "error");
      }
    } catch { showToast("حدث خطأ — حاول تاني", "error"); }
    finally   { setLoading(null); }
  }

  // ── Center code ──────────────────────────────────────
  async function handleCenterCode() {
    if (code.length !== 11) { showToast("الكود لازم يكون ١١ رقم", "error"); return; }
    setLoading("code");
    try {
      const res  = await fetch("/api/wallet/center-code", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code }),
      });
      const json = await res.json();
      if (json.success) {
        updateBalance(json.data.newBalance);
        showToast(`✅ تم إضافة ${json.data.amount} جنيه لمحفظتك!`);
        setCode("");
      } else {
        showToast(json.error ?? "كود خاطئ أو مستخدم من قبل", "error");
      }
    } catch { showToast("حدث خطأ — حاول تاني", "error"); }
    finally   { setLoading(null); }
  }

  const TABS: { k: Tab; lbl: string }[] = [
    { k:"invoices", lbl:"الفواتير"    },
    { k:"subs",     lbl:"الاشتراكات" },
    { k:"my",       lbl:"كورساتي"    },
  ];

  return (
    <div className="page-wrap">

      {/* Balance card */}
      <div className="card flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-700 to-teal flex items-center justify-center text-2xl flex-shrink-0">
          💰
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 dark:text-white/40 mb-0.5">الرصيد المتبقي</p>
          <p className="text-3xl font-bold text-primary">{balance.toLocaleString("ar-EG")} جنيه</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">اشحن رصيد بأكثر من طريقة</p>
        </div>
      </div>

      {/* ── Fawry charge ──────────────────────────── */}
      <div className="card mb-4">
        <h3 className="section-title">الشحن من فوري</h3>
        <p className="text-xs text-gray-400 dark:text-white/35 mb-4 leading-relaxed">
          شحن رصيد في المحفظة تقدر تستخدمه عشان تشترك في كورسات المنصة
        </p>
        {/* Steps */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            ["١", "اكتب المبلغ اللي هتدفعه"],
            ["٢", 'احصل على الكود "Reference ID"'],
            ["٣", "توجه لأقرب فرع فوري لدفع المبلغ"],
          ].map(([n, t]) => (
            <div key={n} className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
              <span className="text-primary font-bold text-sm block mb-1">{n}</span>
              <span className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">{t}</span>
            </div>
          ))}
        </div>

        {fawryRef && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-3 flex items-center gap-2">
            <i className="ti ti-receipt text-primary" />
            <span className="text-sm">كود الدفع: <strong className="text-primary font-mono">{fawryRef}</strong></span>
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="input flex-1"
            type="number"
            placeholder="اكتب المبلغ (جنيه)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            onClick={handleFawry}
            disabled={loading === "fawry"}
            className="btn-teal whitespace-nowrap"
          >
            {loading === "fawry" ? <i className="ti ti-loader animate-spin" /> : "أكد الدفع"}
          </button>
        </div>
      </div>

      {/* ── Center code ───────────────────────────── */}
      <div className="card mb-6">
        <div className="w-12 h-12 bg-primary/10 border-2 border-primary/30 rounded-xl flex items-center justify-center text-primary font-bold text-lg mb-3">
          **
        </div>
        <h3 className="section-title">اشحن باستخدام كود السنتر</h3>
        <p className="text-xs text-gray-400 dark:text-white/35 mb-4 leading-relaxed">
          اكتب الكود المكون من ١١ رقم على كارت السنتر بتاعك هنا عشان تشحنه على الأكونت بتاعك.
        </p>
        <div className="flex gap-2">
          <input
            className="input flex-1 font-mono tracking-widest"
            placeholder="كود السنتر (١١ رقم)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={11}
          />
          <button
            onClick={handleCenterCode}
            disabled={loading === "code"}
            className="btn-primary whitespace-nowrap"
          >
            {loading === "code" ? <i className="ti ti-loader animate-spin" /> : "أكد الدفع"}
          </button>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-white/8 mb-4">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors
              ${tab === t.k
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60"
              }`}
          >
            {t.lbl}
          </button>
        ))}
      </div>

      {/* ── Invoices ──────────────────────────────── */}
      {tab === "invoices" && (
        invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-gray-400 dark:text-white/35 border-b border-gray-200 dark:border-white/8">
                  <th className="pb-2 pr-2 font-medium">التسلسل</th>
                  <th className="pb-2 px-2 font-medium">إجمالي الفاتورة</th>
                  <th className="pb-2 px-2 font-medium">التخفيض</th>
                  <th className="pb-2 px-2 font-medium">الكوبون</th>
                  <th className="pb-2 px-2 font-medium">عدد المشتريات</th>
                  <th className="pb-2 pl-2 font-medium">المشتريات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/2">
                    <td className="py-2.5 pr-2 font-mono text-xs">{inv.id.slice(-7).toUpperCase()}</td>
                    <td className="py-2.5 px-2">{inv.total.toFixed(2)}</td>
                    <td className="py-2.5 px-2">{inv.discount.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-gray-400 dark:text-white/30">
                      --{inv.coupon ?? "لا يوجد كوبون"}--
                    </td>
                    <td className="py-2.5 px-2">{inv.items.length}</td>
                    <td className="py-2.5 pl-2 text-primary text-xs">
                      {inv.items[0]?.course.title ?? "—تم حذف المشتري"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 dark:text-white/25 mt-2 text-left">
              1-{invoices.length} من {invoices.length}
            </p>
          </div>
        ) : (
          <Empty icon="ti-receipt" msg="لا توجد فواتير بعد" />
        )
      )}

      {tab === "subs" && <Empty icon="ti-credit-card" msg="لا توجد اشتراكات بعد" />}
      {tab === "my"   && <Empty icon="ti-books"        msg="لا يوجد كورسات مشترك بها دلوقتي" />}
    </div>
  );
}

function Empty({ icon, msg }: { icon: string; msg: string }) {
  return (
    <div className="card text-center py-16 text-gray-400 dark:text-white/30">
      <i className={`ti ${icon} text-4xl block mb-3`} />
      <p className="text-sm">{msg}</p>
    </div>
  );
}
