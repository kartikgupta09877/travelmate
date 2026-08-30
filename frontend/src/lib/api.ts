// Typed fetch client for the TravelMate API.
// Auth token is kept in localStorage; every request attaches it as a Bearer.

import type {
  AdminStats, AssistantResult, Conversation, ConversationContact, CostPreview, DashboardStats,
  Journey, JourneyType, Match, Message, PartnerResult, PartnerSearchQuery,
  Report, ReportStatus, Review, Trip, TripCost, TripStatus, UserProfile, UserPublic,
  VerificationChannel, VehicleInfo,
  JourneyCreateInput, JourneyPreviewInput,
} from "./types";

const BASE = import.meta.env.VITE_API_BASE || "";
const TOKEN_KEY = "travelmate_token";

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: { query?: Record<string, string | number | boolean | undefined> } = {},
): Promise<T> {
  let url = `${BASE}/api${path}`;
  if (opts.query) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) q.set(k, String(v));
    }
    const s = q.toString();
    if (s) url += `?${s}`;
  }
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running on port 8000?");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(data, res.status));
  }
  return data as T;
}

function safeJson(t: string): unknown {
  try { return JSON.parse(t); } catch { return t; }
}

function errorMessage(data: unknown, status: number): string {
  if (typeof data === "string" && data) return data;
  if (data && typeof data === "object") {
    const body = data as { detail?: unknown; message?: unknown };
    const detail = body.detail ?? body.message;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => item && typeof item === "object" && "msg" in item ? String(item.msg) : null)
        .filter((item): item is string => Boolean(item));
      if (messages.length) return messages.join(" ");
    }
  }
  return status === 401 ? "Please sign in again." : `Request failed (${status}).`;
}

// ---- Auth ----
export const auth = {
  register: (b: {
    full_name: string; email: string; phone: string; password: string;
    city: string; date_of_birth?: string; vehicle?: VehicleInfo;
  }) => request<{ access_token: string }>("POST", "/auth/register", b),
  login: (email: string, password: string) =>
    request<{ access_token: string }>("POST", "/auth/login", { email, password }),
  me: () => request<UserProfile>("GET", "/auth/me"),
  sendCode: (channel: VerificationChannel) =>
    request<{ status: string; channel: string; demo_code?: string; message: string }>(
      "POST", "/auth/verify/send", { channel }),
  confirm: (channel: VerificationChannel, code?: string) =>
    request<UserProfile>("POST", "/auth/verify/confirm", { channel, code }),
};

// ---- Users ----
export const users = {
  get: (id: string) => request<UserPublic>("GET", `/users/${id}`),
  updateMe: (b: Partial<UserProfile> & { vehicle?: UserProfile["vehicle"] }) =>
    request<UserProfile>("PATCH", "/users/me", b),
  block: (id: string) => request<UserProfile>("POST", `/users/${id}/block`),
  unblock: (id: string) => request<UserProfile>("POST", `/users/${id}/unblock`),
};

// ---- Journeys ----
export const journeys = {
  create: (b: JourneyCreateInput) => request<Journey>("POST", "/journeys", b),
  list: (p: { mine?: boolean; type?: JourneyType } = {}) =>
    request<Journey[]>("GET", "/journeys", undefined, { query: p }),
  get: (id: string) => request<Journey>("GET", `/journeys/${id}`),
  preview: (b: JourneyPreviewInput) => request<CostPreview>("POST", "/journeys/preview", b),
  previewCost: (p: {
    distance_km: number; vehicle_type?: string; travelers?: number; recurrence?: string;
  }) => request<CostPreview>("GET", "/journeys/preview/cost", undefined, { query: p }),
};

// ---- Matching ----
export const matching = {
  search: (b: PartnerSearchQuery) => request<PartnerResult[]>("POST", "/matches/search", b),
  requestJoin: (b: {
    journey_id: string; message?: string;
    origin?: unknown; destination?: unknown; departure_time?: string;
  }) => request<Match>("POST", "/matches/request", b),
  list: (box: "incoming" | "outgoing") =>
    request<Match[]>("GET", "/matches", undefined, { query: { box } }),
  setCheckpoint: (matchId: string, checkpoint_id: string) =>
    request<Match>("POST", `/matches/${matchId}/checkpoint`, undefined, { query: { checkpoint_id } }),
  accept: (matchId: string) => request<Match>("POST", `/matches/${matchId}/accept`),
  decline: (matchId: string) => request<Match>("POST", `/matches/${matchId}/decline`),
};

// ---- Trips ----
export const trips = {
  list: () => request<Trip[]>("GET", "/trips"),
  get: (id: string) => request<Trip>("GET", `/trips/${id}`),
  cost: (id: string) => request<TripCost>("GET", `/trips/${id}/cost`),
  setStatus: (id: string, status: TripStatus) =>
    request<Trip>("POST", `/trips/${id}/status`, { status }),
};

// ---- Messages ----
export const chat = {
  conversations: () => request<Conversation[]>("GET", "/conversations"),
  messages: (cid: string) => request<Message[]>("GET", `/conversations/${cid}/messages`),
  contact: (cid: string) => request<ConversationContact>("GET", `/conversations/${cid}/contact`),
  send: (cid: string, text: string) =>
    request<Message>("POST", `/conversations/${cid}/messages`, { text, kind: "text" }),
};

// ---- Reviews ----
export const reviews = {
  create: (b: { trip_id: string; reviewee_id: string; rating: number; comment?: string; tags?: string[] }) =>
    request<Review>("POST", "/reviews", b),
  forUser: (userId: string) => request<Review[]>("GET", `/reviews/user/${userId}`),
};

// ---- Safety ----
export const safety = {
  report: (b: { reported_user_id: string; trip_id?: string; reason: string; details?: string }) =>
    request<Report>("POST", "/safety/report", b),
  sos: (b: { trip_id?: string; lat?: number; lng?: number; note?: string }) =>
    request<{
      status: string; id: string; disclaimer: string; message: string;
      emergency_numbers: { police: string; ambulance: string; women_helpline: string };
    }>("POST", "/safety/sos", b),
  share: (b: { trip_id: string; contact_name?: string }) =>
    request<{ share_url: string; shared_with?: string | null; note: string }>(
      "POST", "/safety/share", b),
};

// ---- Dashboard ----
export const dashboard = {
  get: () => request<DashboardStats>("GET", "/dashboard"),
};

// ---- Assistant ----
export const assistant = {
  match: (message: string) => request<AssistantResult>("POST", "/assistant/match", { message }),
};

// ---- Admin ----
export const admin = {
  stats: () => request<AdminStats>("GET", "/admin/stats"),
  users: () => request<UserPublic[]>("GET", "/admin/users"),
  setVerification: (userId: string, channel: VerificationChannel, value: boolean) =>
    request<UserPublic>("POST", `/admin/users/${userId}/verification`, { channel, value }),
  suspend: (userId: string, suspended: boolean) =>
    request<UserPublic>("POST", `/admin/users/${userId}/suspend`, { suspended }),
  reports: () => request<Report[]>("GET", "/admin/reports"),
  updateReport: (reportId: string, status: ReportStatus, admin_notes?: string) =>
    request<Report>("POST", `/admin/reports/${reportId}`, { status, admin_notes }),
};

export const api = {
  auth, users, journeys, matching, trips, chat, reviews, safety, dashboard, assistant, admin,
};
export default api;
