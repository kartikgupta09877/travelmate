import {
  type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes,
  type SelectHTMLAttributes, type ReactNode, forwardRef,
} from "react";
import { Loader2 } from "lucide-react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "dark" | "outline" | "ghost" | "danger";
export function buttonClass(variant: Variant = "primary", sm = false): string {
  const base: Record<Variant, string> = {
    primary: "btn-primary", dark: "btn-dark", outline: "btn-outline",
    ghost: "btn-ghost", danger: "btn-danger",
  };
  return cx(base[variant], sm && "btn-sm");
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  sm?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}
export function Button({ variant = "primary", sm, loading, icon, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button className={cx(buttonClass(variant, sm), className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={sm ? 14 : 16} className="animate-spin" /> : icon}
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
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h2 className="section-title text-xl sm:text-2xl">{title}</h2>
        {sub && <p className="text-sm text-ink-muted mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="label flex items-center justify-between">
      <span>{children}</span>
      {hint && <span className="font-normal normal-case tracking-normal text-ink-muted/70">{hint}</span>}
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
    return <textarea ref={ref} className={cx("input min-h-[90px] resize-y", className)} {...rest} />;
  }
);

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cx("input appearance-none bg-[right_0.75rem_center] bg-no-repeat pr-9", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23475467' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")" }}
      {...rest}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <Label htmlFor={htmlFor} hint={hint}>{label}</Label>
      {children}
    </div>
  );
}

type Tone = "teal" | "verified" | "signal" | "mono" | "muted" | "danger" | "info";
export function Chip({ tone = "teal", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  const map: Record<Tone, string> = {
    teal: "bg-teal-wash text-teal-dark",
    verified: "bg-verified-wash text-verified",
    signal: "bg-signal-wash text-signal",
    mono: "font-mono bg-ink/5 text-ink-soft",
    muted: "bg-ink/5 text-ink-muted",
    danger: "bg-red-50 text-red-600",
    info: "bg-sky-50 text-sky-700",
  };
  return <span className={cx("chip", map[tone], className)}>{icon}{children}</span>;
}

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cx("animate-spin text-teal", className)} />;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
      <Spinner /> {label}
    </div>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-teal-wash text-teal">{icon}</div>}
      <h3 className="font-display font-600 text-ink">{title}</h3>
      {sub && <p className="mt-1 max-w-sm text-sm text-ink-muted">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, tone = "ink", icon }:
  { label: string; value: ReactNode; sub?: string; tone?: "ink" | "teal" | "signal" | "verified"; icon?: ReactNode }) {
  const color = { ink: "text-ink", teal: "text-teal", signal: "text-signal", verified: "text-verified" }[tone];
  return (
    <div className="card card-hover">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
          {icon && <span className="text-ink-muted/70">{icon}</span>}
        </div>
        <div className={cx("mt-2 font-display font-700 text-2xl sm:text-[26px] tnum", color)}>{value}</div>
        {sub && <div className="mt-0.5 text-xs text-ink-muted">{sub}</div>}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }:
  { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-xl bg-ink/5 p-1" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-lg px-3.5 py-1.5 text-sm font-semibold font-display transition-all",
            value === o.value ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
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
      className="inline-flex items-center gap-2">
      <span className={cx("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-teal" : "bg-ink/15")}>
        <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </span>
      {label && <span className="text-sm text-ink-soft">{label}</span>}
    </button>
  );
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-line" />;
  return (
    <div className="flex items-center gap-3 text-xs text-ink-muted">
      <hr className="flex-1 border-line" /> {label} <hr className="flex-1 border-line" />
    </div>
  );
}

export function SkeletonCard() {
  return <div className="card animate-pulse"><div className="p-5"><div className="h-4 w-1/3 rounded bg-ink/10" /><div className="mt-3 h-3 w-2/3 rounded bg-ink/5" /><div className="mt-2 h-3 w-1/2 rounded bg-ink/5" /></div></div>;
}
