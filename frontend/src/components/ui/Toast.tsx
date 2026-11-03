import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cx } from "./index";

type Kind = "success" | "error" | "info";
interface Toast { id: number; kind: Kind; message: string; }
interface Ctx { push: (message: string, kind?: Kind) => void; }

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: Kind = "info") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, kind, message }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200);
  }, []);
  const remove = (id: number) => setItems((s) => s.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 sm:bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => {
          const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "error" ? AlertTriangle : Info;
          const tone = t.kind === "success" ? "text-emerald-600" : t.kind === "error" ? "text-rose-600" : "text-teal-dark";
          return (
            <div key={t.id}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lift animate-fade">
              <Icon size={18} className={cx("mt-0.5 shrink-0", tone)} />
              <p className="flex-1 text-sm font-semibold text-ocean-900">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-ocean-900 transition-colors"><X size={15} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastContext);
  if (!ctx) return { push: () => {} };
  return ctx;
}
