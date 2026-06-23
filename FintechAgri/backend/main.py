"""AgroMind API — FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import auth, dashboard, inventory, market, nearby, posts, users
from routers import predictions, cluster


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables, sync today's market data. Shutdown: cleanup."""
    init_db()

    # Ensure uploads directory exists
    uploads_dir = Path(__file__).resolve().parent / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    # Sync today's market data (mock) on startup
    from database import SessionLocal
    from services.agmarknet_service import sync_market_data
    db = SessionLocal()
    try:
        sync_market_data(db, days=1)
    except Exception:
        pass  # Non-critical — seed_db data still works
    finally:
        db.close()

    yield


app = FastAPI(
    title="AgroMind API",
    description="AI-driven agricultural market intelligence and farmer services platform.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server and all origins for UAT
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
uploads_path = Path(__file__).resolve().parent / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Mount all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(market.router)
app.include_router(dashboard.router)
app.include_router(inventory.router)
app.include_router(posts.router)
app.include_router(nearby.router)
app.include_router(predictions.router)
app.include_router(cluster.router)


@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {
        "message": "AgroMind API is running 🌾",
        "docs": "/docs",
        "version": "1.0.0",
    }

