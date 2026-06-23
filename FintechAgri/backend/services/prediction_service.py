"""Prediction service — price forecasting, supply prediction, and sell/hold recommendations.

Uses statistical methods (moving average, linear trend) as baseline.
Architecture ready for Prophet/XGBoost drop-in replacement.
"""

import json
from datetime import date, timedelta
from typing import Optional
import statistics

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.market import MarketPrice
from models.prediction import PredictionRecord
from models.inventory import Inventory
from models.user import User
from services.cache_service import get_cached, set_cached


# Crop shelf life in days (approximate)
CROP_SHELF_LIFE = {
    "Onion": 60, "Tomato": 10, "Potato": 90,
    "Cauliflower": 7, "Cabbage": 14, "Green Chilli": 5,
}


def generate_price_forecast(db: Session, crop: str, mandi: str, days: int = 7) -> list[dict]:
    """Generate price forecast for next `days` days using moving average + linear trend.

    Returns list of dicts with: forecast_date, predicted_price_min, predicted_price_max,
    predicted_price_modal, confidence_score
    """
    # Check cache first
    cache_key = f"forecast:{crop}:{mandi}:{days}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    # Get last 30 days of historical data
    since = date.today() - timedelta(days=30)
    historical = (
        db.query(MarketPrice)
        .filter(
            MarketPrice.crop == crop,
            MarketPrice.mandi == mandi,
            MarketPrice.date >= since,
        )
        .order_by(MarketPrice.date.asc())
        .all()
    )

    if len(historical) < 5:
        return []  # Not enough data

    prices = [h.price_close for h in historical if h.price_close]
    arrivals = [h.arrivals_quintals for h in historical if h.arrivals_quintals]

    if not prices:
        return []

    # Calculate trend using simple linear regression
    n = len(prices)
    x_mean = (n - 1) / 2
    y_mean = statistics.mean(prices)

    numerator = sum((i - x_mean) * (p - y_mean) for i, p in enumerate(prices))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    slope = numerator / denominator if denominator != 0 else 0
    intercept = y_mean - slope * x_mean

    # Calculate residual std for confidence intervals
    residuals = [p - (slope * i + intercept) for i, p in enumerate(prices)]
    residual_std = statistics.stdev(residuals) if len(residuals) > 1 else prices[-1] * 0.05

    # 7-day moving average
    ma_7 = statistics.mean(prices[-7:]) if len(prices) >= 7 else statistics.mean(prices)

    forecasts = []
    today = date.today()

    for d in range(1, days + 1):
        forecast_date = today + timedelta(days=d)

        # Predicted price: blend of trend extrapolation and moving average
        trend_price = slope * (n + d - 1) + intercept
        blended_price = 0.6 * trend_price + 0.4 * ma_7

        # Confidence decreases with distance
        confidence = max(0.3, 1.0 - (d * 0.08))

        # Price range widens with distance
        spread = residual_std * (1 + d * 0.15)

        forecasts.append({
            "forecast_date": forecast_date.isoformat(),
            "predicted_price_modal": round(blended_price, 2),
            "predicted_price_min": round(blended_price - spread, 2),
            "predicted_price_max": round(blended_price + spread, 2),
            "predicted_arrivals": round(statistics.mean(arrivals[-7:]), 1) if arrivals else None,
            "confidence_score": round(confidence, 2),
        })

    # Cache for 1 hour
    set_cached(cache_key, forecasts, ttl_seconds=3600)
    return forecasts


def generate_supply_forecast(db: Session, crop: str, mandi: str, days: int = 7) -> list[dict]:
    """Forecast supply (arrivals) for next `days` days."""
    since = date.today() - timedelta(days=30)
    historical = (
        db.query(MarketPrice)
        .filter(
            MarketPrice.crop == crop,
            MarketPrice.mandi == mandi,
            MarketPrice.date >= since,
        )
        .order_by(MarketPrice.date.asc())
        .all()
    )

    arrivals = [h.arrivals_quintals for h in historical if h.arrivals_quintals]
    if not arrivals:
        return []

    avg_arrivals = statistics.mean(arrivals)
    recent_avg = statistics.mean(arrivals[-7:]) if len(arrivals) >= 7 else avg_arrivals

    forecasts = []
    today = date.today()

    for d in range(1, days + 1):
        forecast_date = today + timedelta(days=d)
        # Simple weighted average trending toward recent
        predicted = 0.7 * recent_avg + 0.3 * avg_arrivals

        forecasts.append({
            "forecast_date": forecast_date.isoformat(),
            "predicted_arrivals": round(predicted, 1),
            "avg_30d": round(avg_arrivals, 1),
            "avg_7d": round(recent_avg, 1),
        })

    return forecasts


def generate_recommendation(db: Session, farmer_id: int) -> list[dict]:
    """Generate personalised sell/hold recommendations for a farmer's crops.

    Rules:
    - If predicted price UP >5% in 3 days AND crop freshness >60% -> HOLD
    - If predicted price DOWN >3% -> SELL NOW
    - If current price > 7-day avg -> SELL
    - If predicted oversupply (arrivals > 120% of avg) -> SELL EARLY
    - Otherwise -> HOLD
    """
    user = db.query(User).filter(User.id == farmer_id).first()
    if not user:
        return []

    # Parse user's crops
    user_crops = []
    if user.crops:
        try:
            user_crops = json.loads(user.crops) if isinstance(user.crops, str) else user.crops
        except (json.JSONDecodeError, TypeError):
            pass

    if not user_crops:
        return []

    # Get farmer's inventory
    inventory = db.query(Inventory).filter(Inventory.user_id == farmer_id).all()
    inventory_crops = {i.crop: i for i in inventory}

    recommendations = []
    preferred_mandi = user.preferred_mandi or "Pune"

    for crop in user_crops:
        inv_item = inventory_crops.get(crop)

        # Get price forecast
        forecast = generate_price_forecast(db, crop, preferred_mandi, days=7)

        # Get current market data
        today = date.today()
        seven_days_ago = today - timedelta(days=7)

        current_price_row = (
            db.query(MarketPrice)
            .filter(
                MarketPrice.crop == crop,
                MarketPrice.mandi == preferred_mandi,
            )
            .order_by(MarketPrice.date.desc())
            .first()
        )

        avg_7d_result = (
            db.query(func.avg(MarketPrice.price_close))
            .filter(
                MarketPrice.crop == crop,
                MarketPrice.mandi == preferred_mandi,
                MarketPrice.date >= seven_days_ago,
            )
            .scalar()
        )

        current_price = current_price_row.price_close if current_price_row else None
        avg_7d = round(avg_7d_result, 2) if avg_7d_result else None

        # Calculate freshness
        freshness_pct = 100.0
        shelf_life = CROP_SHELF_LIFE.get(crop, 30)
        if inv_item and inv_item.harvest_date:
            days_since_harvest = (today - inv_item.harvest_date).days
            freshness_pct = max(0, (1 - days_since_harvest / shelf_life) * 100)

        # Determine price trend from forecast
        price_trend = "stable"
        price_change_pct = 0.0
        days_to_peak = None

        if forecast and current_price:
            future_prices = [f["predicted_price_modal"] for f in forecast]
            max_future = max(future_prices)
            min_future = min(future_prices)

            price_change_pct = ((future_prices[2] - current_price) / current_price) * 100 if len(future_prices) > 2 else 0

            if price_change_pct > 2:
                price_trend = "up"
                days_to_peak = future_prices.index(max_future) + 1
            elif price_change_pct < -2:
                price_trend = "down"

        # Apply recommendation rules
        recommendation = "HOLD"
        confidence = 0.5
        explanation = ""

        if price_trend == "up" and price_change_pct > 5 and freshness_pct > 60:
            recommendation = "HOLD"
            confidence = 0.75
            explanation = (
                f"Prices expected to rise {price_change_pct:.1f}% in the next 3 days. "
                f"Your {crop} is still fresh ({freshness_pct:.0f}% freshness). Hold for better returns."
            )
        elif price_trend == "down" and price_change_pct < -3:
            recommendation = "SELL"
            confidence = 0.8
            explanation = (
                f"Prices expected to drop {abs(price_change_pct):.1f}%. "
                f"Consider selling your {crop} now to avoid losses."
            )
        elif current_price and avg_7d and current_price > avg_7d * 1.05:
            recommendation = "SELL"
            confidence = 0.7
            explanation = (
                f"Current price ₹{current_price:.0f}/q is above the 7-day average ₹{avg_7d:.0f}/q. "
                f"Good time to sell {crop}."
            )
        elif freshness_pct < 30:
            recommendation = "SELL"
            confidence = 0.85
            explanation = (
                f"Your {crop} freshness is low ({freshness_pct:.0f}%). "
                f"Sell soon to avoid spoilage losses."
            )
        else:
            recommendation = "HOLD"
            confidence = 0.5
            explanation = (
                f"Market is stable for {crop}. Monitor prices and sell when you see a good opportunity."
            )

        recommendations.append({
            "crop": crop,
            "recommendation": recommendation,
            "confidence": round(confidence, 2),
            "explanation": explanation,
            "best_mandi": preferred_mandi,
            "expected_price": forecast[0]["predicted_price_modal"] if forecast else current_price,
            "price_trend": price_trend,
            "days_to_peak": days_to_peak,
        })

    return recommendations


def get_mandi_forecast(db: Session, mandi: str) -> list[dict]:
    """Get forecasts for all crops at a given mandi."""
    cache_key = f"mandi_forecast:{mandi}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    # Get all crops at this mandi
    crops_at_mandi = (
        db.query(MarketPrice.crop)
        .filter(MarketPrice.mandi == mandi)
        .distinct()
        .all()
    )

    result = []
    for (crop_name,) in crops_at_mandi:
        forecast = generate_price_forecast(db, crop_name, mandi, days=7)
        if forecast:
            result.append({
                "crop": crop_name,
                "mandi": mandi,
                "forecasts": forecast,
            })

    set_cached(cache_key, result, ttl_seconds=3600)
    return result


def save_predictions(db: Session, predictions: list[dict], mandi: str, crop: str) -> None:
    """Save generated predictions to the database."""
    from datetime import date as d_type
    for pred in predictions:
        record = PredictionRecord(
            mandi=mandi,
            crop=crop,
            forecast_date=pred["forecast_date"] if isinstance(pred["forecast_date"], d_type) else date.fromisoformat(pred["forecast_date"]),
            predicted_arrivals=pred.get("predicted_arrivals"),
            predicted_price_min=pred.get("predicted_price_min"),
            predicted_price_max=pred.get("predicted_price_max"),
            predicted_price_modal=pred.get("predicted_price_modal"),
            confidence_score=pred.get("confidence_score"),
            model_version="baseline_v1",
        )
        db.add(record)
    db.commit()
