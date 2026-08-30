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
    <div className="card card-hover overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={p.full_name} src={p.photo_url} id={p.id} size={52} verified={p.verification.identity} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display font-700 text-ink">{p.full_name}</h3>
            </div>
            <div className="mt-0.5"><Stars rating={p.stats.rating} count={p.stats.ratings_count} /></div>
            <div className="mt-2"><VerificationBadges v={p.verification} size="sm" /></div>
          </div>
          <div className="shrink-0"><MatchScore score={r.score} /></div>
        </div>

        <div className="mt-4">
          <RouteLine from={j.origin.zone || j.origin.label} to={j.destination.label}
            checkpoint={cp ? cp.name : undefined} compact />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Chip tone="mono" icon={<Clock size={12} />}>{time12(j.departure_time)}</Chip>
          {yourTime && (
            <span className="text-ink-muted">
              vs your {time12(yourTime)} · <span className="font-medium text-ink-soft">{r.departure_diff_min} min apart</span>
            </span>
          )}
          <Chip tone="muted" icon={<VIcon size={12} />}>{j.vehicle_type === "bike" ? "Bike" : "Car"}</Chip>
          <Chip tone="muted" icon={<Users size={12} />}>{j.available_seats} seat{j.available_seats === 1 ? "" : "s"}</Chip>
        </div>

        {r.reasons?.length > 0 && (
          <ul className="mt-3 grid gap-1">
            {r.reasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-ink-muted">
                <CheckCircle2 size={13} className="shrink-0 text-verified" /> {reason}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-line bg-canvas/60 px-5 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink-muted">Your est. share</div>
          <div className="font-mono font-700 text-teal tnum">{inr(r.estimated_share)}</div>
        </div>
        <button onClick={onOpen} className={cx("btn-primary btn-sm")}>
          View match <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
