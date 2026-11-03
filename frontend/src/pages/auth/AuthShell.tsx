import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { RouteLine } from "@/components/RouteLine";
import { ShieldCheck, Users, IndianRupee, Sparkles, CheckCircle2 } from "lucide-react";

export function AuthShell({ title, sub, children, footer }:
  { title: string; sub: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-12 bg-canvas">
      {/* Left side hero showcase */}
      <div className="relative hidden overflow-hidden bg-ocean-950 p-12 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between border-r border-slate-800">
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-teal-dark/30 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-coral-warm/20 blur-[130px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <Link to="/" className="relative z-10">
          <Logo tone="dark" />
        </Link>

        <div className="relative z-10 max-w-md my-auto py-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-teal-light backdrop-blur-md mb-6 border border-white/10">
            <Sparkles size={14} className="text-amber-400" /> Safe Shared Mobility
          </div>

          <h2 className="font-display font-800 text-3xl sm:text-4xl leading-tight tracking-tight">
            Every journey is better with the right company.
          </h2>

          <div className="mt-8 rounded-3xl bg-white/5 p-6 backdrop-blur-md border border-white/10 shadow-lift">
            <RouteLine from="Your area" to="Destination" checkpoint="Safe public checkpoint" animate />
          </div>

          <div className="mt-8 space-y-3.5 text-sm text-slate-300 font-medium">
            <p className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-teal-light shrink-0" />
              Verified community with safe public meeting points
            </p>
            <p className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-teal-light shrink-0" />
              Trust-based matching on route, time & reliability
            </p>
            <p className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-teal-light shrink-0" />
              Fair per-person travel cost splitting
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          Not a taxi app · A verified peer community for shared rides
        </p>
      </div>

      {/* Right side form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:col-span-7 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/"><Logo /></Link>
          </div>

          <div className="mb-8">
            <h1 className="font-display font-800 text-3xl text-ocean-900 tracking-tight">{title}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600 leading-relaxed">{sub}</p>
          </div>

          <div className="rounded-3xl bg-white p-7 sm:p-8 shadow-card border border-slate-200/80">
            {children}
          </div>

          <div className="mt-6 text-center text-sm font-semibold text-slate-600">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
