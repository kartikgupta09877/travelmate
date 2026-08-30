/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#101828", soft: "#1D2939", muted: "#475467" },
        canvas: "#F6F8FB",
        teal: { DEFAULT: "#0D9488", dark: "#0F766E", light: "#5EEAD4", wash: "#ECFDF9" },
        verified: { DEFAULT: "#16A34A", wash: "#EAF7EE" },
        signal: { DEFAULT: "#F59E0B", wash: "#FEF6E7" },
        line: "#E4E9F0",
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.12)",
        lift: "0 12px 32px -12px rgba(16,24,40,.22)",
      },
      keyframes: {
        draw: { from: { strokeDashoffset: "1000" }, to: { strokeDashoffset: "0" } },
        drop: { "0%": { transform: "translateY(-6px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        fade: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        draw: "draw 1.6s ease-out forwards",
        drop: "drop .4s ease-out forwards",
        fade: "fade .4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
