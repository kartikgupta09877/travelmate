// Provider-agnostic map contracts. Pages import ONLY from "@/components/map".
// To swap Leaflet for another provider later, implement a new component with
// the same MapViewProps and re-export it from ./index.ts — no page changes.

export type MarkerKind = "origin" | "partner" | "checkpoint" | "destination";

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  kind: MarkerKind;
  /** Approximate zones (home areas) render as a soft circle, never a precise pin. */
  approximate?: boolean;
  radiusKm?: number;
}

export interface MapRoute {
  points: [number, number][];
  tone?: "teal" | "muted";
}

export interface MapViewProps {
  markers: MapMarker[];
  routes?: MapRoute[];
  height?: number | string;
  className?: string;
  interactive?: boolean;
  zoom?: number;
}
