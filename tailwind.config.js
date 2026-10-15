/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "neu-bg": "#e6ecf4",
        "neu-base": "#e6ecf4",
        "neu-dark": "#c2cbd8",
        "neu-light": "#ffffff",
        "primary": "#00677d",
        "primary-container": "#00b4d8",
        "secondary": "#006c4f",
        "secondary-container": "#51fac1",
        "tertiary": "#b71849",
        "accent-cyan": "#00b4d8",
        "accent-mint": "#05c48b",
        "accent-coral": "#f43f5e",
        "slate-900": "#0f172a",
        "slate-800": "#1e293b",
        "slate-700": "#334155",
        "slate-600": "#475569",
        "slate-500": "#64748b",
        "slate-400": "#94a3b8"
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      }
    },
  },
  plugins: [],
}
