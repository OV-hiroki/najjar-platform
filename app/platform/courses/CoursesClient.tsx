"use client";
import { useState, useMemo } from "react";
import CourseCard            from "@/components/courses/CourseCard";
import type { Course }       from "@/types";

const SUBJECT_TABS = [
  { lbl:"كل المواد",    val:"ALL"   },
  { lbl:"ميكانيكا 🔧",  val:"MECH"  },
  { lbl:"كهرباء ⚡",    val:"ELEC"  },
  { lbl:"موجات 🌊",    val:"WAVES" },
] as const;

const TYPE_CHIPS = [
  { lbl:"المراجعة النهائية كاملة ✅", val:"FINAL_FULL" },
  { lbl:"محاضرات منفصلة ✅",           val:"LECTURE"    },
  { lbl:"الاشتراك بالمحاضرة",          val:"SINGLE"     },
  { lbl:"كورس + الورشة (الأفضل) خصم ٣٥٪", val:"WORKSHOP" },
  { lbl:"معسكر المراجعة",              val:"CAMP"       },
  { lbl:"الامتحانات الشاملة لليوتيوب ✅", val:"EXAM"    },
] as const;

const PER_PAGE = 6;

export default function CoursesClient({ courses }: { courses: Course[] }) {
  const [subject, setSubject] = useState<"ALL"|"MECH"|"ELEC"|"WAVES">("ALL");
  const [type,    setType]    = useState<string | null>(null);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const subjOk = subject === "ALL" || c.subject === subject || c.subject === "ALL";
      const typeOk = !type   || c.type === type;
      const srchOk = !search || c.title.includes(search) || c.description?.includes(search);
      return subjOk && typeOk && srchOk;
    });
  }, [courses, subject, type, search]);

  const pages   = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function reset() { setPage(1); }

  return (
    <div className="page-wrap">
      {/* Search */}
      <div className="relative mb-4">
        <i className="ti ti-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pr-9"
          placeholder="ابحث عن كورس..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); reset(); }}
        />
      </div>

      {/* Subject tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-white/8 mb-4">
        {SUBJECT_TABS.map((t) => (
          <button
            key={t.val}
            onClick={() => { setSubject(t.val); reset(); }}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors
              ${subject === t.val
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
              }`}
          >
            {t.lbl}
          </button>
        ))}
      </div>

      {/* Type chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TYPE_CHIPS.map((c) => (
          <button
            key={c.val}
            onClick={() => { setType(type === c.val ? null : c.val); reset(); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all
              ${type === c.val
                ? "bg-primary/10 border-primary text-primary"
                : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:border-primary/40 hover:text-primary"
              }`}
          >
            {c.lbl}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 dark:text-white/30 mb-4">
        {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} من {filtered.length} كورس
      </p>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {visible.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      ) : (
        <div className="card text-center py-16 text-gray-400">
          <i className="ti ti-books text-4xl block mb-3" />
          <p>لا توجد كورسات في هذه الفئة</p>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center disabled:opacity-30 hover:border-primary hover:text-primary transition-colors"
          >
            <i className="ti ti-chevron-right text-sm" />
          </button>
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors
                ${page === i + 1
                  ? "bg-primary text-white border border-primary"
                  : "border border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary"
                }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="w-9 h-9 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center disabled:opacity-30 hover:border-primary hover:text-primary transition-colors"
          >
            <i className="ti ti-chevron-left text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
