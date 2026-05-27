"use client";
import { useState, useEffect } from "react";
import { getCountdown, pad } from "@/lib/utils";

const TARGET = new Date(process.env.NEXT_PUBLIC_COUNTDOWN_TARGET ?? "2026-07-17T00:00:00");

export function useCountdown() {
  const [t, setT] = useState(getCountdown(TARGET));

  useEffect(() => {
    const id = setInterval(() => setT(getCountdown(TARGET)), 1000);
    return () => clearInterval(id);
  }, []);

  return {
    ...t,
    formatted: `${pad(t.d)} يوم : ${pad(t.h)}س : ${pad(t.m)}د : ${pad(t.s)}ث`,
  };
}
