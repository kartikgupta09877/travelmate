import { cx } from "./ui";

// The signature "Wayline" element: an origin node, an optional diamond
// checkpoint, and a destination node connected by a route stroke.
export function RouteLine({
  from, to, checkpoint, animate, className, compact,
}: {
  from?: string; to?: string; checkpoint?: string | null;
  animate?: boolean; className?: string; compact?: boolean;
}) {
  return (
    <div className={cx("w-full", className)}>
      <svg viewBox="0 0 320 40" className="w-full" style={{ height: compact ? 28 : 40 }} aria-hidden>
        <line x1="16" y1="20" x2="304" y2="20" stroke="#E4E9F0" strokeWidth="3" strokeLinecap="round" />
        <path d="M16 20 H304" fill="none" stroke="#0D9488" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={animate ? "1000" : "6 0"}
          className={animate ? "animate-draw" : ""} />
        {/* origin */}
        <circle cx="16" cy="20" r="6" fill="#0D9488" />
        <circle cx="16" cy="20" r="11" fill="#0D9488" opacity="0.12" />
        {/* checkpoint diamond */}
        {checkpoint !== undefined && (
          <g transform="translate(160 20)" className={animate ? "animate-drop" : ""}>
            <rect x="-6" y="-6" width="12" height="12" rx="2" transform="rotate(45)" fill="#F59E0B" />
            <rect x="-10" y="-10" width="20" height="20" rx="3" transform="rotate(45)" fill="#F59E0B" opacity="0.14" />
          </g>
        )}
        {/* destination */}
        <circle cx="304" cy="20" r="6" fill="#16A34A" />
        <circle cx="304" cy="20" r="11" fill="#16A34A" opacity="0.12" />
      </svg>
      {(from || to || checkpoint) && (
        <div className="mt-1 flex items-center justify-between text-[11px] font-medium text-ink-muted">
          <span className="max-w-[32%] truncate">{from}</span>
          {checkpoint ? <span className="max-w-[36%] truncate text-signal font-semibold">◇ {checkpoint}</span> : <span />}
          <span className="max-w-[32%] truncate text-right">{to}</span>
        </div>
      )}
    </div>
  );
}
