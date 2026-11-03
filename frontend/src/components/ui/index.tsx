import {
  type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes,
  type SelectHTMLAttributes, type ReactNode, forwardRef,
} from "react";
import { Loader2 } from "lucide-react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "dark" | "outline" | "ghost" | "danger" | "coral";

export function buttonClass(variant: Variant = "primary", sm = false): string {
  const base: Record<Variant, string> = {
    primary: "btn-primary",
    coral: "btn-coral",
    dark: "btn-dark",
    outline: "btn-outline",
    ghost: "btn-ghost",
    danger: "btn-danger",
  };
  return cx(base[variant], sm && "btn-sm");
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  sm?: boolean;
  lg?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = "primary", sm, lg, loading, icon, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      className={cx(buttonClass(variant, sm), lg && "btn-lg", className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={sm ? 14 : 16} className="animate-spin shrink-0" /> : icon}
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("card", className)} {...rest}>{children}</div>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("p-5 sm:p-6", className)}>{children}</div>;
}

export function SectionHeading({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h2 className="section-title text-xl sm:text-2xl">{title}</h2>
        {sub && <p className="text-sm font-medium text-slate-600 mt-1 max-w-xl">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="label flex items-center justify-between">
      <span>{children}</span>
      {hint && <span className="font-extrabold normal-case tracking-normal text-slate-600">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cx("input", className)} {...rest} />;
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cx("input min-h-[96px] resize-y", className)} {...rest} />;
  }
);

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={cx("input appearance-none bg-[right_0.85rem_center] bg-no-repeat pr-9 cursor-pointer", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>\")" }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} hint={hint}>{label}</Label>
      {children}
    </div>
  );
}

type Tone = "teal" | "verified" | "signal" | "coral" | "mono" | "muted" | "danger" | "info";

export function Chip({ tone = "teal", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  const map: Record<Tone, string> = {
    teal: "chip-teal",
    verified: "chip-verified",
    signal: "chip-signal",
    coral: "chip-coral",
    mono: "chip-mono",
    muted: "bg-slate-100 text-slate-700 border border-slate-200 font-bold",
    danger: "bg-rose-50 text-rose-800 border border-rose-200 font-bold",
    info: "bg-sky-50 text-sky-800 border border-sky-200 font-bold",
  };
  return <span className={cx("chip", map[tone], className)}>{icon}{children}</span>;
}

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cx("animate-spin text-teal-dark", className)} />;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm font-semibold text-slate-600 animate-fade">
      <div className="p-3 rounded-full bg-teal-wash text-teal-dark border border-teal/20 shadow-sm">
        <Spinner size={24} />
      </div>
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 backdrop-blur-xs px-6 py-14 text-center shadow-xs animate-scale-in">
      {icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-wash to-teal/10 text-teal-dark shadow-sm border border-teal/20">
          {icon}
        </div>
      )}
      <h3 className="font-display font-extrabold text-ocean-900 text-lg">{title}</h3>
      {sub && <p className="mt-1.5 max-w-md text-sm font-medium text-slate-600 leading-relaxed">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, tone = "ink", icon }:
  { label: string; value: ReactNode; sub?: string; tone?: "ink" | "teal" | "signal" | "verified" | "coral"; icon?: ReactNode }) {
  const color = {
    ink: "text-ocean-900",
    teal: "text-teal-dark",
    signal: "text-amber-700",
    verified: "text-emerald-700",
    coral: "text-coral-warm",
  }[tone];

  const iconBg = {
    ink: "bg-slate-100 text-slate-700 border border-slate-200",
    teal: "bg-teal-wash text-teal-dark border border-teal/20",
    signal: "bg-amber-50 text-amber-700 border border-amber-200",
    verified: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    coral: "bg-coral-wash text-coral-warm border border-coral-warm/20",
  }[tone];

  return (
    <div className="card card-hover relative overflow-hidden border border-slate-200/80">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</span>
          {icon && <span className={cx("p-2 rounded-xl text-xs font-semibold shadow-2xs", iconBg)}>{icon}</span>}
        </div>
        <div className={cx("mt-3 font-display font-extrabold text-2xl sm:text-3xl tnum tracking-tight", color)}>{value}</div>
        {sub && <div className="mt-1 text-xs font-semibold text-slate-600">{sub}</div>}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }:
  { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-xl px-4 py-2 text-xs sm:text-sm font-bold font-display transition-all duration-200 select-none",
            value === o.value
              ? "bg-white text-ocean-900 shadow-sm border border-slate-200 scale-[1.02]"
              : "text-slate-600 hover:text-ocean-900 hover:bg-white/50"
          )}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 group cursor-pointer">
      <span className={cx("relative h-6 w-11 rounded-full transition-colors duration-200", checked ? "bg-teal-dark" : "bg-slate-300")}>
        <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200", checked ? "left-[22px]" : "left-0.5")} />
      </span>
      {label && <span className="text-sm font-bold text-slate-800 group-hover:text-ocean-900">{label}</span>}
    </button>
  );
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-slate-200 my-4" />;
  return (
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-500 my-4">
      <hr className="flex-1 border-slate-200" /> {label} <hr className="flex-1 border-slate-200" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse border-slate-200/80 p-5">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-1/4 rounded-full bg-slate-200" />
        <div className="h-5 w-12 rounded-full bg-slate-200" />
      </div>
      <div className="h-4 w-3/4 rounded bg-slate-200 mb-2" />
      <div className="h-3 w-1/2 rounded bg-slate-100 mb-4" />
      <div className="h-10 w-full rounded-xl bg-slate-100" />
    </div>
  );
}
