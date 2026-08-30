import { Mail, Phone, Fingerprint, GraduationCap, Car, ShieldCheck, Star } from "lucide-react";
import type { Verification } from "@/lib/types";
import { cx } from "./ui";

const DEFS: { key: keyof Verification; label: string; Icon: typeof Mail }[] = [
  { key: "identity", label: "Identity", Icon: Fingerprint },
  { key: "phone", label: "Phone", Icon: Phone },
  { key: "email", label: "Email", Icon: Mail },
  { key: "college", label: "College", Icon: GraduationCap },
  { key: "vehicle", label: "Vehicle", Icon: Car },
];

export function VerificationBadges({ v, size = "md", only }:
  { v: Verification; size?: "sm" | "md"; only?: (keyof Verification)[] }) {
  const defs = only ? DEFS.filter((d) => only.includes(d.key)) : DEFS;
  const active = defs.filter((d) => v[d.key]);
  if (active.length === 0) return <span className="text-xs text-ink-muted">No verifications yet</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map(({ key, label, Icon }) => (
        <span key={key}
          className={cx("chip-verified", size === "sm" && "px-2 py-0.5 text-[11px]")}
          title={`${label} verified`}>
          <Icon size={size === "sm" ? 11 : 13} /> {label}
        </span>
      ))}
    </div>
  );
}

export function TrustLevel({ level, className }: { level: string; className?: string }) {
  const map: Record<string, string> = {
    High: "bg-verified-wash text-verified",
    Established: "bg-teal-wash text-teal-dark",
    Growing: "bg-signal-wash text-signal",
    New: "bg-ink/5 text-ink-muted",
  };
  return (
    <span className={cx("chip font-semibold", map[level] || map.New, className)}>
      <ShieldCheck size={13} /> {level} trust
    </span>
  );
}

export function Stars({ rating, count, size = 14 }: { rating: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex" aria-label={`${rating} out of 5`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <span key={i} className="relative" style={{ width: size, height: size }}>
              <Star size={size} className="absolute text-ink/15" />
              <span className="absolute overflow-hidden" style={{ width: `${fill * 100}%`, height: size }}>
                <Star size={size} className="text-signal" fill="#F59E0B" />
              </span>
            </span>
          );
        })}
      </span>
      <span className="font-mono text-xs font-700 text-ink-soft tnum">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-ink-muted">({count})</span>}
    </span>
  );
}
