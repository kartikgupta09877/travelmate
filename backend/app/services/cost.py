"""Cost-sharing, savings and CO2 estimation.

These are transparent *estimates* for planning only, not charged fares.
Rates are configurable so a real pricing/settlement service can replace them.
"""
# Approximate running cost per km (fuel + wear), INR.
RATE_PER_KM = {"car": 8.0, "bike": 3.2, "other": 6.0, "none": 6.0}
BASE_COST = 20.0  # nominal fixed component per trip
# Tailpipe CO2 per km for a typical petrol car (kg). Bikes emit less.
CO2_PER_KM = {"car": 0.135, "bike": 0.065, "other": 0.11, "none": 0.11}

# Rough number of one-way legs per month by recurrence pattern.
LEGS_PER_MONTH = {
    "daily": 60,       # ~30 days, 2 legs
    "weekdays": 44,    # ~22 weekdays, 2 legs
    "selected": 24,
    "one_time": 1,
    "one_way": 1,
    "round_trip": 2,
    "multi_day": 2,
}


def estimate_trip_cost(distance_km: float, vehicle_type: str = "car") -> float:
    rate = RATE_PER_KM.get(vehicle_type, RATE_PER_KM["car"])
    return round(BASE_COST + distance_km * rate)


def per_person(total: float, travelers: int) -> float:
    travelers = max(1, travelers)
    return round(total / travelers)


def split_table(total: float, max_travelers: int = 4) -> list[dict]:
    """Per-person cost by group size, as a list the frontend can map over."""
    return [
        {"travelers": n, "per_person": per_person(total, n)}
        for n in range(2, max_travelers + 1)
    ]


def saving_per_trip(total: float, travelers: int) -> float:
    """What each traveller saves vs. paying the whole trip alone."""
    return round(total - per_person(total, travelers))


def monthly_projection(total_per_trip: float, travelers: int, recurrence: str) -> dict:
    legs = LEGS_PER_MONTH.get(recurrence, 1)
    solo = round(total_per_trip * legs)
    shared = round(per_person(total_per_trip, travelers) * legs)
    return {
        "legs_per_month": legs,
        "solo_cost": solo,
        "shared_cost": shared,
        "saving": solo - shared,
    }


def co2_reduced_kg(distance_km: float, travelers: int, vehicle_type: str = "car") -> float:
    """CO2 avoided by sharing one vehicle instead of each travelling separately."""
    factor = CO2_PER_KM.get(vehicle_type, CO2_PER_KM["car"])
    avoided_vehicles = max(0, travelers - 1)
    return round(distance_km * factor * avoided_vehicles, 2)
