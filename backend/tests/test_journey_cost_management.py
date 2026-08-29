"""Regression tests for Day 4 journey and cost-management behaviour."""
import unittest

from pydantic import ValidationError

from app.main import app
from app.schemas.journey import JourneyCreate
from app.services.checkpoint import suggest_route_checkpoints
from app.services.cost import cost_breakdown
from app.services.geo import route_estimate


class CostManagementTests(unittest.TestCase):
    def test_cost_breakdown_splits_one_shared_vehicle_cost(self):
        costs = cost_breakdown(10, "car", travelers=4)

        self.assertEqual(costs["solo_travel_cost"], 100)
        self.assertEqual(costs["shared_travel_cost"], 100)
        self.assertEqual(costs["per_person_cost"], 25)
        self.assertEqual(costs["estimated_savings"], 75)

    def test_host_estimate_is_used_for_the_transparent_split(self):
        costs = cost_breakdown(10, "car", travelers=3, total_cost=360)

        self.assertEqual(costs["solo_travel_cost"], 360)
        self.assertEqual(costs["per_person_cost"], 120)
        self.assertEqual(costs["estimated_savings"], 240)

    def test_route_estimate_uses_geo_distance_and_local_speed(self):
        distance_km, duration_min = route_estimate((28.6304, 77.2177), (28.6328, 77.2197))

        self.assertGreater(distance_km, 0)
        self.assertGreaterEqual(duration_min, 0)

    def test_local_route_gets_a_public_checkpoint_near_its_start(self):
        catalog = [
            {
                "_id": "metro_1",
                "name": "Example Metro",
                "type": "metro",
                "lat": 28.638,
                "lng": 77.218,
                "safety_score": 0.95,
            }
        ]

        suggestions = suggest_route_checkpoints(
            (28.6304, 77.2177), (28.65, 77.24), catalog, departure_time="08:00"
        )

        self.assertEqual(suggestions[0]["id"], "metro_1")
        self.assertEqual(suggestions[0]["eta"], "08:02")


class JourneySchemaTests(unittest.TestCase):
    def test_seats_required_alias_maps_to_group_size(self):
        journey = JourneyCreate.model_validate(
            {
                "type": "local",
                "origin": {"label": "A", "lat": 28.63, "lng": 77.21},
                "destination": {"label": "B", "lat": 28.64, "lng": 77.22},
                "departure_time": "08:30",
                "seats_required": 2,
                "available_seats": 2,
            }
        )

        self.assertEqual(journey.group_size, 2)

    def test_long_journey_requires_an_iso_travel_date(self):
        with self.assertRaises(ValidationError):
            JourneyCreate.model_validate(
                {
                    "type": "long",
                    "origin": {"label": "A", "lat": 28.63, "lng": 77.21},
                    "destination": {"label": "B", "lat": 26.91, "lng": 75.78},
                    "departure_time": "06:30",
                }
            )


class JourneyRouteTests(unittest.TestCase):
    def test_cost_preview_and_trip_cost_routes_are_registered(self):
        routes = {(route.path, tuple(sorted(route.methods or []))) for route in app.routes}

        self.assertIn(("/api/journeys/preview", ("POST",)), routes)
        self.assertIn(("/api/journeys/preview/cost", ("GET",)), routes)
        self.assertIn(("/api/trips/{trip_id}/cost", ("GET",)), routes)
