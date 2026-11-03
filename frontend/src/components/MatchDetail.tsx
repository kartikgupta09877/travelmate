import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MessageSquare, Send, ShieldCheck, MapPin, Info, ArrowUpRight } from "lucide-react";
import type { Checkpoint, GeoPoint, PartnerResult } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { MapView } from "@/components/map";
import type { MapMarker, MapRoute } from "@/components/map";
import { CheckpointPicker } from "./CheckpointPicker";
import { MatchScore, MatchBar } from "./MatchScore";
import { VerificationBadges, Stars, TrustLevel } from "./VerificationBadges";
import { Avatar } from "./ui/Avatar";
import { Button, Chip, Textarea, cx } from "./ui";
import { useToast } from "./ui/Toast";
import { inr, time12, km } from "@/lib/format";

export function MatchDetail({ result, requesterOrigin, requesterDestination, departureTime, onRequested }:
  {
    result: PartnerResult; requesterOrigin?: GeoPoint | null; requesterDestination?: GeoPoint | null;
    departureTime?: string; onRequested?: () => void;
  }) {
  const toast = useToast();
  const p = result.partner;
  const j = result.journey;

  const checkpoints = useMemo(() => {
    const seen = new Set<string>();
    const list: Checkpoint[] = [];
    for (const c of [result.suggested_checkpoint, ...(result.alternative_checkpoints || [])]) {
      if (c && !seen.has(c.id)) { seen.add(c.id); list.push(c); }
    }
    return list;
  }, [result]);

  const [selected, setSelected] = useState<Checkpoint | null>(result.suggested_checkpoint || checkpoints[0] || null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const dest = requesterDestination || j.destination;
  const markers: MapMarker[] = [];
  if (requesterOrigin) markers.push({ lat: requesterOrigin.lat, lng: requesterOrigin.lng, label: "Your area", kind: "origin", approximate: true, radiusKm: 0.9 });
  markers.push({ lat: j.origin.lat, lng: j.origin.lng, label: `${p.full_name.split(" ")[0]}'s area`, kind: "partner", approximate: true, radiusKm: 0.9 });
  if (selected) markers.push({ lat: selected.lat, lng: selected.lng, label: selected.name, kind: "checkpoint" });
  markers.push({ lat: dest.lat, lng: dest.lng, label: dest.label, kind: "destination" });

  const routes: MapRoute[] = [];
  if (selected) {
    if (requesterOrigin) routes.push({ points: [[requesterOrigin.lat, requesterOrigin.lng], [selected.lat, selected.lng]], tone: "muted" });
    routes.push({ points: [[j.origin.lat, j.origin.lng], [selected.lat, selected.lng]], tone: "muted" });
    routes.push({ points: [[selected.lat, selected.lng], [dest.lat, dest.lng]], tone: "teal" });
  } else {
    routes.push({ points: [[j.origin.lat, j.origin.lng], [dest.lat, dest.lng]], tone: "teal" });
  }

  const bd = result.breakdown;

  const requestJoin = async () => {
    setSending(true);
    try {
      await api.matching.requestJoin({
        journey_id: j.id, message: message || undefined,
        origin: requesterOrigin || undefined, destination: requesterDestination || undefined,
        departure_time: departureTime || undefined,
      });
      setDone(true);
      toast.push(`Request sent to ${p.full_name.split(" ")[0]}. You'll be notified when they respond.`, "success");
      onRequested?.();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not send the request.";
      toast.push(msg, "error");
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      {/* Partner header */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-start gap-4 min-w-0">
          <Avatar name={p.full_name} src={p.photo_url} id={p.id} size={60} verified={p.verification.identity} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display font-800 text-xl text-ocean-900">{p.full_name}</h3>
              <Link to={`/app/profile/${p.id}`} className="inline-flex items-center gap-0.5 text-xs font-bold text-teal-dark hover:underline">
                View profile <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="mt-1"><Stars rating={p.stats.rating} count={p.stats.ratings_count} /></div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <TrustLevel level={p.trust_level} />
              <span className="text-xs font-semibold text-slate-600">{p.stats.completed_trips} trips · {Math.round(p.stats.cancellation_rate * 100)}% cancel rate</span>
            </div>
          </div>
        </div>
        <MatchScore score={result.score} size={82} />
      </div>

      <VerificationBadges v={p.verification} />

      {/* Map view */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs">
        <MapView markers={markers} routes={routes} height={280} zoom={12} />
        <div className="bg-slate-50 p-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600 border-t border-slate-200/60">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-teal inline-block" /> Your area</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: "#6366F1" }} /> Partner area</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rotate-45 bg-amber-500 inline-block" /> Checkpoint</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Destination</span>
          <span className="ml-auto inline-flex items-center gap-1 text-slate-600"><ShieldCheck size={13} /> Approximate locations</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="eyebrow">Match Score Breakdown</span>
          <span className="text-xs font-bold text-slate-600">{result.route_overlap_pct}% route overlap · {result.departure_diff_min}m time diff</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MatchBar label="Route similarity (40%)" value={bd.route} />
          <MatchBar label="Time compatibility (25%)" value={bd.time} />
          <MatchBar label="Destination match (15%)" value={bd.destination} />
          <MatchBar label="Checkpoint distance (10%)" value={bd.checkpoint} />
          <MatchBar label="Reliability & rating (10%)" value={bd.reliability} />
        </div>
        {result.reasons?.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 grid gap-1 sm:grid-cols-2">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Checkpoint selection */}
      {checkpoints.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="mb-2 flex items-center gap-2">
            <MapPin size={18} className="text-amber-500" />
            <span className="font-display font-700 text-ocean-900">Meeting Checkpoint</span>
          </div>
          <p className="mb-3 text-xs font-semibold text-slate-600">Explore safe public options here. The host confirms the final meeting spot upon acceptance.</p>
          <CheckpointPicker options={checkpoints} selectedId={selected?.id} onSelect={setSelected} />
        </div>
      )}

      {/* Request box */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Estimated Fare Share</div>
            <div className="font-mono font-800 text-3xl text-teal-dark tnum">{inr(result.estimated_share)}</div>
          </div>
          <div className="text-right text-xs font-semibold text-slate-600">
            <div>Departs {time12(j.departure_time)}</div>
            <div>{km(j.distance_km)} · {j.available_seats} seat{j.available_seats === 1 ? "" : "s"} remaining</div>
          </div>
        </div>

        {done ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-emerald-700 animate-fade">
            <CheckCircle2 size={20} /> Request sent successfully! You can track status under Matches.
          </div>
        ) : (
          <>
            <Textarea className="mt-4" placeholder={`Hi ${p.full_name.split(" ")[0]}, I'm travelling on the same route — open to sharing the journey?`}
              value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                <Info size={14} /> Shared cost estimation based on distance
              </div>
              <Button loading={sending} onClick={requestJoin} lg><Send size={16} /> Send Join Request</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
