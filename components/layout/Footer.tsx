"use client";
import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();
  return (
    <footer className="bg-navy text-white border-t border-white/7 mt-16 py-8 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Brand */}
        <div>
          <div className="text-primary font-bold text-lg mb-2">محمود النجار</div>
          <p className="text-xs text-white/30 mb-1">جميع الحقوق محفوظة © 2026</p>
          <p className="font-mono text-[10px] text-primary">
            {"<Developed by=\"Omar , Emad\" andPowered=true />"}
          </p>
        </div>

        {/* Pages */}
        <div>
          <h4 className="text-xs text-white/35 mb-3">الصفحات</h4>
          {[
            { lbl:"الرئيسية",  href:"/platform/dashboard" },
            { lbl:"الدعم الفني", href:"#" },
          ].map((l) => (
            <button key={l.lbl} onClick={() => router.push(l.href)}
              className="block text-sm text-white/60 hover:text-primary mb-1.5 transition-colors text-right w-full">
              {l.lbl}
            </button>
          ))}
        </div>

        {/* Social */}
        <div>
          <h4 className="text-xs text-white/35 mb-3">السوشيال ميديا</h4>
          {[
            { icon:"ti-brand-facebook",  lbl:"فيسبوك"   },
            { icon:"ti-brand-instagram", lbl:"انستجرام" },
            { icon:"ti-brand-youtube",   lbl:"يوتيوب"   },
          ].map((s) => (
            <div key={s.lbl} className="flex items-center gap-2 text-sm text-white/60 hover:text-primary mb-1.5 cursor-pointer transition-colors">
              <i className={`ti ${s.icon}`} />
              <span>{s.lbl}</span>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-xs text-white/35 mb-3">تواصل معنا</h4>
          <button className="bg-white/8 hover:bg-primary/15 hover:text-primary text-white/70 text-sm rounded-xl px-4 py-2 transition-colors">
            الدعم الفني
          </button>
        </div>
      </div>
    </footer>
  );
}
