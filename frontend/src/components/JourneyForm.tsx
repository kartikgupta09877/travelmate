import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Car, Bike, Wallet, Repeat, CalendarDays, Loader2, ArrowRight, Leaf, TrendingDown } from "lucide-react";
import type { CostPreview, GeoPoint, JourneyType, Recurrence, TripType, VehicleType } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { LocationField } from "./LocationField";
import { Button, Card, Field, Input, Segmented, Select, Textarea, Chip, cx } from "./ui";
import { useToast } from "./ui/Toast";
import { inr, km, minutes } from "@/lib/format";

const DOW = [
  { k: "mon", label: "M" }, { k: "tue", label: "T" }, { k: "wed", label: "W" },
  { k: "thu", label: "T" }, { k: "fri", label: "F" }, { k: "sat", label: "S" }, { k: "sun", label: "S" },
];

export function JourneyForm({ type }: { type: JourneyType }) {
  const isLong = type === "long";
  const nav = useNavigate();
  const toast = useToast();

  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [date, setDate] = useState("");
  const [departure, setDeparture] = useState(isLong ? "07:00" : "08:00");
  const [returnTime, setReturnTime] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("car");
  const [seats, setSeats] = useState(isLong ? 3 : 2);
  const [recurrence, setRecurrence] = useState<Recurrence>(isLong ? "one_way" : "weekdays");
  const [days, setDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [budget, setBudget] = useState("");
  const [tripType, setTripType] = useState<TripType>("solo");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<CostPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // The backend owns route estimation and pricing, so the UI never recreates
  // those calculations locally.
  useEffect(() => {
    if (!origin || !destination || !departure) { setPreview(null); setPreviewError(""); return; }
    let alive = true;
    const timer = window.setTimeout(() => {
      api.journeys.preview({
        type, origin, destination, departure_time: departure,
        vehicle_type: vehicle, recurrence,
        // The host is always one traveler; available seats are capacity, not
        // people already in the journey.
        group_size: 1,
      }).then((p) => { if (alive) { setPreview(p); setPreviewError(""); } }).catch((error) => {
        if (alive) {
          setPreview(null);
          setPreviewError(error instanceof ApiError ? error.message : "Could not calculate the route estimate.");
        }
      });
    }, 250);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [origin, destination, departure, type, vehicle, recurrence]);

  const toggleDay = (k: string) =>
    setDays((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));

  const canSubmit = origin && destination && departure && (!isLong || date);

  const submit = async () => {
    if (!canSubmit || !origin || !destination) return;
    setSubmitting(true);
    try {
      const j = await api.journeys.create({
        type, origin, destination, departure_time: departure,
        return_time: returnTime || null, date: isLong ? date : null,
        recurrence, days: recurrence === "selected" || recurrence === "weekdays" || recurrence === "daily" ? days : [],
        vehicle_type: vehicle, available_seats: seats, total_seats: seats,
        budget: budget ? Number(budget) : null, trip_type: isLong ? tripType : null,
        group_size: 1, group_capacity: seats + 1,
        notes: notes || null,
      });
      toast.push("Journey created — finding partners for you.", "success");
      nav(`/app/find?journey=${j.id}`);
    } catch (error) {
      toast.push(error instanceof ApiError ? error.message : "Could not create the journey. Please try again.", "error");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
      <Card>
        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isLong ? "Starting city / area" : "Starting area"}>
              <LocationField scope={type} value={origin} onChange={setOrigin}
                placeholder={isLong ? "e.g. Delhi" : "Your pickup zone"} />
            </Field>
            <Field label="Destination">
              <LocationField scope={type} value={destination} onChange={setDestination}
                placeholder={isLong ? "e.g. Jaipur" : "Where to?"} />
            </Field>
          </div>

          {origin && destination && preview && (
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="teal">{km(preview.distance_km)} route</Chip>
              {preview.duration_min != null && <Chip tone="mono">≈ {minutes(preview.duration_min)}</Chip>}
              <span className="text-xs text-ink-muted">We only store approximate zones — never exact addresses.</span>
            </div>
          )}

          <div className={cx("grid gap-4", isLong ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {isLong && (
              <Field label="Travel date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            )}
            <Field label="Departure time">
              <Input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} />
            </Field>
            <Field label={isLong ? "Return time (optional)" : "Return time (optional)"}>
              <Input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
            </Field>
          </div>

          <div>
            <div className="label mb-1.5">{isLong ? "Trip type" : "Repeats"}</div>
            {isLong ? (
              <Segmented value={recurrence} onChange={(v) => setRecurrence(v)}
                options={[
                  { value: "one_way", label: "One-way" },
                  { value: "round_trip", label: "Round trip" },
                  { value: "multi_day", label: "Multi-day" },
                ]} />
            ) : (
              <div className="space-y-3">
                <Segmented value={recurrence} onChange={(v) => setRecurrence(v)}
                  options={[
                    { value: "daily", label: "Every day" },
                    { value: "weekdays", label: "Weekdays" },
                    { value: "selected", label: "Selected days" },
                    { value: "one_time", label: "One time" },
                  ]} />
                {recurrence === "selected" && (
                  <div className="flex gap-1.5">
                    {DOW.map((d) => (
                      <button key={d.k} type="button" onClick={() => toggleDay(d.k)}
                        className={cx("h-9 w-9 rounded-lg text-sm font-semibold font-display transition-colors",
                          days.includes(d.k) ? "bg-teal text-white" : "bg-ink/5 text-ink-muted hover:bg-ink/10")}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Vehicle">
              <div className="flex gap-2">
                {(["car", "bike"] as VehicleType[]).map((v) => {
                  const Icon = v === "bike" ? Bike : Car;
                  return (
                    <button key={v} type="button" onClick={() => setVehicle(v)}
                      className={cx("flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                        vehicle === v ? "border-teal bg-teal-wash text-teal-dark" : "border-line text-ink-muted hover:border-teal/40")}>
                      <Icon size={16} /> {v === "bike" ? "Bike" : "Car"}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Available seats">
              <Select value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
                {(vehicle === "bike" ? [1] : [1, 2, 3, 4, 5, 6]).map((n) => (
                  <option key={n} value={n}>{n} seat{n === 1 ? "" : "s"}</option>
                ))}
              </Select>
            </Field>
            {isLong && (
              <Field label="Budget / person" hint="optional">
                <Input type="number" inputMode="numeric" placeholder="₹" value={budget}
                  onChange={(e) => setBudget(e.target.value)} />
              </Field>
            )}
          </div>

          {isLong && (
            <Field label="Who's travelling">
              <Segmented value={tripType} onChange={(v) => setTripType(v)}
                options={[
                  { value: "solo", label: "Solo" },
                  { value: "couple", label: "Couple" },
                  { value: "group", label: "Group" },
                  { value: "looking", label: "Looking for partners" },
                ]} />
            </Field>
          )}

          <Field label="Notes for partners" hint="optional">
            <Textarea placeholder={isLong ? "Music, stops, luggage, pace…" : "AC, no smoking, punctual…"}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => nav(-1)}>Cancel</Button>
            <Button disabled={!canSubmit || submitting} onClick={submit}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              Create & find partners
            </Button>
          </div>
        </div>
      </Card>

      {/* Live cost preview rail */}
      <div className="space-y-4">
        <Card className="sticky top-4">
          <div className="p-5">
            <div className="eyebrow mb-3">Estimated cost sharing</div>
            {!preview ? (
              <p className="text-sm text-ink-muted">{previewError || "Pick a start and destination to see live cost estimates and your monthly savings."}</p>
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-ink-muted">Your share / trip</div>
                    <div className="font-display font-800 text-3xl text-teal tnum">{inr(preview.per_person_cost)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-ink-muted">Journey cost</div>
                    <div className="font-mono text-ink-soft tnum">{inr(preview.solo_travel_cost)}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-sm">
                  <span className="text-ink-muted">Shared travel cost</span>
                  <span className="font-mono font-700 text-ink-soft tnum">{inr(preview.shared_travel_cost)}</span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-verified-wash px-3 py-2 text-sm text-verified">
                  <TrendingDown size={15} /> Save {inr(preview.estimated_savings)} every trip
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Split by group size</div>
                  {Array.isArray(preview.split) && preview.split.map((s) => (
                    <div key={s.travelers} className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">{s.travelers} travellers</span>
                      <span className="font-mono font-700 text-ink-soft tnum">{inr(s.per_person)}/person</span>
                    </div>
                  ))}
                </div>

                {preview.monthly && recurrence !== "one_time" && recurrence !== "one_way" && (
                  <div className="mt-4 rounded-xl border border-line bg-canvas/60 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">If recurring</div>
                    <div className="mt-1.5 flex items-center justify-between text-sm">
                      <span className="text-ink-muted">Monthly solo</span>
                      <span className="font-mono text-ink-soft tnum">{inr(preview.monthly.solo_cost)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">Monthly shared</span>
                      <span className="font-mono text-teal tnum">{inr(preview.monthly.shared_cost)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-line pt-1.5 text-sm font-semibold">
                      <span className="text-verified">Monthly saving</span>
                      <span className="font-mono text-verified tnum">{inr(preview.monthly.saving)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Leaf size={13} className="text-verified" /> ≈ {preview.co2_reduced_kg} kg CO₂ saved per shared trip
                </div>
              </>
            )}
            <p className="mt-4 text-[11px] leading-relaxed text-ink-muted/80">
              Estimates only. TravelMate is not a taxi service — costs are shared fairly between travellers going the same way.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
