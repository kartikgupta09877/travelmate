import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMarker, MapViewProps } from "./types";

const COLORS: Record<string, string> = {
  origin: "#0D9488", partner: "#4338CA", checkpoint: "#F59E0B", destination: "#16A34A",
};

function pinIcon(m: MapMarker): L.DivIcon {
  const color = COLORS[m.kind] || "#0D9488";
  const diamond = m.kind === "checkpoint";
  const html = diamond
    ? `<span style="display:block;width:18px;height:18px;background:${color};border:3px solid #fff;transform:rotate(45deg);box-shadow:0 2px 6px rgba(16,24,40,.35);border-radius:3px"></span>`
    : `<span style="display:block;width:18px;height:18px;background:${color};border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(16,24,40,.35)"></span>`;
  return L.divIcon({ html, className: "", iconSize: [18, 18], iconAnchor: [9, 9] });
}

function Fit({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = markers.map((m) => [m.lat, m.lng]) as [number, number][];
    if (pts.length === 0) return;
    if (pts.length === 1) { map.setView(pts[0], 13); return; }
    map.fitBounds(L.latLngBounds(pts), { padding: [42, 42], maxZoom: 14 });
  }, [map, markers]);
  return null;
}

export default function LeafletMap({ markers, routes = [], height = 320, className, interactive = true, zoom }: MapViewProps) {
  const center = useMemo<[number, number]>(() => {
    if (markers.length) return [markers[0].lat, markers[0].lng];
    return [28.6304, 77.2177];
  }, [markers]);

  return (
    <div className={className} style={{ height, borderRadius: 16, overflow: "hidden" }}>
      <MapContainer center={center} zoom={zoom || 12} style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={interactive} dragging={interactive} doubleClickZoom={interactive}
        zoomControl={interactive} attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {routes.map((r, i) => (
          <Polyline key={i} positions={r.points}
            pathOptions={{ color: r.tone === "muted" ? "#98A2B3" : "#0D9488", weight: 4, opacity: 0.9, dashArray: r.tone === "muted" ? "6 8" : undefined }} />
        ))}
        {markers.map((m, i) =>
          m.approximate ? (
            <Circle key={i} center={[m.lat, m.lng]} radius={(m.radiusKm || 0.8) * 1000}
              pathOptions={{ color: COLORS[m.kind], fillColor: COLORS[m.kind], fillOpacity: 0.12, weight: 1.5 }}>
              {m.label && <Tooltip>{m.label} (approx. area)</Tooltip>}
            </Circle>
          ) : (
            <Marker key={i} position={[m.lat, m.lng]} icon={pinIcon(m)}>
              {m.label && <Tooltip direction="top" offset={[0, -8]}>{m.label}</Tooltip>}
            </Marker>
          )
        )}
        <Fit markers={markers} />
      </MapContainer>
    </div>
  );
}
