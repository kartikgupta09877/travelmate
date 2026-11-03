import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Car, Bike, CalendarDays, CheckCircle2, XCircle, Pencil, Route as RouteIcon, Quote, MapPin, ShieldCheck,
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
    <div className="mx-auto max-w-4xl space-y-6 animate-fade">
      <Card className="overflow-hidden border border-slate-200/80 shadow-card">
        <div className="h-28 bg-gradient-to-r from-ocean-950 via-ocean-900 to-teal-dark" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <Avatar name={p.full_name} src={p.photo_url} id={p.id} size={88} verified={p.verification.identity} />
            {isSelf ? (
              <Link to="/app/settings"><Button variant="outline" sm><Pencil size={14} /> Edit profile</Button></Link>
            ) : (
              <div className="flex gap-2">
                <ReportButton userId={p.id} />
                <BlockButton userId={p.id} blocked={blocked} onChange={setBlocked} />
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-display font-800 text-2xl text-ocean-900 tracking-tight">{p.full_name}</h1>
            <TrustLevel level={p.trust_level} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <Stars rating={p.stats.rating} count={p.stats.ratings_count} />
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-teal" /> {p.city}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-500" /> Joined {prettyDate(p.stats.member_since)}</span>
          </div>
          {p.bio && <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-xl">{p.bio}</p>}
          <div className="mt-4"><VerificationBadges v={p.verification} /></div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Trips Completed" value={p.stats.completed_trips} icon={<RouteIcon size={18} />} />
        <Stat label="Member Rating" value={p.stats.rating.toFixed(1)} tone="signal" />
        <Stat label="Cancellation" value={`${Math.round(p.stats.cancellation_rate * 100)}%`} sub="of booked trips" />
        <Stat label="No-Show Rate" value={`${Math.round(p.stats.no_show_rate * 100)}%`} sub="of booked trips" />
      </div>

      <Card className="border border-slate-200/80 shadow-xs">
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <div className="eyebrow mb-3">Vehicle & Travel Mode</div>
            <div className="flex flex-wrap gap-2">
              <Chip tone="muted" icon={<VIcon size={13} />}>{p.vehicle.type === "none" ? "No vehicle" : statusLabel(p.vehicle.type)}</Chip>
              {p.vehicle.type !== "none" && <Chip tone="muted">{p.vehicle.seats} seats available</Chip>}
              {p.vehicle.model && <Chip tone="muted">{p.vehicle.model}{p.vehicle.color ? ` · ${p.vehicle.color}` : ""}</Chip>}
              {p.preferred_travel_type && <Chip tone="teal">{statusLabel(p.preferred_travel_type)}</Chip>}
            </div>
          </div>
          {p.college_or_company && (
            <div>
              <div className="eyebrow mb-3">Verified Affiliation</div>
              <Chip tone={p.verification.college ? "verified" : "muted"} icon={p.verification.college ? <CheckCircle2 size={13} /> : undefined}>
                {p.college_or_company}
              </Chip>
            </div>
          )}
        </div>
      </Card>

      {/* Reviews Section */}
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-3">
          <h2 className="section-title text-xl">Member Reviews {reviews && `(${reviews.length})`}</h2>
        </div>
        {!reviews || reviews.length === 0 ? (
          <EmptyState icon={<Quote size={24} />} title="No reviews yet" sub="Verified reviews appear automatically after completing shared rides." />
        ) : (
          <div className="grid gap-4">
            {reviews.map((rv) => (
              <Card key={rv.id} className="border border-slate-200/80 shadow-xs">
                <div className="p-5">
                  <div className="flex items-center gap-3.5">
                    <Avatar name={rv.reviewer?.full_name} src={rv.reviewer?.photo_url} id={rv.reviewer_id} size={40} verified={rv.reviewer?.verification.identity} />
                    <div className="flex-1">
                      <div className="font-display font-700 text-ocean-900 text-sm">{rv.reviewer?.full_name || "Traveller"}</div>
                      <div className="flex items-center gap-2 mt-0.5"><Stars rating={rv.rating} size={12} /><span className="text-[11px] font-semibold text-slate-500">{relativeTime(rv.created_at)}</span></div>
                    </div>
                  </div>
                  {rv.comment && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{rv.comment}</p>}
                  {rv.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">{rv.tags.map((t) => <Chip key={t} tone="teal">{t}</Chip>)}</div>
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
