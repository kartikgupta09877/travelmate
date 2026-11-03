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
    <div className="card card-hover h-full flex flex-col justify-between overflow-hidden border border-slate-200/80 shadow-card">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className={cx("chip", isLong ? "chip-coral" : "chip-teal")}>
            {isLong ? "Intercity Trip" : "Local Commute"}
          </span>
          <Chip tone="mono" icon={<Clock size={13} />}>{time12(j.departure_time)}</Chip>
        </div>

        <RouteLine from={j.origin.zone || j.origin.label} to={j.destination.label}
          checkpoint={isLong ? undefined : null} compact />

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5"><VIcon size={14} /> {j.vehicle_type === "bike" ? "Bike" : "Car"}</span>
          <span className="inline-flex items-center gap-1.5"><Users size={14} /> {j.available_seats} seats left</span>
          <span className="inline-flex items-center gap-1.5">
            {j.recurrence === "one_time" || j.recurrence === "one_way" ? <CalendarDays size={14} /> : <Repeat size={14} />}
            {isLong && j.date ? prettyDate(j.date) : recurrenceLabel(j.recurrence)}
          </span>
          <span>· {km(j.distance_km)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/90 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {j.host && <Avatar name={j.host.full_name} src={j.host.photo_url} id={j.host.id} size={30} verified={j.host.verification.identity} />}
          <span className="text-xs font-bold text-ocean-900">{j.host?.full_name || "Host"}</span>
        </div>
        {perPerson !== undefined && (
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">≈ per person</div>
            <div className="font-mono font-800 text-teal-dark text-base tnum">{inr(perPerson)}</div>
          </div>
        )}
      </div>
    </div>
  );

  return to ? <Link to={to} className="block h-full">{body}</Link> : body;
}
