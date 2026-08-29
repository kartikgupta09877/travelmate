"""Realistic demo data so the whole UI works before any real data exists.

Idempotent: only seeds when the users collection is empty. Uses readable ids
to wire relationships. Demo login: demo@travelmate.app / password123
Admin login: admin@travelmate.app / password123
No fabricated payments; verification here is demo data, clearly labelled in-app.

Geography: a real Delhi Metro Blue Line corridor (West Delhi -> Connaught Place)
for local commutes, plus intercity long trips (Delhi -> Jaipur / Agra / Mathura).
"""
from datetime import datetime, timedelta, timezone

from app.core.database import get_database
from app.core.security import hash_password
from app.services import cost as cost_svc
from app.services.geo import haversine

NOW = datetime.now(timezone.utc)


def _months_ago(m: int) -> datetime:
    return NOW - timedelta(days=30 * m)


def _date_in(days: int) -> str:
    return (NOW + timedelta(days=days)).strftime("%Y-%m-%d")


def _pw() -> str:
    return hash_password("password123")


def _ver(email=False, phone=False, identity=False, college=False, vehicle=False):
    return {"email": email, "phone": phone, "identity": identity, "college": college, "vehicle": vehicle}


def _stats(rating, count, trips, cancel=0.0, noshow=0.0, since_m=8):
    return {
        "rating": rating, "ratings_count": count, "completed_trips": trips,
        "cancellation_rate": cancel, "no_show_rate": noshow, "member_since": _months_ago(since_m),
    }


def _user(uid, name, email, phone, city, ver, stats, role="user", vehicle=None, bio=None,
          college=None, photo=None, pref="both"):
    return {
        "_id": uid, "full_name": name, "email": email, "phone": phone,
        "hashed_password": _pw(), "city": city, "date_of_birth": "1999-05-14",
        "photo_url": photo, "bio": bio, "role": role, "preferred_travel_type": pref,
        "college_or_company": college, "vehicle": vehicle or {"type": "none", "seats": 0},
        "verification": ver, "verification_pending": {}, "verification_codes": {},
        "stats": stats, "blocked_user_ids": [], "suspended": False,
        "created_at": stats["member_since"], "updated_at": NOW,
    }


def _car(model, seats, color="White", plate="DL ** ** 4321"):
    return {"type": "car", "model": model, "color": color, "seats": seats, "plate_hint": plate}


def _bike(model, plate="DL ** ** 7788"):
    return {"type": "bike", "model": model, "color": "Black", "seats": 1, "plate_hint": plate}


USERS = [
    _user("u_kartik", "Kartik Gupta", "demo@travelmate.app", "+91 90000 00001", "New Delhi",
          _ver(True, True, True, True, True), _stats(4.8, 40, 42, 0.02, 0.0, 14),
          vehicle=_car("Maruti Baleno", 3), college="Delhi Technological University",
          bio="Commute from Tagore Garden to Connaught Place every morning. Prefer quiet rides and splitting fuel fairly."),
    _user("u_admin", "Priya Nair", "admin@travelmate.app", "+91 90000 00002", "New Delhi",
          _ver(True, True, True, False, False), _stats(4.9, 12, 15, 0.0, 0.0, 20),
          role="admin", bio="Trust & safety team."),
    _user("u_rahul", "Rahul Sharma", "rahul@travelmate.app", "+91 90000 00003", "New Delhi",
          _ver(True, True, True, True, True), _stats(4.8, 55, 61, 0.02, 0.01, 16),
          vehicle=_car("Hyundai Creta", 3, "Grey"), college="IIT Delhi",
          bio="Analyst in central Delhi. Daily commuter, very punctual."),
    _user("u_sneha", "Sneha Verma", "sneha@travelmate.app", "+91 90000 00004", "New Delhi",
          _ver(True, True, True, True, False), _stats(4.7, 33, 38, 0.03, 0.0, 10),
          vehicle=_car("Tata Nexon", 3, "Blue"), college="Delhi University",
          bio="Happy to share my morning drive towards CP."),
    _user("u_ananya", "Ananya Singh", "ananya@travelmate.app", "+91 90000 00005", "New Delhi",
          _ver(True, True, True, False, True), _stats(4.6, 21, 24, 0.04, 0.0, 7),
          vehicle=_car("Honda City", 3, "Silver")),
    _user("u_aditya", "Aditya Kumar", "aditya@travelmate.app", "+91 90000 00006", "New Delhi",
          _ver(True, True, False, True, True), _stats(4.4, 14, 17, 0.06, 0.02, 6),
          vehicle=_bike("Royal Enfield Classic 350"), college="NSUT",
          bio="Two-wheeler commuter. Can share for the metro-corridor stretch."),
    _user("u_mohit", "Mohit Gupta", "mohit@travelmate.app", "+91 90000 00007", "Gurugram",
          _ver(True, True, True, False, True), _stats(4.7, 40, 45, 0.03, 0.0, 12),
          vehicle=_car("Kia Seltos", 3, "White"), bio="Cyber Hub office commute, Mon-Fri."),
    _user("u_ishita", "Ishita Rao", "ishita@travelmate.app", "+91 90000 00008", "Noida",
          _ver(True, True, True, True, True), _stats(4.9, 60, 66, 0.01, 0.0, 18),
          vehicle=_car("Toyota Innova", 6, "Grey"), bio="Weekend intercity trips to Mathura & Agra."),
    _user("u_vikram", "Vikram Nair", "vikram@travelmate.app", "+91 90000 00009", "New Delhi",
          _ver(True, True, True, False, True), _stats(4.5, 28, 31, 0.05, 0.01, 9),
          vehicle=_car("Mahindra XUV700", 6, "Black"), bio="Road-trip enthusiast. Delhi-Agra-Jaipur regular."),
    _user("u_neha", "Neha Kapoor", "neha@travelmate.app", "+91 90000 00010", "New Delhi",
          _ver(True, True, False, False, False), _stats(4.2, 6, 7, 0.08, 0.03, 3),
          bio="New here - looking for a reliable morning carpool."),
]

# Delhi Metro Blue Line corridor + key hubs (lat, lng, safety 0-1)
CHECKPOINTS = [
    ("cp_janakpuri", "Janakpuri West Metro", "metro", 28.6292, 77.0782, 0.93),
    ("cp_tilaknagar", "Tilak Nagar Metro", "metro", 28.6367, 77.0975, 0.92),
    ("cp_subhashnagar", "Subhash Nagar Metro", "metro", 28.6400, 77.1150, 0.91),
    ("cp_rajourigarden", "Rajouri Garden Metro", "metro", 28.6492, 77.1219, 0.94),
    ("cp_kirtinagar", "Kirti Nagar Metro", "metro", 28.6552, 77.1512, 0.9),
    ("cp_rajendraplace", "Rajendra Place Metro", "metro", 28.6425, 77.1785, 0.92),
    ("cp_karolbagh", "Karol Bagh Metro", "metro", 28.6443, 77.1904, 0.93),
    ("cp_rajivchowk", "Rajiv Chowk Metro", "metro", 28.6328, 77.2197, 0.9),
    ("cp_westgatemall", "West Gate Mall, Rajouri Garden", "mall", 28.6455, 77.1230, 0.93),
    ("cp_ringroad_pp", "HP Petrol Pump, Ring Road", "petrol_pump", 28.6410, 77.1330, 0.86),
    ("cp_dwarka21", "Dwarka Sector 21 Metro", "metro", 28.5522, 77.0586, 0.92),
    ("cp_kashmeregate", "Kashmere Gate ISBT", "bus_stop", 28.6675, 77.2281, 0.88),
]

CP = {"label": "Connaught Place", "lat": 28.6304, "lng": 77.2177, "zone": "Connaught Place"}


def _geo(label, lat, lng, zone=None):
    return {"label": label, "lat": lat, "lng": lng, "zone": zone}


def _journey(jid, host, jtype, origin, dest, dep, veh, seats, recurrence="weekdays",
             days=None, ret=None, date=None, budget=None, trip_type=None, capacity=None,
             notes=None, status="open"):
    dist = round(haversine((origin["lat"], origin["lng"]), (dest["lat"], dest["lng"])), 1)
    speed = 22.0 if dist <= 30 else 50.0
    dur = int(dist / speed * 60)
    total = cost_svc.estimate_trip_cost(dist, veh)
    return {
        "_id": jid, "host_id": host, "type": jtype, "origin": origin, "destination": dest,
        "date": date, "departure_time": dep, "return_time": ret, "return_date": None,
        "recurrence": recurrence,
        "days": days or (["Mon", "Tue", "Wed", "Thu", "Fri"] if recurrence == "weekdays" else []),
        "vehicle_type": veh, "available_seats": seats, "total_seats": seats,
        "estimated_cost_total": total, "budget": budget, "trip_type": trip_type,
        "group_current": 1, "group_capacity": capacity or (1 + seats),
        "distance_km": dist, "duration_min": dur, "status": status, "notes": notes,
        "created_at": NOW - timedelta(days=2),
    }


JOURNEYS = [
    # Local cluster: West Delhi -> Connaught Place ~08:00 (strong matches for the demo user)
    _journey("j_kartik_local", "u_kartik", "local", _geo("Tagore Garden", 28.6360, 77.1000, "Tagore Garden"), CP, "08:00", "car", 3),
    _journey("j_rahul_local", "u_rahul", "local", _geo("Subhash Nagar", 28.6395, 77.1140, "Subhash Nagar"), CP, "08:10", "car", 2, notes="AC on, one quick chai stop allowed."),
    _journey("j_sneha_local", "u_sneha", "local", _geo("Tilak Nagar", 28.6410, 77.0950, "Tilak Nagar"), CP, "08:05", "car", 3),
    _journey("j_ananya_local", "u_ananya", "local", _geo("Rajouri Garden", 28.6455, 77.1230, "Rajouri Garden"), CP, "08:00", "car", 2, recurrence="daily"),
    _journey("j_aditya_local", "u_aditya", "local", _geo("Janakpuri", 28.6290, 77.0800, "Janakpuri"), CP, "08:15", "bike", 1, recurrence="daily"),
    # Office cluster to Cyber Hub Gurugram ~09:00
    _journey("j_mohit_office", "u_mohit", "local", _geo("Dwarka", 28.5921, 77.0460, "Dwarka"), _geo("Cyber Hub, Gurugram", 28.4949, 77.0895, "Cyber Hub"), "09:00", "car", 3),
    # Long / intercity trips
    _journey("j_rahul_jaipur", "u_rahul", "long", _geo("Connaught Place", 28.6304, 77.2177, "CP"), _geo("Jaipur", 26.9124, 75.7873), "06:30", "car", 3, recurrence="round_trip", date=_date_in(6), budget=1000, trip_type="looking", capacity=4, notes="Weekend trip, splitting fuel + tolls."),
    _journey("j_vikram_agra", "u_vikram", "long", _geo("Connaught Place", 28.6304, 77.2177, "CP"), _geo("Agra", 27.1767, 78.0081), "06:00", "car", 4, recurrence="round_trip", date=_date_in(9), budget=800, trip_type="group", capacity=5),
    _journey("j_ishita_mathura", "u_ishita", "long", _geo("Noida Sec 18", 28.5708, 77.3260, "Noida"), _geo("Mathura", 27.4924, 77.6737), "07:30", "car", 3, recurrence="round_trip", date=_date_in(12), budget=700, trip_type="looking", capacity=4),
]


async def seed_if_empty() -> bool:
    db = get_database()
    if await db.users.count_documents({}) > 0:
        return False

    await db.users.insert_many(USERS)
    await db.checkpoints.insert_many(
        [{"_id": c[0], "name": c[1], "type": c[2], "lat": c[3], "lng": c[4], "city": "Delhi NCR", "safety_score": c[5]} for c in CHECKPOINTS]
    )
    await db.journeys.insert_many(JOURNEYS)

    conv_id = "conv_1"
    trip1 = {
        "_id": "trip_1", "journey_id": "j_rahul_local", "section": "local", "host_id": "u_rahul",
        "participant_ids": ["u_rahul", "u_kartik"],
        "origin": _geo("Tilak Nagar", 28.6410, 77.0940, "Tilak Nagar"), "destination": CP,
        "date": _date_in(1), "departure_time": "08:10",
        "meeting_point": {"id": "cp_tilaknagar", "name": "Tilak Nagar Metro", "type": "metro",
                          "lat": 28.6367, "lng": 77.0975, "distance_from_requester_km": 1.3,
                          "distance_from_host_km": 0.5, "detour_km": 0.4, "eta": "08:16", "safety_score": 0.92},
        "cost_per_person": 61, "total_cost": 122, "distance_km": 12.7, "duration_min": 34,
        "status": "confirmed", "conversation_id": conv_id, "created_at": NOW - timedelta(days=1),
    }
    trip2 = {
        "_id": "trip_2", "journey_id": "j_ishita_mathura", "section": "long", "host_id": "u_ishita",
        "participant_ids": ["u_ishita", "u_kartik"],
        "origin": _geo("Noida Sec 18", 28.5708, 77.3260, "Noida"), "destination": _geo("Mathura", 27.4924, 77.6737),
        "date": _date_in(-10), "departure_time": "07:30",
        "meeting_point": {"id": "cp_dnd", "name": "DND Toll Plaza", "type": "intersection",
                          "lat": 28.5730, "lng": 77.3010, "distance_from_requester_km": 1.1,
                          "distance_from_host_km": 0.8, "detour_km": 0.4, "eta": "07:40", "safety_score": 0.9},
        "cost_per_person": 233, "total_cost": 700, "distance_km": 47.0, "duration_min": 70,
        "status": "completed", "conversation_id": "conv_2", "created_at": NOW - timedelta(days=11),
    }
    await db.trips.insert_many([trip1, trip2])

    await db.conversations.insert_many([
        {"_id": conv_id, "trip_id": "trip_1", "participant_ids": ["u_rahul", "u_kartik"],
         "last_message": "Great, see you at Tilak Nagar Metro at 8:16!", "updated_at": NOW - timedelta(hours=3)},
        {"_id": "conv_2", "trip_id": "trip_2", "participant_ids": ["u_ishita", "u_kartik"],
         "last_message": "Thanks for the ride, it was smooth!", "updated_at": NOW - timedelta(days=10)},
    ])
    await db.messages.insert_many([
        {"_id": "m1", "conversation_id": conv_id, "sender_id": "system",
         "text": "Match confirmed. Meeting point and departure time are now shared with both travellers.",
         "kind": "system", "created_at": NOW - timedelta(hours=6)},
        {"_id": "m2", "conversation_id": conv_id, "sender_id": "u_rahul",
         "text": "Hi Kartik! I can pick you up near Tilak Nagar Metro. That work?", "kind": "text",
         "created_at": NOW - timedelta(hours=5)},
        {"_id": "m3", "conversation_id": conv_id, "sender_id": "u_kartik",
         "text": "Perfect, that's a short hop for me.", "kind": "text", "created_at": NOW - timedelta(hours=4)},
        {"_id": "m4", "conversation_id": conv_id, "sender_id": "u_rahul",
         "text": "Great, see you at Tilak Nagar Metro at 8:16!", "kind": "text", "created_at": NOW - timedelta(hours=3)},
    ])
    await db.reviews.insert_many([
        {"_id": "r1", "trip_id": "trip_2", "reviewer_id": "u_ishita", "reviewee_id": "u_kartik",
         "rating": 5, "comment": "Punctual and friendly co-traveller. Split costs fairly.",
         "tags": ["Punctual", "Friendly"], "created_at": NOW - timedelta(days=10)},
        {"_id": "r2", "trip_id": "trip_2", "reviewer_id": "u_kartik", "reviewee_id": "u_ishita",
         "rating": 5, "comment": "Very safe driver, great conversation.", "tags": ["Safe driver", "Great chat"],
         "created_at": NOW - timedelta(days=10)},
        {"_id": "r3", "trip_id": "trip_1", "reviewer_id": "u_sneha", "reviewee_id": "u_rahul",
         "rating": 5, "comment": "Reliable and on time every day.", "tags": ["Punctual"],
         "created_at": NOW - timedelta(days=20)},
    ])
    await db.reports.insert_many([
        {"_id": "rep_1", "reporter_id": "u_sneha", "reported_user_id": "u_neha", "trip_id": None,
         "reason": "No-show", "details": "Did not arrive at the agreed checkpoint and did not respond.",
         "status": "open", "admin_notes": None, "created_at": NOW - timedelta(days=1)},
    ])
    return True
