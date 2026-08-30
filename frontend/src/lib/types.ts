// Shared types mirroring the FastAPI response models.

export type Role = "user" | "admin" | "moderator" | "verification_agent";
export type JourneyType = "local" | "long";
export type VehicleType = "car" | "bike" | "other" | "none";
export type Recurrence =
  | "daily" | "weekdays" | "selected" | "one_time"
  | "one_way" | "round_trip" | "multi_day";
export type TripType = "solo" | "couple" | "group" | "looking";
export type JourneyStatus = "open" | "full" | "closed" | "completed" | "cancelled";
export type MatchStatus =
  | "suggested" | "requested" | "accepted" | "declined" | "confirmed" | "cancelled";
export type TripStatus =
  | "pending" | "requested" | "accepted" | "confirmed"
  | "in_progress" | "completed" | "cancelled";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type CheckpointType =
  | "metro" | "bus_stop" | "college_gate" | "mall"
  | "petrol_pump" | "intersection" | "landmark";

export interface GeoPoint {
  label: string;
  lat: number;
  lng: number;
  zone?: string | null;
}

export interface VehicleInfo {
  type: VehicleType;
  model?: string | null;
  color?: string | null;
  seats: number;
  plate_hint?: string | null;
}

export interface Verification {
  email: boolean;
  phone: boolean;
  identity: boolean;
  college: boolean;
  vehicle: boolean;
}
export type VerificationChannel = keyof Verification;

export interface UserStats {
  rating: number;
  ratings_count: number;
  completed_trips: number;
  cancellation_rate: number;
  no_show_rate: number;
  member_since: string;
}

export interface UserPublic {
  id: string;
  full_name: string;
  photo_url?: string | null;
  city: string;
  bio?: string | null;
  role: Role;
  preferred_travel_type?: string | null;
  college_or_company?: string | null;
  vehicle: VehicleInfo;
  verification: Verification;
  stats: UserStats;
  trust_level: string;
}

export interface UserProfile extends UserPublic {
  email: string;
  phone: string;
  blocked_user_ids: string[];
}

export interface Journey {
  id: string;
  host_id: string;
  host?: UserPublic | null;
  type: JourneyType;
  origin: GeoPoint;
  destination: GeoPoint;
  date?: string | null;
  departure_time: string;
  return_time?: string | null;
  return_date?: string | null;
  recurrence: Recurrence;
  days: string[];
  vehicle_type: VehicleType;
  available_seats: number;
  total_seats: number;
  estimated_cost_total?: number | null;
  budget?: number | null;
  trip_type?: TripType | null;
  group_current: number;
  group_capacity?: number | null;
  group_size?: number;
  distance_km: number;
  duration_min: number;
  suggested_checkpoint?: Checkpoint | null;
  solo_travel_cost: number;
  shared_travel_cost: number;
  per_person_cost: number;
  estimated_savings: number;
  status: JourneyStatus;
  notes?: string | null;
  created_at: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  type: CheckpointType;
  lat: number;
  lng: number;
  distance_from_requester_km: number;
  distance_from_host_km: number;
  detour_km: number;
  eta?: string | null;
  safety_score: number;
}

export interface MatchBreakdown {
  route: number;
  time: number;
  destination: number;
  checkpoint: number;
  reliability: number;
}

export interface PartnerResult {
  journey: Journey;
  partner: UserPublic;
  score: number;
  breakdown: MatchBreakdown;
  reasons: string[];
  route_overlap_pct: number;
  departure_diff_min: number;
  estimated_share: number;
  suggested_checkpoint?: Checkpoint | null;
  alternative_checkpoints: Checkpoint[];
}

export interface Match {
  id: string;
  requester_id: string;
  host_id: string;
  journey_id: string;
  partner?: UserPublic | null;
  score: number;
  breakdown: MatchBreakdown;
  reasons: string[];
  suggested_checkpoint?: Checkpoint | null;
  alternative_checkpoints: Checkpoint[];
  status: MatchStatus;
  created_at: string;
}

export interface Trip {
  id: string;
  journey_id: string;
  section: JourneyType;
  host_id: string;
  participant_ids: string[];
  participants: UserPublic[];
  origin: GeoPoint;
  destination: GeoPoint;
  date?: string | null;
  departure_time: string;
  meeting_point?: Checkpoint | null;
  cost_per_person: number;
  total_cost: number;
  solo_travel_cost: number;
  shared_travel_cost: number;
  per_person_cost: number;
  estimated_savings: number;
  distance_km: number;
  duration_min: number;
  status: TripStatus;
  created_at: string;
  conversation_id?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  kind: "text" | "system" | "status" | "location";
  created_at: string;
}

export interface Conversation {
  id: string;
  trip_id?: string | null;
  participant_ids: string[];
  participants: UserPublic[];
  last_message?: string | null;
  updated_at: string;
  unread: number;
}

export interface ConversationContact {
  user_id: string;
  full_name: string;
  phone?: string | null;
}

export interface Review {
  id: string;
  trip_id: string;
  reviewer_id: string;
  reviewer?: UserPublic | null;
  reviewee_id: string;
  rating: number;
  comment?: string | null;
  tags: string[];
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_user?: UserPublic | null;
  trip_id?: string | null;
  reason: string;
  details?: string | null;
  status: ReportStatus;
  admin_notes?: string | null;
  created_at: string;
}

export interface CostPreview {
  type?: JourneyType;
  origin?: GeoPoint;
  destination?: GeoPoint;
  distance_km: number;
  duration_min?: number;
  group_size?: number;
  suggested_checkpoint?: Checkpoint | null;
  solo_travel_cost: number;
  shared_travel_cost: number;
  per_person_cost: number;
  estimated_savings: number;
  // Legacy aliases kept because the backend exposes them on GET /preview/cost.
  total: number;
  per_person: number;
  split: { travelers: number; per_person: number }[];
  saving_per_trip: number;
  monthly: { legs_per_month: number; solo_cost: number; shared_cost: number; saving: number };
  co2_reduced_kg: number;
}

export interface JourneyCreateInput {
  type: JourneyType;
  origin: GeoPoint;
  destination: GeoPoint;
  date?: string | null;
  departure_time: string;
  return_time?: string | null;
  return_date?: string | null;
  recurrence: Recurrence;
  days: string[];
  vehicle_type: VehicleType;
  available_seats: number;
  total_seats: number;
  estimated_cost_total?: number | null;
  budget?: number | null;
  trip_type?: TripType | null;
  group_capacity?: number | null;
  group_size?: number;
  notes?: string | null;
}

export interface JourneyPreviewInput {
  type: JourneyType;
  origin: GeoPoint;
  destination: GeoPoint;
  departure_time: string;
  vehicle_type: VehicleType;
  recurrence: Recurrence;
  group_size: number;
  estimated_cost_total?: number | null;
}

export interface TripCost {
  trip_id: string;
  travelers: number;
  solo_travel_cost: number;
  shared_travel_cost: number;
  per_person_cost: number;
  estimated_savings: number;
}

export interface DashboardStats {
  money_saved_month: number;
  money_saved_total: number;
  shared_trips_month: number;
  shared_distance_km: number;
  co2_reduced_kg: number;
  travel_partners: number;
  average_rating: number;
  upcoming_trip?: Trip | null;
  next_match?: PartnerResult | null;
  monthly_trip_count: number;
}

export interface AdminStats {
  total_users: number;
  verified_users: number;
  active_journeys: number;
  completed_journeys: number;
  reported_users: number;
  pending_verification: number;
  total_shared_trips: number;
  money_saved_total: number;
}

export interface AssistantResult {
  understood: {
    type: JourneyType;
    departure_time: string;
    destination_hint?: string | null;
    notes: string[];
  };
  explanation: string;
  results: PartnerResult[];
}

export interface PartnerSearchQuery {
  type: JourneyType;
  origin: GeoPoint;
  destination: GeoPoint;
  date?: string | null;
  departure_time: string;
  seats_needed: number;
  budget?: number | null;
}
