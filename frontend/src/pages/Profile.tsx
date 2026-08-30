import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Car, Bike, CalendarDays, CheckCircle2, XCircle, Pencil, Route as RouteIcon, Quote, MapPin,
} from "lucide-react";
import type { UserPublic } from "@/lib/types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadges, TrustLevel, Stars } from "@/components/VerificationBadges";
import { ReportButton, BlockButton } from "@/components/SafetyActions";
import { Button, Card, Stat, Loading, EmptyState, Chip } from "@/components/ui";
import { prettyDate, relativeTime, statusLabel } from "@/lib/format";

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const isSelf = !id || id === user?.id;
  const { data: fetched, isLoading } = useQuery({
    queryKey: ["user", id], queryFn: () => api.users.get(id!), enabled: !isSelf && !!id,
  });
  const p: UserPublic | undefined = isSelf ? user ?? undefined : fetched;
  const { data: reviews } = useQuery({ queryKey: ["reviews", p?.id], queryFn: () => api.reviews.forUser(p!.id), enabled: !!p });
  const [blocked, setBlocked] = useState(false);

  if (isLoading || !p) return <Loading label="Loading profile…" />;
  const VIcon = p.vehicle.type === "bike" ? Bike : Car;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-teal to-teal-dark" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar name={p.full_name} src={p.photo_url} id={p.id} size={84} verified={p.verification.identity} />
            {isSelf ? (
              <Link to="/app/settings"><Button variant="outline" sm><Pencil size={14} /> Edit profile</Button></Link>
            ) : (
              <div className="flex gap-2">
                <ReportButton userId={p.id} />
                <BlockButton userId={p.id} blocked={blocked} onChange={setBlocked} />
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-display font-800 text-2xl text-ink">{p.full_name}</h1>
            <TrustLevel level={p.trust_level} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <Stars rating={p.stats.rating} count={p.stats.ratings_count} />
            <span className="inline-flex items-center gap-1 text-sm text-ink-muted"><MapPin size={13} /> {p.city}</span>
            <span className="inline-flex items-center gap-1 text-sm text-ink-muted"><CalendarDays size={13} /> Member since {prettyDate(p.stats.member_since)}</span>
          </div>
          {p.bio && <p className="mt-3 text-sm text-ink-soft">{p.bio}</p>}
          <div className="mt-4"><VerificationBadges v={p.verification} /></div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Trips" value={p.stats.completed_trips} icon={<RouteIcon size={16} />} />
        <Stat label="Rating" value={p.stats.rating.toFixed(1)} tone="signal" />
        <Stat label="Cancellation" value={`${Math.round(p.stats.cancellation_rate * 100)}%`} sub="of trips" />
        <Stat label="No-show" value={`${Math.round(p.stats.no_show_rate * 100)}%`} sub="of trips" />
      </div>

      <Card>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <div className="eyebrow mb-2">Travel preferences</div>
            <div className="flex flex-wrap gap-2">
              <Chip tone="muted" icon={<VIcon size={12} />}>{p.vehicle.type === "none" ? "No vehicle" : statusLabel(p.vehicle.type)}</Chip>
              {p.vehicle.type !== "none" && <Chip tone="muted">{p.vehicle.seats} seats</Chip>}
              {p.vehicle.model && <Chip tone="muted">{p.vehicle.model}{p.vehicle.color ? ` · ${p.vehicle.color}` : ""}</Chip>}
              {p.preferred_travel_type && <Chip tone="teal">{statusLabel(p.preferred_travel_type)}</Chip>}
            </div>
          </div>
          {p.college_or_company && (
            <div>
              <div className="eyebrow mb-2">Affiliation</div>
              <Chip tone={p.verification.college ? "verified" : "muted"} icon={p.verification.college ? <CheckCircle2 size={12} /> : undefined}>
                {p.college_or_company}
              </Chip>
            </div>
          )}
        </div>
      </Card>

      {/* Reviews */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title text-lg">Reviews {reviews && `(${reviews.length})`}</h2>
        </div>
        {!reviews || reviews.length === 0 ? (
          <EmptyState icon={<Quote size={20} />} title="No reviews yet" sub="Reviews appear after completed shared trips." />
        ) : (
          <div className="grid gap-3">
            {reviews.map((rv) => (
              <Card key={rv.id}>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={rv.reviewer?.full_name} src={rv.reviewer?.photo_url} id={rv.reviewer_id} size={36} verified={rv.reviewer?.verification.identity} />
                    <div className="flex-1">
                      <div className="font-display font-600 text-ink">{rv.reviewer?.full_name || "Traveller"}</div>
                      <div className="flex items-center gap-2"><Stars rating={rv.rating} size={12} /><span className="text-[11px] text-ink-muted">{relativeTime(rv.created_at)}</span></div>
                    </div>
                  </div>
                  {rv.comment && <p className="mt-2.5 text-sm text-ink-soft">{rv.comment}</p>}
                  {rv.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">{rv.tags.map((t) => <Chip key={t} tone="teal">{t}</Chip>)}</div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
