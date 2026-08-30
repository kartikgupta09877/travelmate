// Small formatting helpers. Indian rupee + friendly dates.

export function inr(n: number | null | undefined, opts: { decimals?: boolean } = {}): string {
  const v = Math.round(Number(n || 0) * (opts.decimals ? 100 : 1)) / (opts.decimals ? 100 : 1);
  return "₹" + v.toLocaleString("en-IN", {
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  });
}

export function km(n: number | null | undefined): string {
  const v = Number(n || 0);
  return `${v % 1 === 0 ? v : v.toFixed(1)} km`;
}

export function minutes(n: number | null | undefined): string {
  const m = Math.round(Number(n || 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

export function co2(n: number | null | undefined): string {
  const v = Number(n || 0);
  return `${v.toFixed(v < 10 ? 2 : 1)} kg`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function prettyDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  if (isNaN(d.getTime())) return String(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  if (isNaN(d.getTime())) return String(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.round(h / 24);
  if (day < 7) return `${day}d ago`;
  return shortDate(iso);
}

export function time12(hhmm?: string | null): string {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m || 0).padStart(2, "0")} ${ampm}`;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export function recurrenceLabel(r?: string | null): string {
  const map: Record<string, string> = {
    daily: "Every day", weekdays: "Weekdays", selected: "Selected days",
    one_time: "One time", one_way: "One way", round_trip: "Round trip", multi_day: "Multi-day",
  };
  return (r && map[r]) || "One time";
}

export function statusLabel(s?: string | null): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Deterministic soft avatar color from a string id.
export function avatarColor(seed: string): { bg: string; fg: string } {
  const palette = [
    { bg: "#ECFDF9", fg: "#0F766E" },
    { bg: "#FEF6E7", fg: "#B45309" },
    { bg: "#EAF7EE", fg: "#15803D" },
    { bg: "#EEF2FF", fg: "#4338CA" },
    { bg: "#FDF2F8", fg: "#BE185D" },
    { bg: "#F0F9FF", fg: "#0369A1" },
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
