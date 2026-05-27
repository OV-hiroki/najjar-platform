"use client";
import { useCountdown }  from "@/hooks/useCountdown";
import { useStore }      from "@/store/useStore";
import { pad }           from "@/lib/utils";

export default function CountdownBar() {
  const { d, h, m, s } = useCountdown();
  const { showCountdown, hideCountdown } = useStore();

  if (!showCountdown) return null;

  return (
    <div className="relative flex items-center justify-center flex-wrap gap-2 px-12 py-1.5 bg-primary/8 border-b border-primary/18 text-xs">
      {/* Close */}
      <button
        onClick={hideCountdown}
        className="absolute left-3 w-6 h-6 rounded-md bg-white/8 dark:bg-white/8 hover:bg-primary/15 flex items-center justify-center text-gray-500 dark:text-white/50 transition-colors"
      >
        ✕
      </button>

      {/* Label */}
      <span className="text-primary font-medium">● فاضل على نهاية رحلة الثانوية العامة</span>

      {/* Countdown units */}
      <div className="flex items-center gap-1 font-bold">
        <Unit n={d} lbl="يوم" />
        <Sep />
        <Unit n={h} lbl="س"  />
        <Sep />
        <Unit n={m} lbl="د"  />
        <Sep />
        <Unit n={s} lbl="ث"  />
      </div>

      {/* CTA */}
      <button className="border border-primary/40 text-primary text-xs px-3 py-0.5 rounded-full hover:bg-primary/10 transition-colors">
        ركّز وكّمل
      </button>
    </div>
  );
}

function Unit({ n, lbl }: { n: number; lbl: string }) {
  return (
    <span className="bg-primary text-white font-bold px-2.5 py-0.5 rounded-md text-sm min-w-[34px] text-center">
      {pad(n)} {lbl}
    </span>
  );
}
function Sep() {
  return <span className="text-primary font-bold">:</span>;
}
