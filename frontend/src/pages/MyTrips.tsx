import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Clock, MapPin, Plus, Route as RouteIcon } from "lucide-react";
import type { Trip, TripStatus } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { RouteLine } from "@/components/RouteLine";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Card, Chip, Segmented, SectionHeading, Loading, EmptyState, cx } from "@/components/ui";
import { inr, time12, prettyDate, shortDate, statusLabel } from "@/lib/format";

type Bucket = "upcoming" | "active" | "completed" | "cancelled";

const BUCKETS: Record<Bucket, TripStatus[]> = {
  upcoming: ["pending", "requested", "accepted", "confirmed"],
  active: ["in_progress"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

const statusTone = (s: TripStatus) =>
  s === "completed" ? "verified" : s === "cancelled" ? "danger"
    : s === "in_progress" ? "signal" : s === "confirmed" || s === "accepted" ? "teal" : "muted";

function TripRow({ t }: { t: Trip }) {
  return (
    <Link to={`/app/trips/${t.id}`} className="card card-hover block overflow-hidden border border-slate-200/80 shadow-card">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Chip tone={t.section === "long" ? "coral" : "teal"}>{t.section === "long" ? "Intercity Trip" : "Local Commute"}</Chip>
            <span className="text-xs font-semibold text-slate-600">
              {t.date ? prettyDate(t.date) : shortDate(t.created_at)}
            </span>
          </div>
          <Chip tone={statusTone(t.status) as any}>{statusLabel(t.status)}</Chip>
        </div>

        <RouteLine from={t.origin.zone || t.origin.label} to={t.destination.label}
          checkpoint={t.meeting_point?.name} compact />

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-teal" /> {time12(t.departure_time)}</span>
            {t.meeting_point && <span className="hidden items-center gap-1.5 sm:inline-flex"><MapPin size={14} className="text-amber-500" /> {t.meeting_point.name}</span>}
          </div>
          <div className="flex items-center gap-3">
            {t.participants?.length > 0 && (
              <div className="flex -space-x-2">
                {t.participants.slice(0, 3).map((p) => (
                  <Avatar key={p.id} name={p.full_name} src={p.photo_url} id={p.id} size={28} verified={p.verification.identity} />
                ))}
              </div>
            )}
            <span className="font-mono font-800 text-teal-dark text-sm tnum">{inr(t.cost_per_person)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MyTrips() {
  const nav = useNavigate();
  const [bucket, setBucket] = useState<Bucket>("upcoming");
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["trips"], queryFn: api.trips.list });

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { upcoming: 0, active: 0, completed: 0, cancelled: 0 };
    for (const t of data || []) for (const b of Object.keys(BUCKETS) as Bucket[]) if (BUCKETS[b].includes(t.status)) c[b]++;
    return c;
  }, [data]);

  const shown = (data || []).filter((t) => BUCKETS[bucket].includes(t.status));

  return (
    <div className="space-y-6 animate-fade">
      <SectionHeading eyebrow="My Trips & Journeys" title="Your scheduled and past trips"
        action={<Button lg onClick={() => nav("/app/local")}><Plus size={16} /> New Journey</Button>} />

      <div className="overflow-x-auto pb-1">
        <Segmented value={bucket} onChange={setBucket}
          options={(Object.keys(BUCKETS) as Bucket[]).map((b) => ({
            value: b, label: <>{b[0].toUpperCase() + b.slice(1)} {counts[b] > 0 && <span className="ml-1 text-xs opacity-70">({counts[b]})</span>}</>,
          }))} />
      </div>

      {isLoading ? <Loading label="Loading your trips…" />
        : isError ? <EmptyState icon={<CalendarCheck size={24} />} title="Could not load your trips"
          sub={error instanceof ApiError ? error.message : "Please try again shortly."} />
        : shown.length === 0 ? (
          <EmptyState icon={<CalendarCheck size={24} />} title={`No ${bucket} trips found`}
            sub={bucket === "upcoming" ? "When you publish or join a journey, confirmed trips will appear here." : `You currently have no ${bucket} trips.`}
            action={bucket === "upcoming" ? <Button sm onClick={() => nav("/app/find")}><RouteIcon size={15} /> Find a Partner</Button> : undefined} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">{shown.map((t) => <TripRow key={t.id} t={t} />)}</div>
        )}
    </div>
  );
}
