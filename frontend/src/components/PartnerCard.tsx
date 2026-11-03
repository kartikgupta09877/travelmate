import { Car, Bike, Clock, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import type { PartnerResult } from "@/lib/types";
import { Avatar } from "./ui/Avatar";
import { VerificationBadges, Stars } from "./VerificationBadges";
import { MatchScore } from "./MatchScore";
import { RouteLine } from "./RouteLine";
import { Chip, cx } from "./ui";
import { inr, time12 } from "@/lib/format";

export function PartnerCard({ r, yourTime, onOpen }:
  { r: PartnerResult; yourTime?: string; onOpen: () => void }) {
  const p = r.partner;
  const j = r.journey;
  const VIcon = j.vehicle_type === "bike" ? Bike : Car;
  const cp = r.suggested_checkpoint;

  return (
    <div className="card card-hover overflow-hidden flex flex-col justify-between border border-slate-200/80 shadow-card">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <Avatar name={p.full_name} src={p.photo_url} id={p.id} size={52} verified={p.verification.identity} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display font-800 text-ocean-900 text-base">{p.full_name}</h3>
              <div className="mt-1"><Stars rating={p.stats.rating} count={p.stats.ratings_count} /></div>
              <div className="mt-2"><VerificationBadges v={p.verification} size="sm" /></div>
            </div>
          </div>
          <MatchScore score={r.score} size={68} />
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/60">
          <RouteLine from={j.origin.zone || j.origin.label} to={j.destination.label}
            checkpoint={cp ? cp.name : undefined} compact />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <Chip tone="mono" icon={<Clock size={13} />}>{time12(j.departure_time)}</Chip>
          {yourTime && (
            <span className="text-slate-600 font-semibold">
              vs your {time12(yourTime)} · <span className="font-bold text-ocean-900">{r.departure_diff_min}m apart</span>
            </span>
          )}
          <Chip tone="muted" icon={<VIcon size={13} />}>{j.vehicle_type === "bike" ? "Bike" : "Car"}</Chip>
          <Chip tone="muted" icon={<Users size={13} />}>{j.available_seats} seat{j.available_seats === 1 ? "" : "s"}</Chip>
        </div>

        {r.reasons?.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
            {r.reasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/90 px-5 py-3.5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Your est. share</div>
          <div className="font-mono font-800 text-teal-dark text-lg tnum">{inr(r.estimated_share)}</div>
        </div>
        <button onClick={onOpen} className="btn-primary btn-sm">
          View match <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
