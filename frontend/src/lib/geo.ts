import type { GeoPoint } from "./types";

const R = 6371; // km
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

// Rough city-traffic duration estimate used only for previews before the
// backend responds with its authoritative value.
export function estimateMinutes(distanceKm: number, type: "local" | "long"): number {
  const speed = type === "long" ? 55 : 22; // km/h
  return Math.round((distanceKm / speed) * 60);
}

export function distanceBetween(a: GeoPoint | null, b: GeoPoint | null): number | null {
  if (!a || !b) return null;
  return haversineKm(a, b);
}
