import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Notification } from "@/types";

interface AppState {
  // ── User ────────────────────────────────────────────
  user:            User | null;
  setUser:         (u: User | null) => void;
  updateBalance:   (b: number) => void;

  // ── Theme ───────────────────────────────────────────
  dark:            boolean;
  toggleDark:      () => void;

  // ── Countdown bar ───────────────────────────────────
  showCountdown:   boolean;
  hideCountdown:   () => void;

  // ── Notifications ───────────────────────────────────
  notifications:   Notification[];
  unreadCount:     number;
  setNotifications:(n: Notification[]) => void;
  markAllRead:     () => void;

  // ── Toast ───────────────────────────────────────────
  toast:           { msg: string; type: "success" | "error" | "info" } | null;
  showToast:       (msg: string, type?: "success" | "error" | "info") => void;
  clearToast:      () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── User ──────────────────────────────────────
      user:          null,
      setUser:       (u)  => set({ user: u }),
      updateBalance: (b)  => set((s) => ({ user: s.user ? { ...s.user, balance: b } : null })),

      // ── Theme ─────────────────────────────────────
      dark:          true,
      toggleDark:    ()   => set((s) => ({ dark: !s.dark })),

      // ── Countdown ─────────────────────────────────
      showCountdown: true,
      hideCountdown: ()   => set({ showCountdown: false }),

      // ── Notifications ─────────────────────────────
      notifications: [],
      unreadCount:   0,
      setNotifications: (n) => set({ notifications: n, unreadCount: n.filter((x) => !x.isRead).length }),
      markAllRead:   ()   => set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount:   0,
      })),

      // ── Toast ─────────────────────────────────────
      toast:         null,
      showToast: (msg, type = "success") => {
        set({ toast: { msg, type } });
        setTimeout(() => get().clearToast(), 3500);
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name:    "najjar-app",
      partialize: (s) => ({ dark: s.dark, showCountdown: s.showCountdown }),
    }
  )
);
