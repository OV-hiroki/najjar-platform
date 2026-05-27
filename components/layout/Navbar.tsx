"use client";
import { useTheme }    from "next-themes";
import { useRouter }   from "next/navigation";
import { signOut }     from "next-auth/react";
import { useStore }    from "@/store/useStore";
import { formatEGP }   from "@/lib/utils";
import { useState }    from "react";

export default function Navbar() {
  const router       = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, unreadCount } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDark = theme === "dark";

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-navy border-b border-gray-200 dark:border-white/7 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* ── Logo ──────────────────────────────── */}
        <button
          onClick={() => router.push("/platform/dashboard")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-primary font-bold text-xl tracking-tight">النجار</span>
        </button>

        {/* ── Right actions ─────────────────────── */}
        <div className="flex items-center gap-2">

          {/* Search */}
          <button
            onClick={() => router.push("/platform/courses")}
            className="btn-ghost w-9 h-9 flex items-center justify-center rounded-full p-0"
          >
            <i className="ti ti-search text-lg" />
          </button>

          {/* Notifications */}
          <button className="relative btn-ghost w-9 h-9 flex items-center justify-center rounded-full p-0">
            <i className="ti ti-bell text-lg" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Wallet balance */}
          <button
            onClick={() => router.push("/platform/wallet")}
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/8 hover:bg-primary/10 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <i className="ti ti-wallet text-primary text-sm" />
            <span>{user ? formatEGP(user.balance) : "0 جنيه"}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/8 hover:bg-primary/10 transition-colors text-base"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* Avatar / menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-800 to-card flex items-center justify-center text-sm font-bold text-white/70 border-2 border-primary/30 hover:border-primary/60 transition-colors"
            >
              {user?.name?.[0] ?? "ا"}
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-11 w-52 card shadow-xl z-50 animate-fade-up">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-white/8">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.phone}</p>
                </div>
                <div className="py-1">
                  {[
                    { icon:"ti-user",         lbl:"الملف الشخصي",  href:"/platform/profile"      },
                    { icon:"ti-wallet",       lbl:"المحفظة",        href:"/platform/wallet"       },
                    { icon:"ti-books",        lbl:"كورساتي",        href:"/platform/my-courses"   },
                    { icon:"ti-chart-bar",    lbl:"نتائج الامتحانات",href:"/platform/exam-results"},
                  ].map((item) => (
                    <button
                      key={item.href}
                      onClick={() => { router.push(item.href); setMenuOpen(false); }}
                      className="w-full text-right flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      <i className={`ti ${item.icon} text-base`} />
                      {item.lbl}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 dark:border-white/8 mt-1 pt-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/auth/login" })}
                      className="w-full text-right flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <i className="ti ti-logout text-base" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
