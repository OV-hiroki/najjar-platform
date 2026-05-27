"use client";
import { useRouter }      from "next/navigation";
import { useStore }       from "@/store/useStore";
import { formatDateAr }  from "@/lib/utils";
import type { Course }   from "@/types";
import { useState }      from "react";

// bg gradients per subject
const BG: Record<string, string> = {
  ALL:   "from-[#0a1a3d] to-[#1a3a7a]",
  MECH:  "from-[#1a2a5c] to-[#0f1f40]",
  ELEC:  "from-[#2a1a0a] to-[#6b4012]",
  WAVES: "from-[#0a2a1a] to-[#1a5c3a]",
};

interface Props {
  course:      Course;
  onSubscribe?: (course: Course) => void;
}

export default function CourseCard({ course, onSubscribe }: Props) {
  const router = useRouter();
  const { user, showToast } = useStore();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!user) { router.push("/auth/login"); return; }
    if (user.balance < course.price) {
      showToast(`رصيدك غير كافٍ — تحتاج ${course.price - user.balance} جنيه إضافية`, "error");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`/api/courses/${course.id}/subscribe`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast("✅ تم الاشتراك بنجاح!", "success");
        onSubscribe?.(course);
      } else {
        showToast(json.error ?? "فشل الاشتراك", "error");
      }
    } catch {
      showToast("حدث خطأ — حاول تاني", "error");
    } finally {
      setLoading(false);
    }
  }

  const bg = BG[course.subject] ?? BG.MECH;

  return (
    <div className="card-hover overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className={`bg-gradient-to-br ${bg} h-28 flex items-center justify-center relative`}>
        <i className="ti ti-user text-5xl text-white/10" />
        <span className="absolute top-2 right-2 badge-gray text-[10px]">محمود النجار</span>
        {course.subscribed && (
          <span className="absolute top-2 left-2 bg-green-500/80 text-white text-[10px] px-2 py-0.5 rounded-full">
            مشترك ✓
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug">{course.title}</h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-gray-400">{course.grade}</span>
          <span className="text-primary font-bold text-base">{course.price} جنيه</span>
          {course.oldPrice && (
            <span className="text-gray-400 line-through text-xs">{course.oldPrice.toFixed(2)}</span>
          )}
          {course.oldPrice && (
            <span className="badge-pink text-[10px]">
              خصم {Math.round((1 - course.price / course.oldPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="text-xs text-gray-400 dark:text-white/35 space-y-1">
          {course.startDate && (
            <div className="flex items-center gap-1.5">
              <i className="ti ti-calendar text-xs" />
              <span>{formatDateAr(course.startDate)}</span>
            </div>
          )}
          {course.endDate && (
            <div className="flex items-center gap-1.5">
              <i className="ti ti-clock text-xs" />
              <span>{formatDateAr(course.endDate)}</span>
            </div>
          )}
          {course.description && (
            <p className="leading-relaxed line-clamp-2">{course.description}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="grid gap-2 mt-auto pt-2">
          <button
            onClick={() => router.push(`/platform/courses/${course.id}`)}
            className="btn-outline text-xs py-2"
          >
            الدخول للكورس
          </button>
          {course.subscribed ? (
            <button className="btn-primary text-xs py-2 opacity-60 cursor-default" disabled>
              ✅ مشترك بالفعل
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="btn-primary text-xs py-2"
            >
              {loading ? <i className="ti ti-loader animate-spin" /> : "الإشتراك في الكورس!"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
