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
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading eyebrow="AI match assistant" title="Describe your trip in plain words"
        sub="The assistant reads your request, then uses the same route, time, verification and reliability signals as search to rank partners. It never replaces the core matching engine." />

      <Card>
        <div className="p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal">
            <Wand2 size={16} /> What's your journey?
          </div>
          <Textarea rows={3} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. I need to reach my office near Connaught Place by 9 AM on weekdays and want to share a car."
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(); }} />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] text-ink-muted">⌘/Ctrl + Enter to send</span>
            <Button onClick={() => ask()} loading={loading}><Send size={15} /> Find my match</Button>
          </div>

          {!asked && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Try an example</div>
              <div className="grid gap-2">
                {EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => ask(ex)}
                    className="flex items-start gap-2 rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5 text-left text-sm text-ink-soft hover:border-teal/50 hover:bg-teal-wash/40">
                    <Sparkles size={15} className="mt-0.5 shrink-0 text-signal" /> {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted">
          <Spinner /> Reading your request and ranking partners…
        </div>
      )}

      {res && !loading && (
        <div className="space-y-5">
          {/* Understood intent */}
          <Card className="border-teal/20 bg-teal-wash/30">
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-white"><Sparkles size={16} /></span>
                <span className="font-display font-700 text-ink">Here's what I understood</span>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Chip tone={res.understood.type === "long" ? "signal" : "teal"}>
                  {res.understood.type === "long" ? "Long trip" : "Local travel"}
                </Chip>
                {res.understood.departure_time && <Chip tone="mono" icon={<Clock size={12} />}>{time12(res.understood.departure_time)}</Chip>}
                {res.understood.destination_hint && <Chip tone="muted" icon={<MapPin size={12} />}>{res.understood.destination_hint}</Chip>}
              </div>
              {res.understood.notes?.length > 0 && (
                <ul className="grid gap-1">
                  {res.understood.notes.map((n, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-sm text-ink-soft">
                      <CheckCircle2 size={13} className="shrink-0 text-verified" /> {n}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{res.explanation}</p>
            </div>
          </Card>

          {res.results.length === 0 ? (
            <EmptyState icon={<MapPin size={22} />} title="No strong matches for that yet"
              sub="Try adjusting the time or destination, or create a journey so partners can find you too." />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <span className="font-semibold text-ink">Top {res.results.length}</span> ranked by compatibility
              </div>
              <div className="grid gap-4">
                {res.results.map((r, i) => (
                  <div key={r.journey.id} className="relative">
                    {i === 0 && (
                      <span className="absolute -top-2 left-4 z-10 rounded-full bg-verified px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
                        Best match
                      </span>
                    )}
                    <PartnerCard r={r} onOpen={() => nav(`/app/find?journey=${r.journey.id}`)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-muted">
            <Info size={13} /> Suggestions are guidance, not guarantees. Always review a partner's profile and verifications before you travel.
          </p>
        </div>
      )}
    </div>
  );
}
