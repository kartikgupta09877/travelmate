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
  const tone = score >= 85 ? "#16A34A" : score >= 65 ? "#0D9488" : score >= 40 ? "#F59E0B" : "#98A2B3";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4E9F0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100}
          style={{ transition: "stroke-dashoffset .1s linear" }} />
      </svg>
      <div className="absolute text-center leading-none">
        <div className="font-display font-800 tnum" style={{ color: tone, fontSize: size * 0.28 }}>{shown}%</div>
        <div className="text-[9px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      </div>
    </div>
  );
}

export function MatchBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? "bg-verified" : value >= 50 ? "bg-teal" : "bg-signal";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className="font-mono font-700 text-ink-soft tnum">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/5">
        <div className={cx("h-full rounded-full transition-all duration-700", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
