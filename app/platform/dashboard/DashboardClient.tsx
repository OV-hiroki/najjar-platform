"use client";
import { useEffect }        from "react";
import { useStore }         from "@/store/useStore";
import ActivityChart        from "@/components/dashboard/ActivityChart";
import CourseCard           from "@/components/courses/CourseCard";
import type { Course }      from "@/types";
import { useRouter }        from "next/navigation";

interface Props {
  user: {
    id: string; name: string; phone: string; balance: number; points: number;
    activeCourses: number; completedCourses: number; savedVideos: number;
  };
  activeSubs:     { progress: number; course: { id: string; title: string; thumbnail?: string | null } }[];
  suggested:      Course[];
  weeklyActivity: number[];
}

export default function DashboardClient({ user, activeSubs, suggested, weeklyActivity }: Props) {
  const { setUser } = useStore();
  const router      = useRouter();

  useEffect(() => {
    setUser({ ...user, role: "STUDENT", isVerified: true, isActive: true, createdAt: "" });
  }, [user, setUser]);

  const overallProgress = activeSubs.length > 0
    ? Math.round(activeSubs.reduce((a, s) => a + s.progress, 0) / activeSubs.length)
    : 0;

  const STATS = [
    { n: user.completedCourses, lbl: "كورسات مكتملة",     icon: "ti-circle-check" },
    { n: user.activeCourses,    lbl: "كورساتك الحالية",   icon: "ti-bulb"         },
    { n: user.savedVideos,      lbl: "الفيديوهات المحفوظة", icon: "ti-bookmark"   },
  ];

  return (
    <div className="page-wrap">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {STATS.map((s) => (
          <div key={s.lbl} className="stat-card">
            <div>
              <div className="text-3xl font-bold">{s.n}</div>
              <div className="text-xs opacity-80 mt-0.5">{s.lbl}</div>
            </div>
            <i className={`ti ${s.icon} text-3xl opacity-30`} />
          </div>
        ))}
      </div>

      {/* Progress + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Progress */}
        <div className="card flex flex-col items-center justify-center gap-2 py-6 md:col-span-1">
          <p className="text-xs text-gray-400">تقدمك الكلي</p>
          <div className="text-4xl font-bold text-primary">{overallProgress}%</div>
          <div className="w-full bg-gray-200 dark:bg-white/8 rounded-full h-1.5 mt-1">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width:`${overallProgress}%` }} />
          </div>
          <p className="text-[10px] text-center text-gray-400 dark:text-white/25 leading-relaxed">
            مقياس لكمية الدروس السابقة والمتبقية في كورساتك الحالية!
          </p>
        </div>

        {/* Chart */}
        <div className="md:col-span-2">
          <ActivityChart data={weeklyActivity} />
        </div>
      </div>

      {/* Active courses progress */}
      {activeSubs.length > 0 && (
        <div className="card mb-5">
          <h3 className="section-title">استكمل كورساتك</h3>
          <div className="space-y-3">
            {activeSubs.map((sub) => (
              <div key={sub.course.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/3 hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => router.push(`/platform/courses/${sub.course.id}`)}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <i className="ti ti-player-play text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sub.course.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 dark:bg-white/8 rounded-full h-1">
                      <div className="h-full bg-primary rounded-full" style={{ width:`${sub.progress}%` }} />
                    </div>
                    <span className="text-xs text-primary font-medium">{Math.round(sub.progress)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested courses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title mb-0">الكورسات المقترحة</h3>
          <button onClick={() => router.push("/platform/courses")} className="text-xs text-primary hover:underline">
            عرض الكل ←
          </button>
        </div>
        {suggested.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggested.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        ) : (
          <div className="card text-center py-8 text-gray-400">
            <i className="ti ti-loader animate-spin text-3xl block mb-3" />
            <p className="text-sm">يتم الآن تحميل الكورسات...</p>
          </div>
        )}
      </div>
    </div>
  );
}
