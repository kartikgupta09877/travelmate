import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet, Route as RouteIcon, Leaf, Users, Star, TrendingUp,
  MapPin, Search, Sparkles, Plus, ArrowRight, Clock, CalendarCheck, ShieldCheck,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, Stat, SectionHeading, Loading, EmptyState, Chip, cx } from "@/components/ui";
import { RouteLine } from "@/components/RouteLine";
import { PartnerCard } from "@/components/PartnerCard";
import { Avatar } from "@/components/ui/Avatar";
import { inr, km, co2, time12, prettyDate, statusLabel } from "@/lib/format";

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard.get });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = user?.full_name?.split(" ")[0] || "traveller";

  if (isLoading) return <Loading label="Loading your dashboard…" />;
  if (isError) return <EmptyState icon={<MapPin size={22} />} title="Could not load your dashboard"
    sub={error instanceof ApiError ? error.message : "Please try again shortly."} />;
  const d = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-1">{greeting}</div>
          <h1 className="font-display font-800 text-2xl sm:text-3xl text-ink">{first} 👋</h1>
          <p className="mt-1 text-sm text-ink-muted">Here's your shared-travel snapshot.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" sm onClick={() => nav("/app/find")}><Search size={15} /> Find partners</Button>
          <Button sm onClick={() => nav("/app/local")}><Plus size={15} /> New journey</Button>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Saved this month" value={inr(d?.money_saved_month)} tone="teal"
          sub={`${inr(d?.money_saved_total)} all-time`} icon={<Wallet size={16} />} />
        <Stat label="Shared trips" value={d?.shared_trips_month ?? 0} tone="ink"
          sub={`${d?.monthly_trip_count ?? 0} this month`} icon={<CalendarCheck size={16} />} />
        <Stat label="Distance shared" value={km(d?.shared_distance_km)} tone="ink"
          sub="with partners" icon={<RouteIcon size={16} />} />
        <Stat label="CO₂ reduced" value={co2(d?.co2_reduced_kg)} tone="verified"
          sub="est. this month" icon={<Leaf size={16} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr,1fr]">
        {/* Upcoming trip */}
        <div>
          <SectionHeading title="Upcoming journey" eyebrow="Next up"
            action={<Link to="/app/trips" className="text-sm font-semibold text-teal hover:underline">All trips</Link>} />
          {d?.upcoming_trip ? (
            <Card className="card-hover">
              <Link to={`/app/trips/${d.upcoming_trip.id}`} className="block p-5">
                <div className="mb-3 flex items-center justify-between">
                  <Chip tone={d.upcoming_trip.section === "long" ? "signal" : "teal"}>
                    {d.upcoming_trip.section === "long" ? "Long trip" : "Local"}
                  </Chip>
                  <Chip tone="muted">{statusLabel(d.upcoming_trip.status)}</Chip>
                </div>
                <RouteLine from={d.upcoming_trip.origin.zone || d.upcoming_trip.origin.label}
                  to={d.upcoming_trip.destination.label}
                  checkpoint={d.upcoming_trip.meeting_point?.name} />
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-ink-soft">
                    <Clock size={15} className="text-teal" /> {time12(d.upcoming_trip.departure_time)}
                  </span>
                  {d.upcoming_trip.date && (
                    <span className="inline-flex items-center gap-1.5 text-ink-soft">
                      <CalendarCheck size={15} className="text-teal" /> {prettyDate(d.upcoming_trip.date)}
                    </span>
                  )}
                  <span className="font-mono font-700 text-teal tnum">{inr(d.upcoming_trip.cost_per_person)}/person</span>
                </div>
                {d.upcoming_trip.participants?.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                    <div className="flex -space-x-2">
                      {d.upcoming_trip.participants.slice(0, 4).map((p) => (
                        <Avatar key={p.id} name={p.full_name} src={p.photo_url} id={p.id} size={30}
                          verified={p.verification.identity} />
                      ))}
                    </div>
                    <span className="text-xs text-ink-muted">
                      {d.upcoming_trip.participants.length} traveller{d.upcoming_trip.participants.length === 1 ? "" : "s"}
                    </span>
                    <ArrowRight size={15} className="ml-auto text-ink-muted" />
                  </div>
                )}
              </Link>
            </Card>
          ) : (
            <EmptyState icon={<MapPin size={22} />} title="No upcoming journeys"
              sub="Create a journey or find a partner going your way to get started."
              action={<Button sm onClick={() => nav("/app/local")}><Plus size={15} /> Create a journey</Button>} />
          )}

          {/* Quick actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { to: "/app/local", label: "Local Travel", desc: "Daily commute", Icon: MapPin, tone: "teal" },
              { to: "/app/long", label: "Long Trip", desc: "Intercity & groups", Icon: RouteIcon, tone: "signal" },
              { to: "/app/find", label: "Find Partners", desc: "Search routes", Icon: Search, tone: "teal" },
              { to: "/app/assistant", label: "Match Assistant", desc: "Describe your trip", Icon: Sparkles, tone: "signal" },
            ].map((a) => (
              <Link key={a.to} to={a.to}
                className="card card-hover flex items-center gap-3 p-4">
                <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  a.tone === "signal" ? "bg-signal-wash text-signal" : "bg-teal-wash text-teal")}>
                  <a.Icon size={18} />
                </span>
                <div className="min-w-0">
                  <div className="font-display font-600 text-ink">{a.label}</div>
                  <div className="text-xs text-ink-muted">{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Next match + trust */}
        <div>
          <SectionHeading title="Your next best match" eyebrow="Suggested"
            action={<Link to="/app/find" className="text-sm font-semibold text-teal hover:underline">See all</Link>} />
          {d?.next_match ? (
            <PartnerCard r={d.next_match} onOpen={() => nav(`/app/find?journey=${d.next_match!.journey.id}`)} />
          ) : (
            <EmptyState icon={<Users size={22} />} title="No matches yet"
              sub="Add a journey and we'll surface compatible, verified partners here." />
          )}

          <Card className="mt-6">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-signal" fill="#F59E0B" />
                  <span className="font-display font-700 text-ink">{(d?.average_rating ?? 0).toFixed(1)} rating</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                  <Users size={15} /> {d?.travel_partners ?? 0} partners
                </span>
              </div>
              {user && !Object.values(user.verification).every(Boolean) && (
                <Link to="/app/verify"
                  className="mt-4 flex items-center gap-3 rounded-xl bg-teal-wash px-4 py-3 text-sm text-teal-dark hover:bg-teal-wash/70">
                  <ShieldCheck size={18} className="shrink-0" />
                  <span className="flex-1">Complete verification to boost your match quality and trust level.</span>
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
