import type { GeoPoint } from "./types";

export interface Place extends GeoPoint { scope: "local" | "long" | "both" }

// Curated, real coordinates so journeys always have valid lat/lng without a
// geocoding API. Home zones are approximate areas (privacy); destinations are
// public places. Extend freely — the app never needs an exact street address.
export const PLACES: Place[] = [
  // West Delhi home zones (Blue Line corridor)
  { label: "Tagore Garden", lat: 28.6436, lng: 77.1128, zone: "West Delhi", scope: "local" },
  { label: "Subhash Nagar", lat: 28.6400, lng: 77.1150, zone: "West Delhi", scope: "local" },
  { label: "Tilak Nagar", lat: 28.6367, lng: 77.0975, zone: "West Delhi", scope: "local" },
  { label: "Rajouri Garden", lat: 28.6455, lng: 77.1230, zone: "West Delhi", scope: "local" },
  { label: "Janakpuri", lat: 28.6292, lng: 77.0782, zone: "West Delhi", scope: "local" },
  { label: "Vikaspuri", lat: 28.6380, lng: 77.0700, zone: "West Delhi", scope: "local" },
  { label: "Uttam Nagar", lat: 28.6217, lng: 77.0597, zone: "West Delhi", scope: "local" },
  { label: "Kirti Nagar", lat: 28.6552, lng: 77.1512, zone: "West Delhi", scope: "local" },
  // Other Delhi zones
  { label: "Dwarka", lat: 28.5921, lng: 77.0460, zone: "South West Delhi", scope: "local" },
  { label: "Rohini", lat: 28.7160, lng: 77.1170, zone: "North West Delhi", scope: "local" },
  { label: "Karol Bagh", lat: 28.6519, lng: 77.1909, zone: "Central Delhi", scope: "both" },
  { label: "Lajpat Nagar", lat: 28.5678, lng: 77.2433, zone: "South Delhi", scope: "local" },
  { label: "Hauz Khas", lat: 28.5494, lng: 77.2001, zone: "South Delhi", scope: "local" },
  { label: "Vasant Kunj", lat: 28.5200, lng: 77.1591, zone: "South Delhi", scope: "local" },
  { label: "Mayur Vihar", lat: 28.6089, lng: 77.2921, zone: "East Delhi", scope: "local" },
  // Common destinations
  { label: "Connaught Place", lat: 28.6304, lng: 77.2177, zone: "Central Delhi", scope: "both" },
  { label: "IIT Delhi", lat: 28.5449, lng: 77.1926, zone: "Hauz Khas", scope: "local" },
  { label: "Delhi Technological University", lat: 28.7501, lng: 77.1177, zone: "Rohini", scope: "local" },
  { label: "Cyber Hub, Gurugram", lat: 28.4949, lng: 77.0895, zone: "Gurugram", scope: "local" },
  { label: "Nehru Place", lat: 28.5491, lng: 77.2533, zone: "South Delhi", scope: "local" },
  { label: "Select Citywalk, Saket", lat: 28.5286, lng: 77.2190, zone: "Saket", scope: "local" },
  { label: "Noida Sector 62", lat: 28.6280, lng: 77.3649, zone: "Noida", scope: "local" },
  { label: "Noida Sector 18", lat: 28.5708, lng: 77.3260, zone: "Noida", scope: "both" },
  // Intercity (long trips)
  { label: "Jaipur", lat: 26.9124, lng: 75.7873, zone: "Rajasthan", scope: "long" },
  { label: "Agra", lat: 27.1767, lng: 78.0081, zone: "Uttar Pradesh", scope: "long" },
  { label: "Mathura", lat: 27.4924, lng: 77.6737, zone: "Uttar Pradesh", scope: "long" },
  { label: "Chandigarh", lat: 30.7333, lng: 76.7794, zone: "Punjab", scope: "long" },
  { label: "Rishikesh", lat: 30.0869, lng: 78.2676, zone: "Uttarakhand", scope: "long" },
  { label: "Meerut", lat: 28.9845, lng: 77.7064, zone: "Uttar Pradesh", scope: "long" },
  { label: "Manesar", lat: 28.3540, lng: 76.9366, zone: "Gurugram", scope: "long" },
];

export function placesFor(scope: "local" | "long"): Place[] {
  return PLACES.filter((p) => p.scope === scope || p.scope === "both");
}
