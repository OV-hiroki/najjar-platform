/** @type {import('tailwindcss').Config} */
module.exports = {
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

    },
  },
  plugins: [],
};
