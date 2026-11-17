import math
from typing import Optional, Tuple
import httpx
from app.core.config import settings


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two GPS coordinates in meters using Haversine formula."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def verify_geofence(
    user_lat: float,
    user_lon: float,
    branch_lat: float,
    branch_lon: float,
    radius_meters: int
) -> Tuple[bool, float]:
    """Verify if user coordinate falls within the branch radius."""
    distance = calculate_haversine_distance(user_lat, user_lon, branch_lat, branch_lon)
    is_inside = distance <= radius_meters
    return is_inside, round(distance, 2)


async def reverse_geocode_geoapify(lat: float, lon: float) -> Optional[str]:
    """Lookup address using Geoapify Reverse Geocoding API."""
    if not settings.GEOAPIFY_API_KEY:
        return None

    url = f"https://api.geoapify.com/v1/geocode/reverse?lat={lat}&lon={lon}&apiKey={settings.GEOAPIFY_API_KEY}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                if features:
                    return features[0].get("properties", {}).get("formatted")
    except Exception as e:
        print(f"[GEOAPIFY] Reverse geocode error: {e}")

    return None
