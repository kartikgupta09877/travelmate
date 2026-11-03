import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Users, MapPin, Sparkles, Filter } from "lucide-react";
import type { GeoPoint, JourneyType, PartnerResult, PartnerSearchQuery } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { LocationField } from "@/components/LocationField";
import { PartnerCard } from "@/components/PartnerCard";
import { MatchDetail } from "@/components/MatchDetail";
import { Modal } from "@/components/ui/Modal";
import {
  Button, Card, Field, Input, Segmented, Select, SectionHeading, EmptyState, SkeletonCard, cx,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";

export default function FindPartners() {
  const [params] = useSearchParams();
  const toast = useToast();

  const [type, setType] = useState<JourneyType>("local");
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [seats, setSeats] = useState(1);
  const [budget, setBudget] = useState("");

  const [results, setResults] = useState<PartnerResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<PartnerResult | null>(null);

  const runSearch = async (override?: Partial<PartnerSearchQuery>) => {
    const o = override?.origin ?? origin;
    const d = override?.destination ?? destination;
    if (!o || !d) { toast.push("Choose a start area and destination first.", "info"); return; }
    setLoading(true);
    try {
      const body: PartnerSearchQuery = {
        type: override?.type ?? type, origin: o, destination: d,
        date: (override?.type ?? type) === "long" ? (override?.date ?? date ?? null) : null,
        departure_time: override?.departure_time ?? time,
        seats_needed: override?.seats_needed ?? seats,
        budget: budget ? Number(budget) : null,
      };
      const res = await api.matching.search(body);
      setResults(res);
    } catch (error) {
      toast.push(error instanceof ApiError ? error.message : "Search failed. Is the backend running?", "error");
      setResults([]);
    } finally { setLoading(false); }
  };

  // If arrived from journey prefill
  const journeyId = params.get("journey");
  useEffect(() => {
    if (!journeyId) return;
    (async () => {
      try {
        const j = await api.journeys.get(journeyId);
        setType(j.type); setOrigin(j.origin); setDestination(j.destination);
        setTime(j.departure_time); if (j.date) setDate(j.date);
        await runSearch({ type: j.type, origin: j.origin, destination: j.destination, departure_time: j.departure_time, date: j.date });
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId]);

  const isLong = type === "long";

  return (
    <div className="space-y-6 animate-fade">
      <SectionHeading eyebrow="Partner Discovery" title="Search verified travellers going your route"
        sub="We match partners on route overlap, timing, checkpoint distance, and reliability rating — exact addresses stay completely private." />

      {/* Search Filter Card */}
      <Card className="border border-slate-200/80 shadow-card">
        <div className="p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <Segmented value={type} onChange={setType}
              options={[{ value: "local", label: "Local Commute" }, { value: "long", label: "Intercity Trip" }]} />
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Sparkles size={14} className="text-teal" /> Multi-factor overlap scoring
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Starting From">
              <LocationField scope={type} value={origin} onChange={setOrigin} placeholder="Select origin area" />
            </Field>
            <Field label="Going To">
              <LocationField scope={type} value={destination} onChange={setDestination} placeholder="Select destination" />
            </Field>
          </div>

          <div className={cx("mt-4 grid gap-4", isLong ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
            {isLong && <Field label="Trip Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>}
            <Field label="Departure Time"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
            <Field label="Seats Needed">
              <Select value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} seat{n === 1 ? "" : "s"}</option>)}
              </Select>
            </Field>
            {isLong && <Field label="Max Budget" hint="optional"><Input type="number" placeholder="₹" value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>}

            {!isLong && (
              <div className="flex items-end">
                <Button lg className="w-full" onClick={() => runSearch()} loading={loading}>
                  <Search size={16} /> Search Partners
                </Button>
              </div>
            )}
          </div>

          {isLong && (
            <div className="mt-5 flex justify-end">
              <Button lg onClick={() => runSearch()} loading={loading}>
                <Search size={16} /> Search Intercity Partners
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Results grid */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : results == null ? (
        <EmptyState icon={<SlidersHorizontal size={24} />} title="Enter your route to see ranked matches"
          sub="Choose where you're starting and where you're headed to discover compatible travel partners." />
      ) : results.length === 0 ? (
        <EmptyState icon={<Users size={24} />} title="No compatible partners found yet"
          sub="Try widening your departure time range or selecting a nearby landmark. Verified members join daily." />
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <p className="text-sm font-semibold text-slate-500">
              Found <strong className="text-ocean-900 font-extrabold">{results.length}</strong> compatible {results.length === 1 ? "partner" : "partners"}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-dark bg-teal-wash/60 px-3 py-1 rounded-full border border-teal/15">
              <MapPin size={13} /> Ranked by route safety & time overlap
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {results.map((r) => (
              <PartnerCard key={r.journey.id} r={r} yourTime={time} onOpen={() => setActive(r)} />
            ))}
          </div>
        </>
      )}

      {/* Match details modal */}
      <Modal open={!!active} onClose={() => setActive(null)} title="Match Details & Route Overview" size="lg">
        {active && (
          <MatchDetail result={active} requesterOrigin={origin} requesterDestination={destination}
            departureTime={time} onRequested={() => setTimeout(() => setActive(null), 1400)} />
        )}
      </Modal>
    </div>
  );
}
