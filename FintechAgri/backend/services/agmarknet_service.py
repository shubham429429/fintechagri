"""Agmarknet API wrapper — fetches market data from government API with mock fallback.

The real Agmarknet API (https://agmarknet.gov.in/) requires credentials.
This service provides a wrapper with retry logic and falls back to generating
realistic mock data when the API is unavailable.
"""

import random
from datetime import date, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from models.market import MarketPrice


# ── Configuration ────────────────────────────────────────────────────────────

AGMARKNET_BASE_URL = "https://agmarknet.gov.in/api"  # Placeholder
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2

# Mock data configuration
MOCK_MANDIS = {
    "Lasalgaon": "Maharashtra",
    "Azadpur": "Delhi",
    "Vashi": "Maharashtra",
    "Pune": "Maharashtra",
    "Nashik": "Maharashtra",
}

MOCK_CROPS = {
    "Onion": {"base_price": 2200, "volatility": 0.08, "base_arrivals": 450},
    "Tomato": {"base_price": 3500, "volatility": 0.12, "base_arrivals": 300},
    "Potato": {"base_price": 1800, "volatility": 0.05, "base_arrivals": 500},
    "Cauliflower": {"base_price": 2800, "volatility": 0.10, "base_arrivals": 200},
    "Cabbage": {"base_price": 1500, "volatility": 0.07, "base_arrivals": 250},
    "Green Chilli": {"base_price": 4500, "volatility": 0.15, "base_arrivals": 150},
}


class AgmarknetClient:
    """Client for fetching market data from Agmarknet."""

    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock
        self.client = httpx.AsyncClient(timeout=30.0)

    async def fetch_daily_prices(
        self,
        state: str,
        commodity: str,
        target_date: Optional[date] = None,
    ) -> list[dict]:
        """Fetch daily prices from Agmarknet API.

        Falls back to mock data if API unavailable.
        """
        if self.use_mock:
            return self._generate_mock_data(state, commodity, target_date or date.today())

        # Real API call with retry
        for attempt in range(MAX_RETRIES):
            try:
                response = await self.client.get(
                    f"{AGMARKNET_BASE_URL}/prices",
                    params={
                        "state": state,
                        "commodity": commodity,
                        "date": (target_date or date.today()).isoformat(),
                    },
                )
                response.raise_for_status()
                return self._parse_response(response.json())
            except (httpx.HTTPError, httpx.TimeoutException) as e:
                if attempt == MAX_RETRIES - 1:
                    # Fall back to mock
                    return self._generate_mock_data(state, commodity, target_date or date.today())

        return []

    def _parse_response(self, raw_data: dict) -> list[dict]:
        """Normalize API response to canonical schema."""
        records = raw_data.get("records", [])
        normalized = []
        for record in records:
            normalized.append({
                "mandi": record.get("market", ""),
                "crop": record.get("commodity", ""),
                "state": record.get("state", ""),
                "price_min": float(record.get("min_price", 0)),
                "price_max": float(record.get("max_price", 0)),
                "price_modal": float(record.get("modal_price", 0)),
                "arrivals": float(record.get("arrivals", 0)),
                "date": record.get("arrival_date", ""),
            })
        return normalized

    def _generate_mock_data(self, state: str, commodity: str, target_date: date) -> list[dict]:
        """Generate realistic mock market data."""
        crop_config = MOCK_CROPS.get(commodity, {"base_price": 2500, "volatility": 0.10, "base_arrivals": 300})

        results = []
        for mandi, mandi_state in MOCK_MANDIS.items():
            base = crop_config["base_price"]
            vol = crop_config["volatility"]

            # Add day-of-week seasonality
            dow_factor = 1.0 + 0.02 * (target_date.weekday() - 3)

            price_modal = base * (1 + random.gauss(0, vol) + dow_factor * 0.01)
            price_min = price_modal * (1 - random.uniform(0.05, 0.12))
            price_max = price_modal * (1 + random.uniform(0.05, 0.12))
            arrivals = crop_config["base_arrivals"] * (1 + random.gauss(0, 0.2))

            results.append({
                "mandi": mandi,
                "crop": commodity,
                "state": mandi_state,
                "price_min": round(price_min, 2),
                "price_max": round(price_max, 2),
                "price_modal": round(price_modal, 2),
                "arrivals": round(max(0, arrivals), 1),
                "date": target_date.isoformat(),
            })

        return results


def sync_market_data(db: Session, days: int = 1) -> int:
    """Synchronously generate and store market data for the last `days` days.

    Uses mock data generator. Returns count of records inserted.
    """
    count = 0
    today = date.today()

    for d in range(days):
        target_date = today - timedelta(days=d)

        for crop_name, config in MOCK_CROPS.items():
            for mandi_name, state in MOCK_MANDIS.items():
                # Check if data already exists
                existing = (
                    db.query(MarketPrice)
                    .filter(
                        MarketPrice.mandi == mandi_name,
                        MarketPrice.crop == crop_name,
                        MarketPrice.date == target_date,
                    )
                    .first()
                )
                if existing:
                    continue

                base = config["base_price"]
                vol = config["volatility"]
                dow_factor = 1.0 + 0.02 * (target_date.weekday() - 3)

                price_modal = base * (1 + random.gauss(0, vol) + dow_factor * 0.01)
                price_min = price_modal * (1 - random.uniform(0.05, 0.12))
                price_max = price_modal * (1 + random.uniform(0.05, 0.12))
                price_open = price_modal * (1 + random.gauss(0, 0.02))
                price_close = price_modal * (1 + random.gauss(0, 0.02))
                arrivals = config["base_arrivals"] * (1 + random.gauss(0, 0.2))

                record = MarketPrice(
                    mandi=mandi_name,
                    crop=crop_name,
                    price_open=round(price_open, 2),
                    price_close=round(price_close, 2),
                    price_min=round(price_min, 2),
                    price_max=round(price_max, 2),
                    arrivals_quintals=round(max(0, arrivals), 1),
                    date=target_date,
                    state=state,
                )
                db.add(record)
                count += 1

    db.commit()
    return count
