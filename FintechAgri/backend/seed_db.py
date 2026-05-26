"""Seed the database with realistic Indian crop market data, a demo user, and sample posts."""

import json
import random
from datetime import date, datetime, timedelta, timezone

from database import SessionLocal, init_db
from models.inventory import Comment, Inventory, Post
from models.market import MarketPrice
from models.user import User
from services.auth_service import hash_password

# ── Price ranges for each crop (₹ per quintal) ──────────────────────────────

CROP_CONFIG = {
    "Onion": {"min": 800, "max": 2500, "base": 1400, "arrivals_base": 3500},
    "Tomato": {"min": 600, "max": 3000, "base": 1200, "arrivals_base": 2800},
    "Potato": {"min": 800, "max": 1800, "base": 1100, "arrivals_base": 4000},
    "Wheat": {"min": 2000, "max": 2800, "base": 2200, "arrivals_base": 5000},
    "Soybean": {"min": 4000, "max": 5500, "base": 4500, "arrivals_base": 2000},
    "Rice": {"min": 1800, "max": 3200, "base": 2400, "arrivals_base": 4500},
}

MANDIS = [
    {"name": "Lasalgaon", "state": "Maharashtra", "scale": 1.0},
    {"name": "Azadpur", "state": "Delhi", "scale": 1.3},
    {"name": "Vashi", "state": "Maharashtra", "scale": 0.9},
    {"name": "Pune", "state": "Maharashtra", "scale": 0.8},
    {"name": "Nashik", "state": "Maharashtra", "scale": 0.7},
]


def generate_prices(days: int = 30):
    """Generate realistic daily price data with random walks."""
    records = []
    today = date.today()

    for crop, cfg in CROP_CONFIG.items():
        for mandi in MANDIS:
            price = cfg["base"] + random.uniform(-100, 100)

            for day_offset in range(days, 0, -1):
                current_date = today - timedelta(days=day_offset)

                # Random walk: ±3-8% daily variation
                change_pct = random.uniform(-0.08, 0.08)
                price = price * (1 + change_pct)
                price = max(cfg["min"], min(cfg["max"], price))

                spread = random.uniform(0.03, 0.10)
                price_open = price * (1 + random.uniform(-0.02, 0.02))
                price_close = price
                price_min = price * (1 - spread / 2)
                price_max = price * (1 + spread / 2)

                base_arrivals = cfg["arrivals_base"] * mandi["scale"]
                arrivals = base_arrivals * random.uniform(0.6, 1.4)

                records.append(
                    MarketPrice(
                        mandi=mandi["name"],
                        crop=crop,
                        price_open=round(price_open, 2),
                        price_close=round(price_close, 2),
                        price_min=round(price_min, 2),
                        price_max=round(price_max, 2),
                        arrivals_quintals=round(arrivals, 1),
                        date=current_date,
                        state=mandi["state"],
                    )
                )
    return records


def seed():
    """Run the full seed process."""
    print("🌱 Initializing database...")
    init_db()

    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(User).filter(User.phone == "9999999999").first()
        if existing:
            print("⚠️  Database already seeded. Skipping.")
            return

        # 1. Seed market prices
        print("📊 Generating 30 days of market price data...")
        prices = generate_prices(days=30)
        db.add_all(prices)
        db.flush()
        print(f"   ✅ Created {len(prices)} market price records")
        print(f"   📈 Crops: {', '.join(CROP_CONFIG.keys())}")
        print(f"   🏪 Mandis: {', '.join(m['name'] for m in MANDIS)}")

        # 2. Create demo user
        print("\n👤 Creating demo farmer account...")
        demo_user = User(
            name="Demo Farmer",
            phone="9999999999",
            password_hash=hash_password("demo123"),
            farm_location="Nashik, Maharashtra",
            pin_code="422001",
            crops=json.dumps(["Onion", "Tomato", "Potato"]),
            farm_size_acres=5.0,
            preferred_mandi="Lasalgaon",
            storage_capacity_quintals=50,
        )
        db.add(demo_user)
        db.flush()
        print(f"   ✅ Demo user created (id={demo_user.id})")
        print(f"   📱 Phone: 9999999999 | 🔑 Password: demo123")

        # 3. Create demo inventory
        print("\n📦 Creating demo inventory...")
        inventory_items = [
            Inventory(
                user_id=demo_user.id,
                crop="Onion",
                quantity_quintals=25.0,
                grade="A",
                storage_location="Cold Storage",
                harvest_date=date.today() - timedelta(days=10),
                estimated_value=35000,
            ),
            Inventory(
                user_id=demo_user.id,
                crop="Tomato",
                quantity_quintals=15.0,
                grade="B",
                storage_location="On Farm",
                harvest_date=date.today() - timedelta(days=5),
                estimated_value=18000,
            ),
            Inventory(
                user_id=demo_user.id,
                crop="Potato",
                quantity_quintals=40.0,
                grade="A",
                storage_location="Cold Storage",
                harvest_date=date.today() - timedelta(days=20),
                estimated_value=48000,
            ),
        ]
        db.add_all(inventory_items)
        db.flush()
        print(f"   ✅ Created {len(inventory_items)} inventory items")

        # 4. Create demo community posts
        print("\n💬 Creating community posts...")
        posts = [
            Post(
                user_id=demo_user.id,
                content="Onion prices at Lasalgaon are rising steadily. Good time to hold stock if you have cold storage. I'm expecting ₹2000+ by next week based on the reduced arrivals pattern.",
                category="price_tip",
                likes_count=12,
            ),
            Post(
                user_id=demo_user.id,
                content="Looking for recommendations on cold storage facilities near Nashik. Need space for 100 quintals of onions. Anyone using Nashik Cold Chain?",
                category="storage",
                likes_count=5,
            ),
            Post(
                user_id=demo_user.id,
                content="Great news! Our FPO collective sold 500 quintals of tomatoes directly to BigBasket at ₹1800/quintal — 20% above mandi rate. Collective selling works! 🎉",
                category="general",
                likes_count=28,
            ),
            Post(
                user_id=demo_user.id,
                content="Has anyone tried drip irrigation for onion farming? Thinking of switching from flood irrigation. What's the setup cost per acre?",
                category="question",
                likes_count=8,
            ),
        ]
        db.add_all(posts)
        db.flush()

        # Add some comments
        comments = [
            Comment(post_id=posts[0].id, user_id=demo_user.id, content="Agree! Arrivals have dropped 30% this week at Lasalgaon."),
            Comment(post_id=posts[2].id, user_id=demo_user.id, content="That's amazing! Which FPO are you part of?"),
        ]
        db.add_all(comments)
        print(f"   ✅ Created {len(posts)} posts and {len(comments)} comments")

        db.commit()

        print("\n" + "=" * 50)
        print("🎉 Database seeded successfully!")
        print("=" * 50)
        print(f"\n📊 Total market prices: {len(prices)}")
        print(f"👤 Demo account: 9999999999 / demo123")
        print(f"📦 Inventory items: {len(inventory_items)}")
        print(f"💬 Community posts: {len(posts)}")
        print(f"\n🚀 Start the server with: uvicorn main:app --reload --port 8000")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
