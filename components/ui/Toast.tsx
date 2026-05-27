"use client";
import { useStore } from "@/store/useStore";

export default function Toast() {
  const { toast, clearToast } = useStore();
  if (!toast) return null;

  const colors = {
    success: "bg-card border-primary/30 text-white",
    error:   "bg-red-950 border-red-500/30 text-white",
    info:    "bg-card border-white/10 text-white",
  };

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 sm:right-auto sm:w-80
                  ${colors[toast.type]} border rounded-2xl p-4 shadow-xl z-[200]
                  animate-fade-up flex items-center gap-3`}
    >
      <span className="text-xl flex-shrink-0">
        {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
      </span>
      <p className="text-sm flex-1 leading-relaxed">{toast.msg}</p>
      <button onClick={clearToast} className="text-white/40 hover:text-white text-xs">✕</button>
    </div>
  );
}
