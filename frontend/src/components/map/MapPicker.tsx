import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.divIcon({
  html: `<span style="display:block;width:20px;height:20px;background:#0D9488;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(16,24,40,.4)"></span>`,
  className: "", iconSize: [20, 20], iconAnchor: [10, 10],
});

function Clicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 14), { animate: true });
  }, [map, position]);
  return null;
}

export default function MapPicker({ value, onPick, height = 320 }:
  { value?: { lat: number; lng: number } | null; onPick: (lat: number, lng: number) => void; height?: number }) {
  const [pos, setPos] = useState<[number, number] | null>(value ? [value.lat, value.lng] : null);
  useEffect(() => setPos(value ? [value.lat, value.lng] : null), [value?.lat, value?.lng]);
  const handle = (lat: number, lng: number) => { setPos([lat, lng]); onPick(lat, lng); };
  return (
    <section style={{ height, borderRadius: 12, overflow: "hidden" }} aria-label="Location picker map">
      <p className="sr-only">Select an approximate area by clicking the map, or use the latitude and longitude fields below the map.</p>
      <MapContainer center={pos || [28.6304, 77.2177]} zoom={11} style={{ height: "100%", width: "100%" }} keyboard aria-label="Location picker">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap' />
        <Clicker onPick={handle} />
        <Recenter position={pos} />
        {pos && <Marker position={pos} icon={icon} />}
      </MapContainer>
    </section>
  );
}
