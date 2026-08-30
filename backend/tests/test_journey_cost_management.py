"""Regression tests for Day 4 journey and cost-management behaviour."""
import asyncio
import unittest

from pydantic import ValidationError

from app.api.routes.auth import _default_user_doc
from app.api.routes.messages import get_partner_contact
from app.core.database import close_mongo_connection, connect_to_mongo, get_database
from app.db.seed import seed_if_empty
from app.main import app
from app.schemas.journey import JourneyCreate
from app.schemas.user import UserCreate
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


class ProfileVehicleTests(unittest.TestCase):
    def test_new_profile_can_store_a_car_and_passenger_seat_count(self):
        user = UserCreate.model_validate(
            {
                "full_name": "Driver One",
                "email": "driver@example.com",
                "phone": "+91 90000 12345",
                "password": "password123",
                "city": "New Delhi",
                "vehicle": {"type": "car", "seats": 4},
            }
        )

        self.assertEqual(user.vehicle.type.value, "car")
        self.assertEqual(user.vehicle.seats, 4)
        self.assertEqual(_default_user_doc(user)["vehicle"], {"type": "car", "model": None, "color": None, "seats": 4, "plate_hint": None})

    def test_no_vehicle_profile_keeps_zero_seats(self):
        user = UserCreate.model_validate(
            {
                "full_name": "Rider Two",
                "email": "rider@example.com",
                "phone": "+91 90000 67890",
                "password": "password123",
                "city": "Noida",
                "vehicle": {"type": "none", "seats": 5},
            }
        )

        self.assertEqual(user.vehicle.seats, 0)


class JourneyRouteTests(unittest.TestCase):
    def test_cost_preview_and_trip_cost_routes_are_registered(self):
        routes = {(route.path, tuple(sorted(route.methods or []))) for route in app.routes}

        self.assertIn(("/api/journeys/preview", ("POST",)), routes)
        self.assertIn(("/api/journeys/preview/cost", ("GET",)), routes)
        self.assertIn(("/api/trips/{trip_id}/cost", ("GET",)), routes)
        self.assertIn(("/api/conversations/{conversation_id}/contact", ("GET",)), routes)

    def test_confirmed_trip_participant_can_retrieve_partner_contact(self):
        async def check_contact():
            await connect_to_mongo()
            try:
                await seed_if_empty()
                me = await get_database().users.find_one({"_id": "u_kartik"})
                return await get_partner_contact("conv_1", me)
            finally:
                await close_mongo_connection()

        contact = asyncio.run(check_contact())
        self.assertEqual(contact["user_id"], "u_rahul")
        self.assertEqual(contact["phone"], "+91 90000 00003")
