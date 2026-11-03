import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet, Route as RouteIcon, Leaf, Users, Star, TrendingUp,
  MapPin, Search, Sparkles, Plus, ArrowRight, Clock, CalendarCheck, ShieldCheck, Zap, ChevronRight,
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
    <div className="space-y-8 animate-fade">
      {/* Top Banner Header - High Contrast Light Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 text-ocean-900 shadow-sm border border-slate-200/90">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal-wash/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-orange-50/60 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-wash px-3.5 py-1 text-xs font-extrabold text-teal-dark border border-teal/20 mb-3 shadow-2xs">
              <Zap size={14} className="text-amber-500 fill-amber-500" /> {greeting}, {first} 👋
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-ocean-900 leading-tight">
              Ready for your next shared journey?
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600 leading-relaxed">
              Here are your active route matches and shared travel impact snapshot.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => nav("/app/find")}
              className="flex items-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm font-bold text-ocean-900 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-all cursor-pointer"
            >
              <Search size={16} className="text-teal-dark" /> Find partners
            </button>
            <button
              onClick={() => nav("/app/local")}
              className="flex items-center gap-2 rounded-xl bg-coral-warm hover:bg-coral text-white font-extrabold px-5 py-2.5 text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} /> Create journey
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Saved this month" value={inr(d?.money_saved_month)} tone="teal"
          sub={`${inr(d?.money_saved_total)} total saved`} icon={<Wallet size={18} />} />
        <Stat label="Shared trips" value={d?.shared_trips_month ?? 0} tone="ink"
          sub={`${d?.monthly_trip_count ?? 0} trips this month`} icon={<CalendarCheck size={18} />} />
        <Stat label="Distance shared" value={km(d?.shared_distance_km)} tone="ink"
          sub="with verified partners" icon={<RouteIcon size={18} />} />
        <Stat label="CO₂ reduced" value={co2(d?.co2_reduced_kg)} tone="verified"
          sub="estimated emissions saved" icon={<Leaf size={18} />} />
      </div>

      {/* Main content grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Upcoming Trip & Quick Actions */}
        <div className="lg:col-span-7 space-y-6">
          <SectionHeading title="Upcoming Journey" eyebrow="Next Trip"
            action={<Link to="/app/trips" className="inline-flex items-center gap-1 text-xs font-bold text-teal-dark hover:underline">All journeys <ChevronRight size={14} /></Link>} />

          {d?.upcoming_trip ? (
            <Card className="card-hover overflow-hidden border border-slate-200/80 shadow-card">
              <Link to={`/app/trips/${d.upcoming_trip.id}`} className="block p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Chip tone={d.upcoming_trip.section === "long" ? "coral" : "teal"}>
                    {d.upcoming_trip.section === "long" ? "Intercity Trip" : "Local Commute"}
                  </Chip>
                  <Chip tone="muted">{statusLabel(d.upcoming_trip.status)}</Chip>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/60 my-2">
                  <RouteLine from={d.upcoming_trip.origin.zone || d.upcoming_trip.origin.label}
                    to={d.upcoming_trip.destination.label}
                    checkpoint={d.upcoming_trip.meeting_point?.name} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1.5 text-ocean-900 font-bold">
                    <Clock size={15} className="text-teal-dark" /> {time12(d.upcoming_trip.departure_time)}
                  </span>
                  {d.upcoming_trip.date && (
                    <span className="inline-flex items-center gap-1.5 text-ocean-900 font-bold">
                      <CalendarCheck size={15} className="text-teal-dark" /> {prettyDate(d.upcoming_trip.date)}
                    </span>
                  )}
                  <span className="font-mono font-extrabold text-teal-dark text-sm ml-auto tnum">
                    {inr(d.upcoming_trip.cost_per_person)} / person
                  </span>
                </div>

                {d.upcoming_trip.participants?.length > 0 && (
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {d.upcoming_trip.participants.slice(0, 4).map((p) => (
                          <Avatar key={p.id} name={p.full_name} src={p.photo_url} id={p.id} size={32}
                            verified={p.verification.identity} />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {d.upcoming_trip.participants.length} traveller{d.upcoming_trip.participants.length === 1 ? "" : "s"} joining
                      </span>
                    </div>
                    <span className="text-xs font-bold text-teal-dark flex items-center gap-1">Details <ArrowRight size={14} /></span>
                  </div>
                )}
              </Link>
            </Card>
          ) : (
            <EmptyState icon={<MapPin size={24} />} title="No upcoming journeys scheduled"
              sub="Create a journey route or search for a partner going your direction."
              action={<Button sm onClick={() => nav("/app/local")}><Plus size={15} /> Create a journey</Button>} />
          )}

          {/* Quick Shortcuts */}
          <div>
            <div className="eyebrow mb-3">Quick Navigation</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: "/app/local", label: "Local", desc: "Commute", Icon: MapPin, tone: "teal" },
                { to: "/app/long", label: "Intercity", desc: "Long trips", Icon: RouteIcon, tone: "coral" },
                { to: "/app/find", label: "Search", desc: "Find partners", Icon: Search, tone: "teal" },
                { to: "/app/assistant", label: "Match AI", desc: "Smart assistant", Icon: Sparkles, tone: "coral" },
              ].map((a) => (
                <Link key={a.to} to={a.to}
                  className="card card-hover flex flex-col justify-between p-4 border border-slate-200/80">
                  <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl mb-3",
                    a.tone === "coral" ? "bg-coral-wash text-coral-warm border border-coral-warm/20" : "bg-teal-wash text-teal-dark border border-teal/20")}>
                    <a.Icon size={20} />
                  </span>
                  <div>
                    <div className="font-display font-extrabold text-ocean-900 text-sm">{a.label}</div>
                    <div className="text-[11px] font-bold text-slate-600">{a.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Top Match Candidate & Rating Card */}
        <div className="lg:col-span-5 space-y-6">
          <SectionHeading title="Top Match Candidate" eyebrow="Suggested"
            action={<Link to="/app/find" className="inline-flex items-center gap-1 text-xs font-bold text-teal-dark hover:underline">See all <ChevronRight size={14} /></Link>} />

          {d?.next_match ? (
            <PartnerCard r={d.next_match} onOpen={() => nav(`/app/find?journey=${d.next_match!.journey.id}`)} />
          ) : (
            <EmptyState icon={<Users size={24} />} title="No pending match suggestions"
              sub="Publish a journey route to start receiving compatibility match recommendations." />
          )}

          {/* Trust & Rating summary */}
          <Card className="border border-slate-200/80 shadow-xs">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-amber-500" fill="#F59E0B" />
                  <span className="font-display font-extrabold text-ocean-900 text-base">{(d?.average_rating ?? 0).toFixed(1)} Member Rating</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Users size={15} /> {d?.travel_partners ?? 0} partners met
                </span>
              </div>

              {user && !Object.values(user.verification).every(Boolean) && (
                <Link to="/app/verify"
                  className="mt-4 flex items-center gap-3 rounded-2xl bg-teal-wash p-3.5 text-xs font-bold text-teal-dark hover:bg-teal-wash/90 transition-colors border border-teal/30">
                  <ShieldCheck size={20} className="shrink-0 text-teal-dark" />
                  <span className="flex-1">Complete your identity verification to unlock 100% trust match score boost.</span>
                  <ArrowRight size={15} className="shrink-0" />
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
