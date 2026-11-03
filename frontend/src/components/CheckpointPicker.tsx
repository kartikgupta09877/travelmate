import { Train, Bus, DoorOpen, ShoppingBag, Fuel, Navigation, MapPin, Shield, Check } from "lucide-react";
import type { Checkpoint, CheckpointType } from "@/lib/types";
import { cx } from "./ui";
import { km, time12 } from "@/lib/format";

const ICONS: Record<CheckpointType, typeof Train> = {
  metro: Train, bus_stop: Bus, college_gate: DoorOpen, mall: ShoppingBag,
  petrol_pump: Fuel, intersection: Navigation, landmark: MapPin,
};

function safetyLabel(s: number): { text: string; tone: string } {
  if (s >= 0.9) return { text: "Very safe · well-lit public spot", tone: "text-emerald-700 font-bold" };
  if (s >= 0.8) return { text: "Safe public area", tone: "text-teal-dark font-bold" };
  return { text: "Public area", tone: "text-slate-600 font-semibold" };
}

export function CheckpointPicker({ options, selectedId, onSelect }:
  { options: Checkpoint[]; selectedId?: string | null; onSelect?: (c: Checkpoint) => void }) {
  if (!options.length) return null;
  return (
    <div className="grid gap-2.5">
      {options.map((c) => {
        const Icon = ICONS[c.type] || MapPin;
        const active = selectedId === c.id;
        const safe = safetyLabel(c.safety_score);
        return (
          <button key={c.id} type="button" onClick={() => onSelect?.(c)} disabled={!onSelect}
            className={cx("flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer",
              active ? "border-teal-dark bg-teal-wash ring-2 ring-teal/20" : "border-slate-200 bg-white hover:border-teal/50",
              !onSelect && "cursor-default")}>
            <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-lg shadow-2xs",
              active ? "bg-teal-dark text-white" : "bg-amber-50 text-amber-700 border border-amber-200")}>
              <Icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-700 text-ocean-900">{c.name}</span>
                {active && <Check size={15} className="text-teal-dark" />}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600 font-medium">
                <span>You: <b className="font-bold text-slate-900">{km(c.distance_from_requester_km)}</b></span>
                <span>Partner: <b className="font-bold text-slate-900">{km(c.distance_from_host_km)}</b></span>
                {c.eta && <span>Meet ≈ <b className="font-bold text-slate-900">{time12(c.eta)}</b></span>}
              </div>
              <div className={cx("mt-1 flex items-center gap-1 text-xs", safe.tone)}>
                <Shield size={12} /> {safe.text}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
