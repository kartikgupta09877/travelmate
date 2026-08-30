import { useMemo, useState } from "react";
import { MapPin, ChevronDown, Crosshair, Check } from "lucide-react";
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

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between text-left">
        <span className="flex min-w-0 items-center gap-2">
          <MapPin size={16} className="shrink-0 text-teal" />
          {value ? (
            <span className="min-w-0">
              <span className="truncate font-medium text-ink">{value.label}</span>
              {value.zone && <span className="ml-1.5 text-xs text-ink-muted">· {value.zone}</span>}
            </span>
          ) : (
            <span className="text-ink-muted/70">{placeholder || "Select a location"}</span>
          )}
        </span>
        <ChevronDown size={16} className="shrink-0 text-ink-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-white shadow-lift">
            <div className="border-b border-line p-2">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search area or landmark…" className="input py-2 text-sm" />
            </div>
            <div className="max-h-60 overflow-y-auto p-1.5">
              {grouped.length === 0 && <div className="px-3 py-6 text-center text-sm text-ink-muted">No places found.</div>}
              {grouped.map(([zone, items]) => (
                <div key={zone} className="mb-1">
                  <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted/70">{zone}</div>
                  {items.map((p) => {
                    const active = value?.label === p.label;
                    return (
                      <button key={p.label} type="button" onClick={() => select(p)}
                        className={cx("flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm hover:bg-teal-wash",
                          active && "bg-teal-wash")}>
                        <span className="text-ink">{p.label}</span>
                        {active && <Check size={15} className="text-teal" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { setOpen(false); setPickOpen(true); }}
              className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-sm font-medium text-teal hover:bg-teal-wash">
              <Crosshair size={15} /> Drop a pin on the map instead
            </button>
          </div>
        </>
      )}

      <Modal open={pickOpen} onClose={() => setPickOpen(false)} title="Drop a pin"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPickOpen(false)}>Cancel</Button>
            <Button disabled={!pin} onClick={() => { if (pin) { select({ label: "Pinned location", lat: pin.lat, lng: pin.lng, zone: "Custom" }); setPickOpen(false); } }}>
              Use this point
            </Button>
          </>
        }>
        <p className="mb-3 text-sm text-ink-muted">Tap anywhere on the map to set an approximate area. We only ever store an approximate zone — never your exact address.</p>
        <MapPicker value={pin} onPick={(lat, lng) => setPin({ lat, lng })} />
      </Modal>
    </div>
  );
}
