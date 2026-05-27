"use client";
import { useRouter }      from "next/navigation";
import type { Subscription } from "@/types";
import { subjectLabel }  from "@/lib/utils";

export default function MyCoursesClient({ subscriptions }: { subscriptions: Subscription[] }) {
  const router = useRouter();

  if (subscriptions.length === 0) {
    return (
      <div className="page-wrap flex flex-col items-center justify-center min-h-[60vh] text-center">
        <i className="ti ti-player-play text-5xl text-gray-300 dark:text-white/15 mb-4 block" />
        <p className="text-lg font-semibold mb-2">لا يوجد كورسات مشترك بها دلوقتي</p>
        <p className="text-sm text-gray-400 dark:text-white/35 mb-6">ابدأ رحلتك التعليمية دلوقتي!</p>
        <button onClick={() => router.push("/platform/courses")} className="btn-primary px-8">
          تصفح الكورسات
        </button>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <h1 className="section-title text-xl mb-5">كورساتي ({subscriptions.length})</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subscriptions.map((sub) => (
          <div
            key={sub.id}
            className="card-hover cursor-pointer"
            onClick={() => router.push(`/platform/courses/${sub.course.id}`)}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <i className="ti ti-player-play text-primary text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold leading-snug line-clamp-2 mb-1">
                  {sub.course.title}
                </h3>
                <span className="badge-pink text-[10px]">{subjectLabel(sub.course.subject)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-gray-50 dark:bg-white/3 rounded-lg p-2">
                <div className="text-base font-bold text-primary">{Math.round(sub.progress)}%</div>
                <div className="text-[10px] text-gray-400 dark:text-white/30">اكتمال</div>
              </div>
              <div className="bg-gray-50 dark:bg-white/3 rounded-lg p-2">
                <div className="text-base font-bold">{sub.videosWatched}</div>
                <div className="text-[10px] text-gray-400 dark:text-white/30">فيديو</div>
              </div>
              <div className="bg-gray-50 dark:bg-white/3 rounded-lg p-2">
                <div className="text-base font-bold">{sub.examsCompleted}</div>
                <div className="text-[10px] text-gray-400 dark:text-white/30">امتحان</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-white/8 rounded-full h-1.5 mb-3">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width:`${sub.progress}%` }}
              />
            </div>

            <button className="btn-primary w-full text-xs py-2">
              {sub.progress === 0 ? "ابدأ الكورس" : sub.progress >= 100 ? "مراجعة الكورس" : "استكمل من حيث توقفت"} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
