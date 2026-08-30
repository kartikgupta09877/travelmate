import { Link } from "react-router-dom";
import { Car, Bike, Clock, Users, CalendarDays, Repeat } from "lucide-react";
import type { Journey } from "@/lib/types";
import { RouteLine } from "./RouteLine";
import { Chip, cx } from "./ui";
import { inr, time12, km, recurrenceLabel, prettyDate } from "@/lib/format";
import { Avatar } from "./ui/Avatar";

export function JourneyCard({ j, to }: { j: Journey; to?: string }) {
  const VIcon = j.vehicle_type === "bike" ? Bike : Car;
  const isLong = j.type === "long";
  const perPerson = j.per_person_cost;
  const body = (
    <div className="card card-hover h-full">
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className={cx("chip", isLong ? "bg-signal-wash text-signal" : "bg-teal-wash text-teal-dark")}>
            {isLong ? "Long trip" : "Local"}
          </span>
          <Chip tone="mono" icon={<Clock size={12} />}>{time12(j.departure_time)}</Chip>
        </div>
        <RouteLine from={j.origin.zone || j.origin.label} to={j.destination.label}
          checkpoint={isLong ? undefined : null} compact />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1"><VIcon size={13} /> {j.vehicle_type === "bike" ? "Bike" : "Car"}</span>
          <span className="inline-flex items-center gap-1"><Users size={13} /> {j.available_seats} left</span>
          <span className="inline-flex items-center gap-1">
            {j.recurrence === "one_time" || j.recurrence === "one_way" ? <CalendarDays size={13} /> : <Repeat size={13} />}
            {isLong && j.date ? prettyDate(j.date) : recurrenceLabel(j.recurrence)}
          </span>
          <span>· {km(j.distance_km)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line bg-canvas/60 px-5 py-3">
        <div className="flex items-center gap-2">
          {j.host && <Avatar name={j.host.full_name} src={j.host.photo_url} id={j.host.id} size={28} verified={j.host.verification.identity} />}
          <span className="text-xs text-ink-muted">{j.host?.full_name || "Host"}</span>
        </div>
        {perPerson !== undefined && (
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-ink-muted">≈ per person</div>
            <div className="font-mono font-700 text-teal tnum">{inr(perPerson)}</div>
          </div>
        )}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}
