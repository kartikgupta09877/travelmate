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
    <Link to={`/app/trips/${t.id}`} className="card card-hover block">
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Chip tone={t.section === "long" ? "signal" : "teal"}>{t.section === "long" ? "Long trip" : "Local"}</Chip>
            <span className="text-xs text-ink-muted">
              {t.date ? prettyDate(t.date) : shortDate(t.created_at)}
            </span>
          </div>
          <Chip tone={statusTone(t.status) as any}>{statusLabel(t.status)}</Chip>
        </div>
        <RouteLine from={t.origin.zone || t.origin.label} to={t.destination.label}
          checkpoint={t.meeting_point?.name} compact />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-teal" /> {time12(t.departure_time)}</span>
            {t.meeting_point && <span className="hidden items-center gap-1.5 sm:inline-flex"><MapPin size={14} className="text-signal" /> {t.meeting_point.name}</span>}
          </div>
          <div className="flex items-center gap-3">
            {t.participants?.length > 0 && (
              <div className="flex -space-x-2">
                {t.participants.slice(0, 3).map((p) => (
                  <Avatar key={p.id} name={p.full_name} src={p.photo_url} id={p.id} size={26} verified={p.verification.identity} />
                ))}
              </div>
            )}
            <span className="font-mono font-700 text-teal tnum">{inr(t.cost_per_person)}</span>
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
    <div className="space-y-6">
      <SectionHeading eyebrow="My trips" title="Your journeys"
        action={<Button sm onClick={() => nav("/app/local")}><Plus size={15} /> New journey</Button>} />

      <div className="overflow-x-auto">
        <Segmented value={bucket} onChange={setBucket}
          options={(Object.keys(BUCKETS) as Bucket[]).map((b) => ({
            value: b, label: <>{b[0].toUpperCase() + b.slice(1)} {counts[b] > 0 && <span className="ml-1 text-xs opacity-70">{counts[b]}</span>}</>,
          }))} />
      </div>

      {isLoading ? <Loading label="Loading your trips…" />
        : isError ? <EmptyState icon={<CalendarCheck size={22} />} title="Could not load trips"
          sub={error instanceof ApiError ? error.message : "Please try again shortly."} />
        : shown.length === 0 ? (
          <EmptyState icon={<CalendarCheck size={22} />} title={`No ${bucket} trips`}
            sub={bucket === "upcoming" ? "When you match with a partner, your confirmed trips show up here." : `You have no ${bucket} trips.`}
            action={bucket === "upcoming" ? <Button sm onClick={() => nav("/app/find")}><RouteIcon size={15} /> Find a partner</Button> : undefined} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{shown.map((t) => <TripRow key={t.id} t={t} />)}</div>
        )}
    </div>
  );
}
