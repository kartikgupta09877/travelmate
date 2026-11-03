import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Send, Wand2, Clock, MapPin, CheckCircle2, Info } from "lucide-react";
import type { AssistantResult } from "@/lib/types";
import { api } from "@/lib/api";
import { PartnerCard } from "@/components/PartnerCard";
import { Button, Card, SectionHeading, Textarea, Chip, Spinner, EmptyState, cx } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { time12 } from "@/lib/format";

const EXAMPLES = [
  "I travel to college in Connaught Place every morning around 8 AM and return at 5 PM. Find a reliable partner.",
  "Looking for someone driving to Cyber Hub, Gurugram on weekday mornings.",
  "Planning a weekend trip Delhi → Jaipur on Saturday, travelling solo, budget ₹900.",
];

export default function AssistantPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<AssistantResult | null>(null);
  const [asked, setAsked] = useState("");

  const ask = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setAsked(q); setInput(q); setLoading(true); setRes(null);
    try {
      setRes(await api.assistant.match(q));
    } catch {
      toast.push("The assistant is unavailable right now.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade">
      <SectionHeading eyebrow="AI Route Assistant" title="Describe your trip in plain conversational language"
        sub="Describe where and when you need to travel. The assistant extracts route intent and uses TravelMate's multi-factor matching score to surface top candidates." />

      <Card className="border border-slate-200/80 shadow-card">
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-dark">
            <Wand2 size={18} /> Tell us your route requirements
          </div>
          <Textarea rows={3} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. I need to reach my office near Connaught Place by 9 AM on weekdays and want to share a car ride."
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(); }} />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-600">Press ⌘ / Ctrl + Enter to submit</span>
            <Button lg onClick={() => ask()} loading={loading}><Send size={16} /> Find My Match</Button>
          </div>

          {!asked && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Sample Prompts</div>
              <div className="grid gap-2">
                {EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => ask(ex)}
                    className="flex items-start gap-2.5 rounded-2xl border border-slate-200/70 bg-slate-50 p-3.5 text-left text-xs font-semibold text-slate-700 hover:border-teal hover:bg-teal-wash/40 transition-all cursor-pointer">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-500 fill-amber-500" /> <span>{ex}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-600">
          <Spinner size={24} /> Analyzing route intent and querying matching database…
        </div>
      )}

      {res && !loading && (
        <div className="space-y-6">
          <Card className="border border-teal/20 bg-teal-wash/40 shadow-xs">
            <div className="p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-white shadow-xs"><Sparkles size={18} /></span>
                <span className="font-display font-800 text-ocean-900 text-lg">AI Intent Analysis</span>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Chip tone={res.understood.type === "long" ? "coral" : "teal"}>
                  {res.understood.type === "long" ? "Intercity Trip" : "Local Commute"}
                </Chip>
                {res.understood.departure_time && <Chip tone="mono" icon={<Clock size={13} />}>{time12(res.understood.departure_time)}</Chip>}
                {res.understood.destination_hint && <Chip tone="muted" icon={<MapPin size={13} />}>{res.understood.destination_hint}</Chip>}
              </div>
              {res.understood.notes?.length > 0 && (
                <ul className="grid gap-1.5 mt-3">
                  {res.understood.notes.map((n, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> <span>{n}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-600 border-t border-teal/15 pt-3">{res.explanation}</p>
            </div>
          </Card>

          {res.results.length === 0 ? (
            <EmptyState icon={<MapPin size={24} />} title="No matches found for this request"
              sub="Try adjusting your departure timing or destination, or publish a journey route to start receiving partner requests." />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">Top <strong className="text-ocean-900 font-extrabold">{res.results.length}</strong> candidates ranked</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {res.results.map((r, i) => (
                  <div key={r.journey.id} className="relative">
                    {i === 0 && (
                      <span className="absolute -top-3 left-4 z-10 rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                        Top AI Recommendation
                      </span>
                    )}
                    <PartnerCard r={r} onOpen={() => nav(`/app/find?journey=${r.journey.id}`)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-slate-600">
            <Info size={14} /> Candidate recommendations are AI guided. Always review verification badges and profiles before traveling.
          </p>
        </div>
      )}
    </div>
  );
}
