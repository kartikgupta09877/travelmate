import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "./index";

export function Modal({ open, onClose, title, children, footer, size = "md" }:
  { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;
  const w = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade" onClick={onClose} />
      <div role="dialog" aria-modal="true"
        className={cx("relative z-10 w-full rounded-t-2xl sm:rounded-2xl bg-white shadow-lift animate-fade", w)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display font-700 text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-ink/5" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
