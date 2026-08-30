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
  pending: [{ next: "confirmed", label: "Confirm trip", Icon: CheckCircle2 }],
  requested: [{ next: "confirmed", label: "Confirm trip", Icon: CheckCircle2 }],
  accepted: [{ next: "confirmed", label: "Confirm trip", Icon: CheckCircle2 }],
  confirmed: [{ next: "in_progress", label: "Start trip", Icon: PlayCircle }],
  in_progress: [{ next: "completed", label: "Complete trip", Icon: CheckCircle2 }],
};

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)} className="p-0.5">
          <Star size={28} className={cx((hover || value) >= n ? "text-signal" : "text-ink/20")}
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

  if (isLoading) return <Loading label="Loading trip…" />;
  if (isError) return <div className="py-16 text-center text-ink-muted">{error instanceof ApiError ? error.message : "Could not load this trip."}</div>;
  if (!t) return <div className="py-16 text-center text-ink-muted">Trip not found. <Link to="/app/trips" className="text-teal">Back to trips</Link></div>;

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
      toast.push(`Trip ${statusLabel(s).toLowerCase()}.`, s === "cancelled" ? "info" : "success");
      qc.invalidateQueries({ queryKey: ["trip", id] });
      qc.invalidateQueries({ queryKey: ["trips"] });
    } catch { toast.push("Could not update the trip.", "error"); }
    finally { setBusy(false); }
  };

  const submitReview = async () => {
    if (!rateFor) return;
    setBusy(true);
    try {
      await api.reviews.create({ trip_id: t.id, reviewee_id: rateFor, rating, comment: comment || undefined, tags });
      toast.push("Thanks for your review!", "success");
      setRateFor(null); setComment(""); setTags([]); setRating(5);
    } catch { toast.push("Could not submit review.", "error"); }
    finally { setBusy(false); }
  };

  const actions = FLOW[t.status] || [];
  const terminal = t.status === "completed" || t.status === "cancelled";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => nav("/app/trips")} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> All trips
        </button>
        <Chip tone={t.status === "completed" ? "verified" : t.status === "cancelled" ? "danger" : t.status === "in_progress" ? "signal" : "teal"}>
          {statusLabel(t.status)}
        </Chip>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <div className="space-y-6">
          <Card>
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Chip tone={t.section === "long" ? "signal" : "teal"}>{t.section === "long" ? "Long trip" : "Local"}</Chip>
                <span className="text-sm text-ink-muted">{t.date ? prettyDate(t.date) : ""}</span>
              </div>
              <RouteLine from={t.origin.zone || t.origin.label} to={t.destination.label} checkpoint={mp?.name} />
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-canvas p-3">
                  <Clock size={16} className="mx-auto text-teal" />
                  <div className="mt-1 font-display font-700 text-ink">{time12(t.departure_time)}</div>
                  <div className="text-[11px] text-ink-muted">Departure</div>
                </div>
                <div className="rounded-xl bg-canvas p-3">
                  <RouteIcon size={16} className="mx-auto text-teal" />
                  <div className="mt-1 font-display font-700 text-ink">{km(t.distance_km)}</div>
                  <div className="text-[11px] text-ink-muted">{minutes(t.duration_min)}</div>
                </div>
                <div className="rounded-xl bg-canvas p-3">
                  <Wallet size={16} className="mx-auto text-teal" />
                  <div className="mt-1 font-display font-700 text-teal">{inr(t.cost_per_person)}</div>
                  <div className="text-[11px] text-ink-muted">Per person</div>
                </div>
              </div>
            </div>
          </Card>

          <Card><div className="p-2"><MapView markers={markers} routes={routes} height={280} zoom={12} /></div></Card>

          {mp && (
            <Card>
              <div className="p-5">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-signal" /><span className="font-display font-700 text-ink">Meeting point</span></div>
                <div className="mt-2 font-display font-600 text-ink">{mp.name}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
                  <span>You: {km(mp.distance_from_requester_km)}</span>
                  <span>Partner: {km(mp.distance_from_host_km)}</span>
                  {mp.eta && <span>Meet ≈ {time12(mp.eta)}</span>}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-verified"><ShieldCheck size={13} /> Safe public checkpoint · exact spot shared only between confirmed travellers</div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2"><Users size={16} className="text-teal" /><span className="font-display font-700 text-ink">Travellers ({t.participants.length})</span></div>
              <div className="space-y-3">
                {t.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <Avatar name={p.full_name} src={p.photo_url} id={p.id} size={40} verified={p.verification.identity} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/app/profile/${p.id}`} className="font-display font-600 text-ink hover:underline">
                        {p.full_name}{p.id === user?.id && <span className="ml-1 text-xs text-ink-muted">(you)</span>}
                        {p.id === t.host_id && <span className="ml-1 text-[11px] text-teal">· host</span>}
                      </Link>
                      <Stars rating={p.stats.rating} count={p.stats.ratings_count} size={12} />
                    </div>
                    {t.status === "completed" && p.id !== user?.id && (
                      <Button variant="outline" sm onClick={() => setRateFor(p.id)}><Star size={13} /> Rate</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2"><Wallet size={16} className="text-teal" /><span className="font-display font-700 text-ink">Cost split</span></div>
              {costError ? (
                <p className="text-sm text-ink-muted">The latest split could not be loaded. The trip estimate is shown above.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-canvas p-3"><div className="text-xs text-ink-muted">Journey cost</div><div className="mt-1 font-mono font-700 text-ink tnum">{inr(cost?.solo_travel_cost ?? t.solo_travel_cost)}</div></div>
                  <div className="rounded-xl bg-canvas p-3"><div className="text-xs text-ink-muted">Shared cost</div><div className="mt-1 font-mono font-700 text-ink tnum">{inr(cost?.shared_travel_cost ?? t.shared_travel_cost)}</div></div>
                  <div className="rounded-xl bg-teal-wash p-3"><div className="text-xs text-teal-dark">Your share</div><div className="mt-1 font-mono font-700 text-teal tnum">{inr(cost?.per_person_cost ?? t.per_person_cost)}</div></div>
                  <div className="rounded-xl bg-verified-wash p-3"><div className="text-xs text-verified">You save</div><div className="mt-1 font-mono font-700 text-verified tnum">{inr(cost?.estimated_savings ?? t.estimated_savings)}</div></div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <div className="space-y-2.5 p-5">
              {t.conversation_id && (
                <Button className="w-full" onClick={() => nav(`/app/messages/${t.conversation_id}`)}>
                  <MessageSquare size={16} /> Open chat
                </Button>
              )}
              {actions.map((a) => (
                <Button key={a.next} variant="outline" className="w-full" loading={busy} onClick={() => setStatus(a.next)}>
                  <a.Icon size={16} /> {a.label}
                </Button>
              ))}
              {!terminal && (
                <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50" onClick={() => setStatus("cancelled")}>
                  <XCircle size={16} /> Cancel trip
                </Button>
              )}
            </div>
          </Card>

          {/* Safety */}
          <Card>
            <div className="space-y-2.5 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink"><ShieldCheck size={15} className="text-teal" /> Safety</div>
              <SosButton tripId={t.id} block />
              <ShareTripButton tripId={t.id} block />
              {others[0] && <ReportButton userId={others[0].id} tripId={t.id} block label={`Report ${others[0].full_name.split(" ")[0]}`} />}
              <p className="text-[11px] leading-relaxed text-ink-muted">SOS alerts your trusted contacts and logs the incident. It does not contact or replace emergency services — call them directly in a real emergency.</p>
            </div>
          </Card>

          {t.status === "completed" && (
            <div className="flex items-center justify-center gap-1.5 rounded-xl bg-verified-wash px-4 py-3 text-sm text-verified">
              <Leaf size={15} /> Nice — this shared trip saved ≈ {(t.distance_km * 0.12).toFixed(1)} kg CO₂.
            </div>
          )}
        </div>
      </div>

      {/* Rating modal */}
      <Modal open={!!rateFor} onClose={() => setRateFor(null)} title="Rate your travel partner" size="sm"
        footer={<><Button variant="ghost" onClick={() => setRateFor(null)}>Cancel</Button><Button loading={busy} onClick={submitReview}>Submit review</Button></>}>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <StarInput value={rating} onChange={setRating} />
            <span className="text-sm text-ink-muted">{["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tg) => (
              <button key={tg} type="button" onClick={() => setTags((s) => s.includes(tg) ? s.filter((x) => x !== tg) : [...s, tg])}
                className={cx("chip cursor-pointer", tags.includes(tg) ? "bg-teal text-white" : "bg-ink/5 text-ink-muted")}>{tg}</button>
            ))}
          </div>
          <Textarea placeholder="Share a few words about the journey (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
