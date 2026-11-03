import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Clock, CalendarCheck, MapPin, MessageSquare, Users, Wallet,
  Star, CheckCircle2, PlayCircle, XCircle, ShieldCheck, Leaf, Route as RouteIcon,
} from "lucide-react";
import type { Trip, TripStatus } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MapView } from "@/components/map";
import type { MapMarker, MapRoute } from "@/components/map";
import { RouteLine } from "@/components/RouteLine";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadges, Stars } from "@/components/VerificationBadges";
import { SosButton, ShareTripButton, ReportButton } from "@/components/SafetyActions";
import { Modal } from "@/components/ui/Modal";
import { Button, Card, Chip, Loading, Textarea, SectionHeading, cx } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { inr, km, minutes, time12, prettyDate, statusLabel } from "@/lib/format";

const FLOW: Record<string, { next: TripStatus; label: string; Icon: typeof PlayCircle }[]> = {
  pending: [{ next: "confirmed", label: "Confirm Trip", Icon: CheckCircle2 }],
  requested: [{ next: "confirmed", label: "Confirm Trip", Icon: CheckCircle2 }],
  accepted: [{ next: "confirmed", label: "Confirm Trip", Icon: CheckCircle2 }],
  confirmed: [{ next: "in_progress", label: "Start Trip", Icon: PlayCircle }],
  in_progress: [{ next: "completed", label: "Complete Trip", Icon: CheckCircle2 }],
};

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)} className="p-1 cursor-pointer">
          <Star size={30} className={cx((hover || value) >= n ? "text-amber-500" : "text-slate-200")}
            fill={(hover || value) >= n ? "#F59E0B" : "none"} />
        </button>
      ))}
    </div>
  );
}

const REVIEW_TAGS = ["Punctual", "Friendly", "Safe driver", "Clean vehicle", "Good communication", "Fair split"];

export default function TripDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: t, isLoading, isError, error } = useQuery({ queryKey: ["trip", id], queryFn: () => api.trips.get(id) });
  const { data: cost, isError: costError } = useQuery({
    queryKey: ["trip-cost", id], queryFn: () => api.trips.cost(id), enabled: Boolean(id),
  });

  const [rateFor, setRateFor] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <Loading label="Loading trip detail…" />;
  if (isError) return <div className="py-20 text-center text-slate-500">{error instanceof ApiError ? error.message : "Could not load this trip."}</div>;
  if (!t) return <div className="py-20 text-center text-slate-500">Trip not found. <Link to="/app/trips" className="text-teal-dark font-bold hover:underline">Back to trips</Link></div>;

  const others = t.participants.filter((p) => p.id !== user?.id);
  const mp = t.meeting_point;

  const markers: MapMarker[] = [
    { lat: t.origin.lat, lng: t.origin.lng, label: "Start area", kind: "origin", approximate: true, radiusKm: 0.9 },
    ...(mp ? [{ lat: mp.lat, lng: mp.lng, label: mp.name, kind: "checkpoint" as const }] : []),
    { lat: t.destination.lat, lng: t.destination.lng, label: t.destination.label, kind: "destination" },
  ];
  const routes: MapRoute[] = mp
    ? [{ points: [[t.origin.lat, t.origin.lng], [mp.lat, mp.lng]], tone: "muted" }, { points: [[mp.lat, mp.lng], [t.destination.lat, t.destination.lng]], tone: "teal" }]
    : [{ points: [[t.origin.lat, t.origin.lng], [t.destination.lat, t.destination.lng]], tone: "teal" }];

  const setStatus = async (s: TripStatus) => {
    setBusy(true);
    try {
      await api.trips.setStatus(t.id, s);
      toast.push(`Trip status updated to ${statusLabel(s).toLowerCase()}.`, s === "cancelled" ? "info" : "success");
      qc.invalidateQueries({ queryKey: ["trip", id] });
      qc.invalidateQueries({ queryKey: ["trips"] });
    } catch { toast.push("Could not update the trip status.", "error"); }
    finally { setBusy(false); }
  };

  const submitReview = async () => {
    if (!rateFor) return;
    setBusy(true);
    try {
      await api.reviews.create({ trip_id: t.id, reviewee_id: rateFor, rating, comment: comment || undefined, tags });
      toast.push("Thank you for your feedback!", "success");
      setRateFor(null); setComment(""); setTags([]); setRating(5);
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Could not submit review.", "error");
    }
    finally { setBusy(false); }
  };

  const actions = FLOW[t.status] || [];
  const terminal = t.status === "completed" || t.status === "cancelled";

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade">
      <div className="flex items-center justify-between">
        <button onClick={() => nav("/app/trips")} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ocean-900 transition-colors">
          <ArrowLeft size={16} /> All Trips
        </button>
        <Chip tone={t.status === "completed" ? "verified" : t.status === "cancelled" ? "danger" : t.status === "in_progress" ? "signal" : "teal"}>
          {statusLabel(t.status)}
        </Chip>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-slate-200/80 shadow-card">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <Chip tone={t.section === "long" ? "coral" : "teal"}>{t.section === "long" ? "Intercity Trip" : "Local Commute"}</Chip>
                <span className="text-xs font-bold text-slate-600">{t.date ? prettyDate(t.date) : ""}</span>
              </div>
              <RouteLine from={t.origin.zone || t.origin.label} to={t.destination.label} checkpoint={mp?.name} />
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/60">
                  <Clock size={18} className="mx-auto text-teal" />
                  <div className="mt-1.5 font-display font-800 text-ocean-900 text-sm">{time12(t.departure_time)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Departure</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/60">
                  <RouteIcon size={18} className="mx-auto text-teal" />
                  <div className="mt-1.5 font-display font-800 text-ocean-900 text-sm">{km(t.distance_km)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{minutes(t.duration_min)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/60">
                  <Wallet size={18} className="mx-auto text-teal-dark" />
                  <div className="mt-1.5 font-display font-800 text-teal-dark text-sm">{inr(t.cost_per_person)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Per Person</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200/80 shadow-card overflow-hidden">
            <MapView markers={markers} routes={routes} height={300} zoom={12} />
          </Card>

          {mp && (
            <Card className="border border-slate-200/80 shadow-xs">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2"><MapPin size={18} className="text-amber-500" /><span className="font-display font-700 text-ocean-900 text-base">Meeting Checkpoint</span></div>
                <div className="font-display font-700 text-lg text-ocean-900">{mp.name}</div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-slate-600">
                  <span>You: {km(mp.distance_from_requester_km)}</span>
                  <span>Partner: {km(mp.distance_from_host_km)}</span>
                  {mp.eta && <span>ETA ≈ {time12(mp.eta)}</span>}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><ShieldCheck size={14} /> Safe public meeting point</div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Participants */}
          <Card className="border border-slate-200/80 shadow-card">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2"><Users size={18} className="text-teal" /><span className="font-display font-700 text-ocean-900 text-base">Travellers ({t.participants.length})</span></div>
              <div className="space-y-4">
                {t.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3.5">
                    <Avatar name={p.full_name} src={p.photo_url} id={p.id} size={42} verified={p.verification.identity} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/app/profile/${p.id}`} className="font-display font-700 text-ocean-900 hover:underline">
                        {p.full_name}{p.id === user?.id && <span className="ml-1 text-xs text-slate-600 font-semibold">(you)</span>}
                        {p.id === t.host_id && <span className="ml-1 text-[11px] font-bold text-teal-dark">· Host</span>}
                      </Link>
                      <div className="mt-0.5"><Stars rating={p.stats.rating} count={p.stats.ratings_count} size={12} /></div>
                    </div>
                    {t.status === "completed" && p.id !== user?.id && (
                      <Button variant="outline" sm onClick={() => setRateFor(p.id)}><Star size={13} /> Rate</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Cost Split details */}
          <Card className="border border-slate-200/80 shadow-xs">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2"><Wallet size={18} className="text-teal" /><span className="font-display font-700 text-ocean-900 text-base">Cost Split Breakdown</span></div>
              {costError ? (
                <p className="text-xs text-slate-600 font-medium">Live cost breakdown unavailable. Estimated fare is shown above.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/60"><div className="text-slate-600 font-bold">Total Route Cost</div><div className="mt-1 font-mono font-bold text-ocean-900 text-sm tnum">{inr(cost?.solo_travel_cost ?? t.solo_travel_cost)}</div></div>
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/60"><div className="text-slate-600 font-bold">Shared Route Cost</div><div className="mt-1 font-mono font-bold text-ocean-900 text-sm tnum">{inr(cost?.shared_travel_cost ?? t.shared_travel_cost)}</div></div>
                  <div className="rounded-2xl bg-teal-wash p-3 border border-teal/20"><div className="text-teal-dark font-bold">Your Share</div><div className="mt-1 font-mono font-extrabold text-teal-dark text-base tnum">{inr(cost?.per_person_cost ?? t.per_person_cost)}</div></div>
                  <div className="rounded-2xl bg-emerald-50 p-3 border border-emerald-200"><div className="text-emerald-700 font-bold">You Save</div><div className="mt-1 font-mono font-extrabold text-emerald-700 text-base tnum">{inr(cost?.estimated_savings ?? t.estimated_savings)}</div></div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="border border-slate-200/80 shadow-card">
            <div className="space-y-3 p-6">
              {t.conversation_id && (
                <Button lg className="w-full" onClick={() => nav(`/app/messages/${t.conversation_id}`)}>
                  <MessageSquare size={18} /> Open Trip Chat
                </Button>
              )}
              {actions.map((a) => (
                <Button key={a.next} variant="outline" lg className="w-full" loading={busy} onClick={() => setStatus(a.next)}>
                  <a.Icon size={18} /> {a.label}
                </Button>
              ))}
              {!terminal && (
                <Button variant="ghost" className="w-full text-rose-600 hover:bg-rose-50 font-bold" onClick={() => setStatus("cancelled")}>
                  <XCircle size={18} /> Cancel Trip
                </Button>
              )}
            </div>
          </Card>

          {/* Safety Center triggers */}
          <Card className="border border-slate-200/80 shadow-xs">
            <div className="space-y-3 p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-ocean-900"><ShieldCheck size={16} className="text-teal" /> Trip Safety</div>
              <SosButton tripId={t.id} block />
              <ShareTripButton tripId={t.id} block />
              {others[0] && <ReportButton userId={others[0].id} tripId={t.id} block label={`Report ${others[0].full_name.split(" ")[0]}`} />}
              <p className="text-[11px] leading-relaxed text-slate-600 font-medium">SOS notifies your emergency contacts with real-time location. In urgent scenarios, dial local emergency services directly.</p>
            </div>
          </Card>

          {t.status === "completed" && (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700">
              <Leaf size={16} /> Shared trip complete! Saved ≈ {(t.distance_km * 0.12).toFixed(1)} kg CO₂ emissions.
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Modal open={!!rateFor} onClose={() => setRateFor(null)} title="Rate your travel partner" size="sm"
        footer={<><Button variant="ghost" onClick={() => setRateFor(null)}>Cancel</Button><Button loading={busy} onClick={submitReview}>Submit Review</Button></>}>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <StarInput value={rating} onChange={setRating} />
            <span className="text-xs font-bold text-slate-500">{["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tg) => (
              <button key={tg} type="button" onClick={() => setTags((s) => s.includes(tg) ? s.filter((x) => x !== tg) : [...s, tg])}
                className={cx("chip cursor-pointer select-none", tags.includes(tg) ? "bg-teal text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{tg}</button>
            ))}
          </div>
          <Textarea placeholder="Write a brief comment about the experience (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
