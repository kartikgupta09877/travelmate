import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MessageSquare, Send, ShieldCheck, MapPin, Info } from "lucide-react";
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
      if (selected) {
        // best-effort checkpoint preference; ignored if not applicable yet
      }
      setDone(true);
      toast.push(`Request sent to ${p.full_name.split(" ")[0]}. You'll be notified when they respond.`, "success");
      onRequested?.();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not send the request.";
      toast.push(msg, "error");
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-5">
      {/* Partner header */}
      <div className="flex items-start gap-4">
        <Avatar name={p.full_name} src={p.photo_url} id={p.id} size={56} verified={p.verification.identity} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display font-800 text-lg text-ink">{p.full_name}</h3>
            <Link to={`/app/profile/${p.id}`} className="text-xs font-semibold text-teal hover:underline">View profile</Link>
          </div>
          <div className="mt-0.5"><Stars rating={p.stats.rating} count={p.stats.ratings_count} /></div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TrustLevel level={p.trust_level} />
            <span className="text-xs text-ink-muted">{p.stats.completed_trips} trips · {Math.round(p.stats.cancellation_rate * 100)}% cancel rate</span>
          </div>
        </div>
        <MatchScore score={result.score} size={78} />
      </div>

      <VerificationBadges v={p.verification} />

      {/* Map */}
      <div>
        <MapView markers={markers} routes={routes} height={280} zoom={12} />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal inline-block" /> Your area</span>
          <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: "#6366F1" }} /> Partner area</span>
          <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rotate-45 bg-signal inline-block" /> Checkpoint</span>
          <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-verified inline-block" /> Destination</span>
          <span className="ml-auto inline-flex items-center gap-1"><ShieldCheck size={12} /> Areas shown are approximate</span>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="rounded-xl border border-line bg-canvas/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="eyebrow">Why this match</span>
          <span className="text-xs text-ink-muted">{result.route_overlap_pct}% route overlap · {result.departure_diff_min} min apart</span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <MatchBar label="Route similarity (40%)" value={bd.route} />
          <MatchBar label="Time compatibility (25%)" value={bd.time} />
          <MatchBar label="Destination (15%)" value={bd.destination} />
          <MatchBar label="Checkpoint distance (10%)" value={bd.checkpoint} />
          <MatchBar label="Reliability & rating (10%)" value={bd.reliability} />
        </div>
        {result.reasons?.length > 0 && (
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <CheckCircle2 size={13} className="shrink-0 text-verified" /> {r}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Checkpoint selection */}
      {checkpoints.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MapPin size={15} className="text-signal" />
            <span className="font-display font-700 text-ink">Recommended meeting point</span>
          </div>
          <p className="mb-3 text-xs text-ink-muted">Explore safe public options here. The host confirms the final checkpoint when they accept your request.</p>
          <CheckpointPicker options={checkpoints} selectedId={selected?.id} onSelect={setSelected} />
        </div>
      )}

      {/* Cost + request */}
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-ink-muted">Your estimated share</div>
            <div className="font-mono font-800 text-2xl text-teal tnum">{inr(result.estimated_share)}</div>
          </div>
          <div className="text-right text-xs text-ink-muted">
            <div>Departs {time12(j.departure_time)}</div>
            <div>{km(j.distance_km)} · {j.available_seats} seat{j.available_seats === 1 ? "" : "s"} left</div>
          </div>
        </div>

        {done ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-verified-wash px-4 py-3 text-sm font-medium text-verified">
            <CheckCircle2 size={18} /> Request sent — track it under Matches.
          </div>
        ) : (
          <>
            <Textarea className="mt-3" placeholder={`Hi ${p.full_name.split(" ")[0]}, I'm heading the same way — could we share the ride?`}
              value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <Info size={13} /> Not a taxi — you're sharing a journey and its cost fairly.
              </div>
              <Button loading={sending} onClick={requestJoin}><Send size={15} /> Request to join</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
