import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { RouteLine } from "@/components/RouteLine";
import { ShieldCheck, Users, IndianRupee } from "lucide-react";

export function AuthShell({ title, sub, children, footer }:
  { title: string; sub: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <Link to="/" className="relative"><Logo tone="dark" /></Link>
        <div className="relative">
          <h2 className="font-display font-800 text-3xl leading-tight">Every journey is better with the right company.</h2>
          <div className="mt-8 max-w-sm rounded-2xl bg-white/5 p-5">
            <RouteLine from="Your area" to="Destination" checkpoint="Safe checkpoint" animate />
          </div>
          <div className="mt-8 space-y-3 text-sm text-white/70">
            <p className="flex items-center gap-2.5"><ShieldCheck size={18} className="text-teal-light" /> Verified community with safe public checkpoints</p>
            <p className="flex items-center gap-2.5"><Users size={18} className="text-teal-light" /> Trust-based matching on route, time & reliability</p>
            <p className="flex items-center gap-2.5"><IndianRupee size={18} className="text-teal-light" /> Fair per-person cost splitting</p>
          </div>
        </div>
        <p className="relative text-xs text-white/40">Not a taxi service. A verified community for shared journeys.</p>
      </div>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Link to="/"><Logo /></Link></div>
          <h1 className="font-display font-800 text-2xl text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{sub}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-6 text-sm text-ink-muted">{footer}</div>
        </div>
      </div>
    </div>
  );
}
