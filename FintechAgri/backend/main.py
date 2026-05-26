"""AgroMind API — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import auth, dashboard, inventory, market, posts, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables. Shutdown: nothing special needed."""
    init_db()
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

# Mount all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(market.router)
app.include_router(dashboard.router)
app.include_router(inventory.router)
app.include_router(posts.router)


@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {
        "message": "AgroMind API is running 🌾",
        "docs": "/docs",
        "version": "1.0.0",
    }
