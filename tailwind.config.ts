import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: "#e8197c", dark: "#c4136a", light: "#ff3a97" },
        gold:     { DEFAULT: "#e8b84b" },
        teal:     { DEFAULT: "#2a9d8f" },
        navy:     { DEFAULT: "#13192a" },
        card:     { DEFAULT: "#1e2640" },
        card2:    { DEFAULT: "#252e4a" },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "Cairo", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        xl:  "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "fade-up":  "fadeUp 0.25s ease",
        "fade-in":  "fadeIn 0.2s ease",
        "slide-in": "slideIn 0.3s ease",
        "pulse-pk": "pulsePk 2s infinite",
      },
      keyframes: {
        fadeUp:   { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn:   { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn:  { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        pulsePk:  { "0%,100%": { opacity: "1" }, "50%": { opacity: ".5" } },
      },
    },
  },
  plugins: [animate],
};

export default config;
