import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Users, MapPin } from "lucide-react";
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
    if (!o || !d) { toast.push("Choose a start and destination first.", "info"); return; }
    setLoading(true);
    try {
      const body: PartnerSearchQuery = {
        type: override?.type ?? type, origin: o, destination: d,
        date: (override?.type ?? type) === "long"? (override?.date ?? date ?? null): null,
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

  // If we arrived from creating a journey, prefill + auto-search from it.
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
    <div className="space-y-6">
      <SectionHeading eyebrow="Find partners" title="Search travellers going your way"
        sub="We rank verified partners by route overlap, timing, destination, checkpoint distance and reliability — start points don't need to match." />

      <Card>
        <div className="p-5">
          <div className="mb-4"><Segmented value={type} onChange={setType}
            options={[{ value: "local", label: "Local travel" }, { value: "long", label: "Long trip" }]} /></div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="From"><LocationField scope={type} value={origin} onChange={setOrigin} placeholder="Your area" /></Field>
            <Field label="To"><LocationField scope={type} value={destination} onChange={setDestination} placeholder="Destination" /></Field>
          </div>

          <div className={cx("mt-4 grid gap-4", isLong ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
            {isLong && <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>}
            <Field label="Departure"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
            <Field label="Seats needed">
              <Select value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
            {isLong && <Field label="Budget" hint="optional"><Input type="number" placeholder="₹" value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>}
            {!isLong && (
              <div className="flex items-end">
                <Button className="w-full" onClick={() => runSearch()} loading={loading}><Search size={16} /> Search</Button>
              </div>
            )}
          </div>

          {isLong && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => runSearch()} loading={loading}><Search size={16} /> Search partners</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : results == null ? (
        <EmptyState icon={<SlidersHorizontal size={22} />} title="Set your route to see matches"
          sub="Enter where you're starting from and where you're headed, then search." />
      ) : results.length === 0 ? (
        <EmptyState icon={<Users size={22} />} title="No compatible partners yet"
          sub="Try widening your departure time or checking a nearby destination. New verified travellers join every day." />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted"><span className="font-semibold text-ink">{results.length}</span> compatible {results.length === 1 ? "partner" : "partners"} found</p>
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted"><MapPin size={13} /> Ranked by safety, route & time</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((r) => (
              <PartnerCard key={r.journey.id} r={r} yourTime={time} onOpen={() => setActive(r)} />
            ))}
          </div>
        </>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title="Match details" size="lg">
        {active && (
          <MatchDetail result={active} requesterOrigin={origin} requesterDestination={destination}
            departureTime={time} onRequested={() => setTimeout(() => setActive(null), 1400)} />
        )}
      </Modal>
    </div>
  );
}
