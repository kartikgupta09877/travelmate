import { useId, useMemo, useState } from "react";
import { MapPin, ChevronDown, Crosshair, Check, LocateFixed } from "lucide-react";
import { placesFor, type Place } from "@/lib/places";
import type { GeoPoint } from "@/lib/types";
import { Modal } from "./ui/Modal";
import { MapPicker } from "./map";
import { Button, cx } from "./ui";

export function LocationField({ scope, value, onChange, placeholder }:
  { scope: "local" | "long"; value: GeoPoint | null; onChange: (p: GeoPoint) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pickOpen, setPickOpen] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const listId = useId();

  const options = useMemo(() => {
    const list = placesFor(scope);
    const s = q.trim().toLowerCase();
    return s ? list.filter((p) => p.label.toLowerCase().includes(s) || (p.zone || "").toLowerCase().includes(s)) : list;
  }, [scope, q]);

  const grouped = useMemo(() => {
    const m = new Map<string, Place[]>();
    for (const p of options) {
      const k = p.zone || "Other";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    return [...m.entries()];
  }, [options]);

  const select = (p: GeoPoint) => { onChange(p); setOpen(false); setQ(""); };

  // Privacy: a dropped pin is stored at ~110 m precision, never an exact
  // address. Others still only ever receive the backend's coarser public grid.
  const coarse = (n: number) => Math.round(n * 1000) / 1000;
  const setPickedPoint = (lat: number, lng: number) => {
    setPin({ lat, lng });
    setLatitude(lat.toFixed(5));
    setLongitude(lng.toFixed(5));
    setLocationError("");
  };
  const applyCoordinates = () => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLocationError("Enter a latitude between -90 and 90 and a longitude between -180 and 180.");
      return;
    }
    setPickedPoint(lat, lng);
  };
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location access is not available in this browser. Enter coordinates or choose on the map instead.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setPickedPoint(coords.latitude, coords.longitude); setLocating(false); },
      () => { setLocationError("We could not get your location. Check browser permissions or choose another method."); setLocating(false); },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox"
        aria-expanded={open} aria-controls={listId}
        className="input flex items-center justify-between text-left">
        <span className="flex min-w-0 items-center gap-2">
          <MapPin size={16} className="shrink-0 text-teal-dark" />
          {value ? (
            <span className="min-w-0">
              <span className="truncate font-bold text-ocean-900">{value.label}</span>
              {value.zone && <span className="ml-1.5 text-xs text-slate-600 font-semibold">· {value.zone}</span>}
            </span>
          ) : (
            <span className="text-slate-500 font-medium">{placeholder || "Select a location"}</span>
          )}
        </span>
        <ChevronDown size={16} className="shrink-0 text-slate-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
            <div className="border-b border-slate-200 p-2">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search area or landmark…" className="input py-2 text-sm" />
            </div>
            <div id={listId} role="listbox" aria-label="Available locations" className="max-h-60 overflow-y-auto p-1.5">
              {grouped.length === 0 && <div className="px-3 py-6 text-center text-sm font-semibold text-slate-600">No places found.</div>}
              {grouped.map(([zone, items]) => (
                <div key={zone} role="group" aria-label={zone} className="mb-1">
                  <div className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-600">{zone}</div>
                  {items.map((p) => {
                    const active = value?.label === p.label;
                    return (
                      <button key={p.label} type="button" onClick={() => select(p)}
                        role="option" aria-selected={active}
                        className={cx("flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-semibold hover:bg-teal-wash cursor-pointer",
                          active && "bg-teal-wash text-teal-dark font-bold")}>
                        <span className="text-ocean-900">{p.label}</span>
                        {active && <Check size={15} className="text-teal-dark" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { setOpen(false); setPickOpen(true); }}
              className="flex w-full items-center gap-2 border-t border-slate-200 px-3 py-2.5 text-sm font-extrabold text-teal-dark hover:bg-teal-wash transition-colors cursor-pointer">
              <Crosshair size={15} /> Drop a pin on the map instead
            </button>
          </div>
        </>
      )}

      <Modal open={pickOpen} onClose={() => setPickOpen(false)} title="Choose an approximate area"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPickOpen(false)}>Cancel</Button>
            <Button disabled={!pin} onClick={() => { if (pin) { select({ label: "Selected approximate area", lat: coarse(pin.lat), lng: coarse(pin.lng), zone: "Custom" }); setPickOpen(false); } }}>
              Use this point
            </Button>
          </>
        }>
        <p className="mb-3 text-sm font-semibold text-slate-600 leading-relaxed">Choose on the map, use your device location, or enter coordinates. We round the saved point to an approximate area before it is shared — never an exact address.</p>
        <MapPicker value={pin} onPick={setPickedPoint} />
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">Accessible alternatives</span>
            <Button type="button" variant="outline" sm loading={locating} onClick={useCurrentLocation}>
              <LocateFixed size={14} /> Use my location
            </Button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-700" htmlFor="pin-latitude">Latitude
              <input id="pin-latitude" inputMode="decimal" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 28.63040" className="input mt-1 py-2" />
            </label>
            <label className="text-xs font-bold text-slate-700" htmlFor="pin-longitude">Longitude
              <input id="pin-longitude" inputMode="decimal" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 77.21770" className="input mt-1 py-2" />
            </label>
          </div>
          <Button type="button" variant="ghost" sm className="mt-2" onClick={applyCoordinates}>Set coordinates</Button>
          {locationError && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{locationError}</p>}
          {pin && <p className="mt-2 text-xs font-semibold text-teal-dark">Selected point: {coarse(pin.lat).toFixed(3)}, {coarse(pin.lng).toFixed(3)} (saved at this approximate precision)</p>}
        </div>
      </Modal>
    </div>
  );
}
