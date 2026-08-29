"""Lightweight geo math. No external routing dependency so the app runs anywhere.

Routes are approximated as straight corridors between origin and destination,
which is sufficient for demo-grade overlap/proximity scoring. The interface is
kept small so a real routing/geocoding provider (OSRM, Google, Mapbox) can be
dropped in behind these functions later.
"""
import math
from typing import List, Tuple

Point = Tuple[float, float]  # (lat, lng)

EARTH_KM = 6371.0


def haversine(a: Point, b: Point) -> float:
    """Great-circle distance in km between two (lat, lng) points."""
    lat1, lng1 = a
    lat2, lng2 = b
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    h = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_KM * math.asin(min(1.0, math.sqrt(h)))


def route_estimate(origin: Point, destination: Point) -> tuple[float, int]:
    """Return the demo route distance and travel duration.

    TravelMate deliberately has no routing-provider dependency yet, so this is
    a straight-line corridor estimate.  Keeping the approximation here means
    journey creation, previews, and future routing-provider integrations use
    one definition of distance and duration.
    """
    distance_km = round(haversine(origin, destination), 1)
    # Effective city/intercity speeds, including normal stops and traffic.
    speed_kmh = 22.0 if distance_km <= 30 else 50.0
    duration_min = int(distance_km / speed_kmh * 60)
    return distance_km, duration_min


def bearing(a: Point, b: Point) -> float:
    """Initial bearing from a to b in degrees (0-360)."""
    lat1, lng1 = math.radians(a[0]), math.radians(a[1])
    lat2, lng2 = math.radians(b[0]), math.radians(b[1])
    dl = lng2 - lng1
    x = math.sin(dl) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dl)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def bearing_alignment(a_orig: Point, a_dest: Point, b_orig: Point, b_dest: Point) -> float:
    """0-100: how aligned two travel directions are (100 = identical heading)."""
    diff = abs(bearing(a_orig, a_dest) - bearing(b_orig, b_dest)) % 360
    if diff > 180:
        diff = 360 - diff
    return max(0.0, 100.0 * (1 - diff / 90.0))  # 0 by the time headings are 90 deg apart


def _sample(a: Point, b: Point, n: int = 24) -> List[Point]:
    return [
        (a[0] + (b[0] - a[0]) * i / (n - 1), a[1] + (b[1] - a[1]) * i / (n - 1))
        for i in range(n)
    ]


def _point_to_segment_km(p: Point, a: Point, b: Point) -> float:
    """Approximate distance (km) from point p to segment a-b using a local
    equirectangular projection (fine for city-scale distances)."""
    lat0 = math.radians((a[0] + b[0]) / 2)
    kx = EARTH_KM * math.pi / 180 * math.cos(lat0)
    ky = EARTH_KM * math.pi / 180

    def to_xy(pt: Point) -> Point:
        return (pt[1] * kx, pt[0] * ky)

    px, py = to_xy(p)
    ax, ay = to_xy(a)
    bx, by = to_xy(b)
    dx, dy = bx - ax, by - ay
    seg_len2 = dx * dx + dy * dy
    if seg_len2 == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / seg_len2))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy)


def corridor_overlap_pct(
    a_orig: Point, a_dest: Point, b_orig: Point, b_dest: Point, buffer_km: float
) -> float:
    """Fraction (0-100) of route A that runs within buffer_km of route B."""
    pts = _sample(a_orig, a_dest)
    inside = sum(1 for p in pts if _point_to_segment_km(p, b_orig, b_dest) <= buffer_km)
    return 100.0 * inside / len(pts)
