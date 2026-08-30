import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui";
import type { MapViewProps } from "./types";
export type { MapViewProps, MapMarker, MapRoute, MarkerKind } from "./types";

// Lazy-load Leaflet so it (and its CSS) only ship when a map is actually shown.
const LeafletMap = lazy(() => import("./LeafletMap"));
const LeafletPicker = lazy(() => import("./MapPicker"));

export function MapView(props: MapViewProps) {
  return (
    <Suspense fallback={
      <div className="grid place-items-center rounded-2xl bg-teal-wash/50 text-ink-muted"
        style={{ height: props.height || 320 }}>
        <Spinner /> <span className="ml-2 text-sm">Loading map…</span>
      </div>
    }>
      <LeafletMap {...props} />
    </Suspense>
  );
}

export function MapPicker(props: { value?: { lat: number; lng: number } | null; onPick: (lat: number, lng: number) => void; height?: number }) {
  return (
    <Suspense fallback={
      <div className="grid place-items-center rounded-xl bg-teal-wash/50 text-ink-muted" style={{ height: props.height || 320 }}>
        <Spinner /> <span className="ml-2 text-sm">Loading map…</span>
      </div>
    }>
      <LeafletPicker {...props} />
    </Suspense>
  );
}
