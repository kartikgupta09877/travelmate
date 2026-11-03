import { cx } from "./ui";

export function Logo({ mark = true, wordmark = true, className, tone = "light" }:
  { mark?: boolean; wordmark?: boolean; className?: string; tone?: "light" | "dark" }) {
  const text = tone === "dark" ? "text-white" : "text-ocean-900";

  return (
    <span className={cx("inline-flex items-center gap-2.5 select-none", className)}>
      {mark && (
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden className="shrink-0 drop-shadow-sm">
          <defs>
            <linearGradient id="logo-bg-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
            <linearGradient id="logo-bg-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="10" fill={tone === "dark" ? "url(#logo-bg-dark)" : "url(#logo-bg-light)"} />
          <path d="M8 22 L14 12 L24 10" fill="none" stroke={tone === "dark" ? "#FFFFFF" : "#2DD4BF"} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy="22" r="3" fill={tone === "dark" ? "#5EEAD4" : "#2DD4BF"} />
          <rect x="11.5" y="9.5" width="5" height="5" rx="1.2" transform="rotate(45 14 12)" fill="#F59E0B" />
          <circle cx="24" cy="10" r="3" fill="#10B981" />
        </svg>
      )}
      {wordmark && (
        <span className={cx("font-display font-800 text-lg sm:text-xl tracking-tight", text)}>
          Travel<span className="text-teal-dark font-900">Mate</span>
        </span>
      )}
    </span>
  );
}
