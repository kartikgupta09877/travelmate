import { useEffect, useRef, useState } from "react";
import { cx } from "./ui";

export function MatchScore({ score, size = 72, label = "Match" }:
  { score: number; size?: number; label?: string }) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(score); return; }
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(eased * score));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [score]);

  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = score >= 85 ? "#10B981" : score >= 65 ? "#0D9488" : score >= 40 ? "#F59E0B" : "#64748B";

  return (
    <div className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-xs">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100}
          style={{ transition: "stroke-dashoffset .1s linear" }} />
      </svg>
      <div className="absolute text-center leading-none">
        <div className="font-display font-800 tnum tracking-tight" style={{ color: tone, fontSize: size * 0.28 }}>{shown}%</div>
        <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export function MatchBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? "bg-emerald-600" : value >= 50 ? "bg-teal-dark" : "bg-amber-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-700">{label}</span>
        <span className="font-mono font-bold text-ocean-900 tnum">{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
        <div className={cx("h-full rounded-full transition-all duration-700 shadow-xs", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
