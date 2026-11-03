import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Car, Bike, Wallet, Repeat, CalendarDays, Loader2, ArrowRight, Leaf, TrendingDown, ShieldCheck, MapPin } from "lucide-react";
import type { CostPreview, GeoPoint, JourneyType, Recurrence, TripType, VehicleType } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { LocationField } from "./LocationField";
import { MapView } from "./map";
import type { MapMarker, MapRoute } from "./map";
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

  useEffect(() => {
    if (!origin || !destination || !departure) { setPreview(null); setPreviewError(""); return; }
    let alive = true;
    const timer = window.setTimeout(() => {
      api.journeys.preview({
        type, origin, destination, departure_time: departure,
        vehicle_type: vehicle, recurrence,
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
  const previewMarkers: MapMarker[] = [
    ...(origin ? [{ lat: origin.lat, lng: origin.lng, label: `${origin.label} (start area)`, kind: "origin" as const, approximate: true, radiusKm: 0.8 }] : []),
    ...(preview?.suggested_checkpoint ? [{ lat: preview.suggested_checkpoint.lat, lng: preview.suggested_checkpoint.lng, label: preview.suggested_checkpoint.name, kind: "checkpoint" as const }] : []),
    ...(destination ? [{ lat: destination.lat, lng: destination.lng, label: `${destination.label} (destination)`, kind: "destination" as const }] : []),
  ];
  const previewRoutes: MapRoute[] = origin && destination
    ? [{ points: [[origin.lat, origin.lng], [destination.lat, destination.lng]], tone: "teal", estimated: true, label: "Estimated travel corridor" }]
    : [];

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
      toast.push("Journey created — searching for compatible partners.", "success");
      nav(`/app/find?journey=${j.id}`);
    } catch (error) {
      toast.push(error instanceof ApiError ? error.message : "Could not create the journey. Please try again.", "error");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Card className="border border-slate-200/80 shadow-card">
          <div className="space-y-6 p-6 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={isLong ? "Starting city / area" : "Starting pickup area"}>
                <LocationField scope={type} value={origin} onChange={setOrigin}
                  placeholder={isLong ? "e.g. Delhi" : "Select pickup zone"} />
              </Field>
              <Field label="Destination">
                <LocationField scope={type} value={destination} onChange={setDestination}
                  placeholder={isLong ? "e.g. Jaipur" : "Select destination area"} />
              </Field>
            </div>

            {origin && destination && preview && (
              <div className="space-y-3 rounded-2xl bg-teal-wash/60 border border-teal/20 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <Chip tone="teal">{km(preview.distance_km)} estimated road distance</Chip>
                {preview.duration_min != null && <Chip tone="mono">≈ {minutes(preview.duration_min)} driving</Chip>}
                <span className="text-slate-600 font-medium ml-auto">Public checkpoints protect privacy</span>
                </div>
                <MapView markers={previewMarkers} routes={previewRoutes} height={220}
                  label="Journey route preview"
                  description="Your start is shown as an approximate area. The dashed line is an estimated travel corridor, not turn-by-turn navigation." />
                <p className="text-[11px] font-medium text-slate-600">Distance and time are road estimates. The dashed line shows the general travel corridor; confirm the final route in your navigation app.</p>
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
              <Field label="Return time (optional)">
                <Input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
              </Field>
            </div>

            <div>
              <div className="label mb-2">{isLong ? "Trip Type" : "Recurrence Schedule"}</div>
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
                      { value: "selected", label: "Custom days" },
                      { value: "one_time", label: "One time" },
                    ]} />
                  {recurrence === "selected" && (
                    <div className="flex gap-2 pt-1">
                      {DOW.map((d) => (
                        <button key={d.k} type="button" onClick={() => toggleDay(d.k)}
                          className={cx("h-9 w-9 rounded-xl text-xs font-bold font-display transition-all",
                            days.includes(d.k) ? "bg-teal text-white shadow-xs" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Vehicle Type">
                <div className="flex gap-2">
                  {(["car", "bike"] as VehicleType[]).map((v) => {
                    const Icon = v === "bike" ? Bike : Car;
                    return (
                      <button key={v} type="button" onClick={() => setVehicle(v)}
                        className={cx("flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all",
                          vehicle === v ? "border-teal bg-teal-wash text-teal-dark shadow-xs" : "border-slate-200 text-slate-500 hover:border-teal/40")}>
                        <Icon size={16} /> {v === "bike" ? "Bike" : "Car"}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Available Seats">
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
              <Field label="Who is travelling">
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
              <Textarea placeholder={isLong ? "Music preferences, stops, luggage capacity…" : "AC preference, punctuality, no smoking…"}
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => nav(-1)}>Cancel</Button>
              <Button disabled={!canSubmit || submitting} onClick={submit} lg>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Publish & Find Partners
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Cost Preview Rail */}
      <div className="lg:col-span-5 space-y-4">
        <Card className="sticky top-20 border border-slate-200/80 shadow-card">
          <div className="p-6">
            <div className="eyebrow mb-4">Live Fare & Savings Estimate</div>
            {!preview ? (
              <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                {previewError || "Select your origin and destination to view real-time cost sharing calculations and CO₂ reduction numbers."}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-xs font-bold text-slate-600">Your Share / Trip</div>
                    <div className="font-display font-800 text-3xl text-teal-dark tnum tracking-tight">{inr(preview.per_person_cost)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-600">Solo Cost</div>
                    <div className="font-mono font-bold text-slate-600 tnum">{inr(preview.solo_travel_cost)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-semibold">
                  <span className="text-slate-600">Shared Route Cost</span>
                  <span className="font-mono font-bold text-ocean-900 tnum">{inr(preview.shared_travel_cost)}</span>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-bold text-emerald-700">
                  <TrendingDown size={16} /> Save approx {inr(preview.estimated_savings)} per trip
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Cost per person by group size</div>
                  {Array.isArray(preview.split) && preview.split.map((s) => (
                    <div key={s.travelers} className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">{s.travelers} travellers</span>
                      <span className="font-mono font-bold text-ocean-900 tnum">{inr(s.per_person)}/person</span>
                    </div>
                  ))}
                </div>

                {preview.monthly && recurrence !== "one_time" && recurrence !== "one_way" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Monthly Projection</div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">Monthly Solo</span>
                      <span className="font-mono text-slate-700 font-bold tnum">{inr(preview.monthly.solo_cost)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">Monthly Shared</span>
                      <span className="font-mono font-bold text-teal-dark tnum">{inr(preview.monthly.shared_cost)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs font-extrabold text-emerald-700">
                      <span>Monthly Net Savings</span>
                      <span className="font-mono tnum">{inr(preview.monthly.saving)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 pt-2">
                  <Leaf size={15} /> Save ≈ {preview.co2_reduced_kg} kg CO₂ per shared ride
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
