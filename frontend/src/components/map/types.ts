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
  /**
   * TravelMate does not claim turn-by-turn navigation. Marking a route as an
   * estimate makes the visual treatment and screen-reader summary explicit.
   */
  estimated?: boolean;
  label?: string;
}

export interface MapViewProps {
  markers: MapMarker[];
  routes?: MapRoute[];
  height?: number | string;
  className?: string;
  interactive?: boolean;
  zoom?: number;
  /** A concise name announced to assistive technology. */
  label?: string;
  /** Extra context, such as the privacy treatment or routing limitation. */
  description?: string;
}
