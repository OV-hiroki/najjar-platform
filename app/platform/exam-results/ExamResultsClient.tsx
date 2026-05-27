"use client";
import { useState }     from "react";
import { formatDateAr } from "@/lib/utils";

type Tab = "exams" | "homework" | "errors";

interface ExamRow { id:string; score:number; total:number; percentage:number; createdAt:string; examTitle:string; duration?:number|null }
interface HwRow   { id:string; score:number; total:number; createdAt:string; hwTitle:string }

interface Props {
  examResults:   ExamRow[];
  hwResults:     HwRow[];
  avgPercentage: number | null;
}

export default function ExamResultsClient({ examResults, hwResults, avgPercentage }: Props) {
  const [tab, setTab] = useState<Tab>("exams");

  const TABS: { k:Tab; lbl:string }[] = [
    { k:"exams",    lbl:"نتائج الامتحانات" },
    { k:"homework", lbl:"نتائج الواجب"     },
    { k:"errors",   lbl:"مراجعة أخطائي"   },
  ];

  return (
    <div className="page-wrap max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-white/8 mb-5">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`pb-2.5 px-4 text-sm font-medium border-b-2 transition-colors
              ${tab === t.k
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60"
              }`}
          >
            {t.lbl}
          </button>
        ))}
      </div>

      {/* ── Exams ─────────────────────────────────── */}
      {tab === "exams" && (
        <>
          {examResults.length > 0 ? (
            <>
              {/* Summary */}
              <div className="card mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title mb-0">متوسط النتائج</h3>
                  <span className="text-3xl font-bold text-primary">
                    {avgPercentage !== null ? `${avgPercentage}%` : "—"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-white/8 rounded-full h-2">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width:`${avgPercentage ?? 0}%` }}
                  />
                </div>
                {avgPercentage && avgPercentage >= 70 && (
                  <p className="text-sm text-green-500 font-bold mt-2 text-center">عاش! ✅</p>
                )}
              </div>

              {/* Results list */}
              <div className="space-y-3">
                {examResults.map((r) => (
                  <div key={r.id} className="card flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate mb-1">{r.examTitle}</p>
                      <p className="text-xs text-gray-400 dark:text-white/30">{formatDateAr(r.createdAt)}</p>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div
                        className={`text-xl font-bold ${
                          r.percentage >= 70 ? "text-green-500" : r.percentage >= 50 ? "text-yellow-500" : "text-red-500"
                        }`}
                      >
                        {Math.round(r.percentage)}%
                      </div>
                      <div className="text-xs text-gray-400 dark:text-white/30">{r.score}/{r.total}</div>
                    </div>
                    <div className="w-16 h-16 flex-shrink-0">
                      <svg viewBox="0 0 36 36">
                        <path
                          fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          fill="none"
                          stroke={r.percentage >= 70 ? "#22c55e" : r.percentage >= 50 ? "#eab308" : "#ef4444"}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${r.percentage}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="card text-center py-16">
              <p className="text-2xl font-bold text-primary mb-2">ممتحنتش خالص!</p>
              <p className="text-sm text-gray-400 dark:text-white/30">0 / 0</p>
              <div className="w-full max-w-xs mx-auto mt-4 flex justify-between text-xs text-gray-300 dark:text-white/15">
                {["—","—","—","—","—","—"].map((_, i) => (
                  <span key={i} className="w-1 h-1 bg-current rounded-full" />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Homework ──────────────────────────────── */}
      {tab === "homework" && (
        hwResults.length > 0 ? (
          <div className="space-y-3">
            {hwResults.map((r) => (
              <div key={r.id} className="card flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate mb-1">{r.hwTitle}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30">{formatDateAr(r.createdAt)}</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">{r.score}</div>
                  <div className="text-xs text-gray-400 dark:text-white/30">/{r.total}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <p className="text-xl font-bold text-primary mb-2">لا يوجد واجبات بعد!</p>
            <p className="text-xs text-gray-400 dark:text-white/30">0 / 0</p>
          </div>
        )
      )}

      {/* ── Errors review ─────────────────────────── */}
      {tab === "errors" && (
        <div className="card text-center py-16">
          <i className="ti ti-refresh text-5xl text-gray-300 dark:text-white/15 block mb-4" />
          <p className="font-semibold mb-2">مراجعة الأخطاء</p>
          <p className="text-sm text-gray-400 dark:text-white/30">
            لا توجد أخطاء للمراجعة بعد — ابدأ امتحاناتك!
          </p>
        </div>
      )}
    </div>
  );
}
