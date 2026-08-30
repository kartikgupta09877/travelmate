import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Send, CheckCircle2, XCircle, Clock, ArrowRight, MapPin, Users } from "lucide-react";
import type { Match } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { MatchScore } from "@/components/MatchScore";
import { CheckpointPicker } from "@/components/CheckpointPicker";
import { Avatar } from "@/components/ui/Avatar";
import { Stars, VerificationBadges } from "@/components/VerificationBadges";
import { Button, Card, Chip, Segmented, SectionHeading, Loading, EmptyState, cx } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { relativeTime, statusLabel } from "@/lib/format";

const statusTone = (s: string) =>
  s === "confirmed" || s === "accepted" ? "verified" : s === "declined" || s === "cancelled" ? "danger" : s === "requested" ? "signal" : "muted";

function MatchCard({ m, box, onChange }: { m: Match; box: "incoming" | "outgoing"; onChange: () => void }) {
  const toast = useToast();
  const nav = useNavigate();
  const p = m.partner;
  const cps = [m.suggested_checkpoint, ...(m.alternative_checkpoints || [])].filter(Boolean) as NonNullable<Match["suggested_checkpoint"]>[];
  const [cp, setCp] = useState(m.suggested_checkpoint?.id || cps[0]?.id || null);
  const [busy, setBusy] = useState(false);
  const pending = m.status === "requested" || m.status === "suggested";

  const act = async (kind: "accept" | "decline") => {
    setBusy(true);
    try {
      if (kind === "accept" && cp && cp !== m.suggested_checkpoint?.id) {
        try { await api.matching.setCheckpoint(m.id, cp); } catch { /* non-fatal */ }
      }
      if (kind === "accept") { await api.matching.accept(m.id); toast.push("Match accepted — your trip is confirmed.", "success"); }
      else { await api.matching.decline(m.id); toast.push("Request declined.", "info"); }
      onChange();
    } catch { toast.push("Action failed. Try again.", "error"); }
    finally { setBusy(false); }
  };

  if (!p) return null;
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={p.full_name} src={p.photo_url} id={p.id} size={48} verified={p.verification.identity} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link to={`/app/profile/${p.id}`} className="truncate font-display font-700 text-ink hover:underline">{p.full_name}</Link>
              <span className="text-xs text-ink-muted">· {relativeTime(m.created_at)}</span>
            </div>
            <div className="mt-0.5"><Stars rating={p.stats.rating} count={p.stats.ratings_count} size={12} /></div>
            <div className="mt-2"><VerificationBadges v={p.verification} size="sm" /></div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <MatchScore score={m.score} size={58} />
            <Chip tone={statusTone(m.status) as any}>{statusLabel(m.status)}</Chip>
          </div>
        </div>

        {m.reasons?.length > 0 && (
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {m.reasons.slice(0, 4).map((r, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-ink-muted"><CheckCircle2 size={12} className="shrink-0 text-verified" /> {r}</li>
            ))}
          </ul>
        )}

        {box === "incoming" && pending && cps.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink"><MapPin size={13} className="text-signal" /> Confirm a meeting checkpoint</div>
            <CheckpointPicker options={cps} selectedId={cp} onSelect={(c) => setCp(c.id)} />
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          {box === "incoming" && pending ? (
            <>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50" loading={busy} onClick={() => act("decline")}><XCircle size={15} /> Decline</Button>
              <Button loading={busy} onClick={() => act("accept")}><CheckCircle2 size={15} /> Accept & confirm</Button>
            </>
          ) : box === "outgoing" && pending ? (
            <span className="text-xs text-ink-muted">Waiting for the host to respond</span>
          ) : (m.status === "accepted" || m.status === "confirmed") ? (
            <Button variant="outline" sm onClick={() => nav("/app/trips")}>View trip <ArrowRight size={14} /></Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export default function Matches() {
  const [box, setBox] = useState<"incoming" | "outgoing">("incoming");
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["matches", box], queryFn: () => api.matching.list(box) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["matches"] }); qc.invalidateQueries({ queryKey: ["trips"] }); };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Matches" title="Requests & invitations"
        sub="Incoming requests are people who want to share your journey. Outgoing are journeys you've asked to join." />
      <Segmented value={box} onChange={setBox}
        options={[
          { value: "incoming", label: <span className="inline-flex items-center gap-1.5"><Inbox size={14} /> Incoming</span> },
          { value: "outgoing", label: <span className="inline-flex items-center gap-1.5"><Send size={14} /> Outgoing</span> },
        ]} />

      {isLoading ? <Loading />
        : isError ? <EmptyState icon={<Users size={22} />} title="Could not load requests"
          sub={error instanceof ApiError ? error.message : "Please try again shortly."} />
        : !data || data.length === 0 ? (
          <EmptyState icon={box === "incoming" ? <Inbox size={22} /> : <Send size={22} />}
            title={box === "incoming" ? "No incoming requests" : "No outgoing requests"}
            sub={box === "incoming" ? "When someone requests to share a journey you host, it'll appear here." : "Find a partner and request to join their journey."}
            action={<Link to="/app/find"><Button sm><Users size={15} /> Find partners</Button></Link>} />
        ) : (
          <div className="grid gap-4">{data.map((m) => <MatchCard key={m.id} m={m} box={box} onChange={refresh} />)}</div>
        )}
    </div>
  );
}
