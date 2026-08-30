import { cx } from "./ui";

export function Logo({ mark = true, wordmark = true, className, tone = "light" }:
  { mark?: boolean; wordmark?: boolean; className?: string; tone?: "light" | "dark" }) {
  const text = tone === "dark" ? "text-white" : "text-ink";
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      {mark && (
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden className="shrink-0">
          <rect width="32" height="32" rx="8" fill={tone === "dark" ? "#0D9488" : "#101828"} />
          <path d="M7 22 L14 12 L25 10" fill="none" stroke={tone === "dark" ? "#fff" : "#0D9488"} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="7" cy="22" r="3" fill={tone === "dark" ? "#fff" : "#0D9488"} />
          <rect x="11.5" y="9.5" width="5" height="5" rx="1.2" transform="rotate(45 14 12)" fill="#F59E0B" />
          <circle cx="25" cy="10" r="3" fill="#16A34A" />
        </svg>
      )}
      {wordmark && <span className={cx("font-display font-800 text-lg tracking-tight", text)}>TravelMate</span>}
    </span>
  );
}
