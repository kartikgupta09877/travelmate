"""Optional AI Match Assistant.

Deliberately modular and rules-based so core matching never depends on it. It
parses a free-text request into a structured query, reuses the same scoring
engine, and produces a plain-language explanation of the top recommendation.
A real LLM can replace `parse_request` without touching the ranking logic.
"""
import re
from typing import List, Optional


def parse_request(text: str) -> dict:
    t = text.lower()
    times = re.findall(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", t)
    parsed_times = []
    for h, m, ap in times:
        try:
            hour = int(h)
        except ValueError:
            continue
        if ap == "pm" and hour < 12:
            hour += 12
        if ap == "am" and hour == 12:
            hour = 0
        if 0 <= hour <= 23:
            parsed_times.append(f"{hour:02d}:{int(m or 0):02d}")

    dest_hint = None
    for kw in ("college", "office", "university", "work", "metro", "station"):
        if kw in t:
            dest_hint = kw
            break

    return {
        "departure_time": parsed_times[0] if parsed_times else "08:00",
        "return_time": parsed_times[1] if len(parsed_times) > 1 else None,
        "destination_hint": dest_hint,
        "type": "long" if any(k in t for k in ("jaipur", "agra", "trip", "intercity", "weekend")) else "local",
    }


def explain(top: dict) -> str:
    if not top:
        return "I couldn't find a compatible partner yet. Try widening your time window or adding your journey so others can find you."
    name = top["partner"]["full_name"].split()[0]
    reasons = "; ".join(top["reasons"][:4]).lower()
    return (
        f"{name} is your best match at {top['score']}% compatibility. "
        f"Key reasons: {reasons}. Estimated share is around Rs {top['estimated_share']} per trip."
    )
