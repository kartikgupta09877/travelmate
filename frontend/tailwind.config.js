/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0F172A",
          soft: "#334155",
          muted: "#475569",
          light: "#64748B",
        },
        "ink-soft": "#334155",
        "ink-muted": "#475569",
        "ink-light": "#64748B",

        ocean: {
          DEFAULT: "#0F172A",
          50: "#F8FAFC",
          100: "#E2E8F0",
          600: "#334155",
          700: "#1E293B",
          800: "#1E293B",
          900: "#0F172A",
          950: "#0B132B",
        },
        "ocean-950": "#0B132B",
        "ocean-900": "#0F172A",
        "ocean-800": "#1E293B",
        "ocean-700": "#1E293B",
        "ocean-600": "#334155",
        "ocean-100": "#E2E8F0",
        "ocean-50": "#F8FAFC",

        canvas: "#F8FAFC",

        teal: {
          DEFAULT: "#0D9488",
          dark: "#0F766E",
          light: "#2DD4BF",
          wash: "#CCFBF1",
          glow: "#5EEAD4",
        },
        "teal-dark": "#0F766E",
        "teal-light": "#2DD4BF",
        "teal-wash": "#CCFBF1",
        "teal-glow": "#5EEAD4",

        brand: {
          DEFAULT: "#0D9488",
          50: "#F0FDF4",
          100: "#CCFBF1",
          500: "#0D9488",
          600: "#0F766E",
          700: "#115E59",
        },

        coral: {
          DEFAULT: "#FF6B6B",
          warm: "#F97316",
          wash: "#FFF7ED",
          glow: "#FF8E53",
        },
        "coral-warm": "#F97316",
        "coral-wash": "#FFF7ED",
        "coral-glow": "#FF8E53",

        emerald: {
          DEFAULT: "#16A34A",
          dark: "#15803D",
          wash: "#DCFCE7",
        },
        "emerald-dark": "#15803D",
        "emerald-wash": "#DCFCE7",

        verified: {
          DEFAULT: "#16A34A",
          wash: "#DCFCE7",
        },
        "verified-wash": "#DCFCE7",

        signal: {
          DEFAULT: "#F59E0B",
          wash: "#FEF3C7",
        },
        "signal-wash": "#FEF3C7",

        success: {
          DEFAULT: "#16A34A",
          wash: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#F59E0B",
          wash: "#FEF3C7",
        },
        error: {
          DEFAULT: "#DC2626",
          wash: "#FEE2E2",
        },

        line: "#E2E8F0",
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
        pill: "9999px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        "2xs": "0 1px 1px 0 rgba(15, 23, 42, 0.03)",
        card: "0 2px 10px -2px rgba(15, 23, 42, 0.05), 0 8px 24px -10px rgba(15, 23, 42, 0.08)",
        lift: "0 20px 40px -15px rgba(15, 23, 42, 0.16)",
        glow: "0 0 25px -5px rgba(13, 148, 136, 0.35)",
        "coral-glow": "0 0 25px -5px rgba(249, 115, 22, 0.35)",
        soft: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      keyframes: {
        draw: { from: { strokeDashoffset: "1000" }, to: { strokeDashoffset: "0" } },
        drop: { "0%": { transform: "translateY(-6px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        fade: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-6px)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pulse-subtle": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.7" } },
      },
      animation: {
        draw: "draw 1.6s ease-out forwards",
        drop: "drop .4s ease-out forwards",
        fade: "fade .4s ease-out forwards",
        "scale-in": "scale-in .25s ease-out forwards",
        "slide-up": "slide-up .35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        "pulse-subtle": "pulse-subtle 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
