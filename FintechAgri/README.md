# AgroMind — Agricultural Intelligence Platform

> Where Agriculture Meets Intelligence 🌾

AI-driven market intelligence platform for Indian farmers. Helps farmers make optimal selling decisions based on real-time market data, price trends, and supply analysis.

## Tech Stack

- **Frontend**: React 19 + Vite, Zustand (state), React Router v7, Recharts
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Pydantic v2
- **Database**: SQLite (UAT) → PostgreSQL (production)
- **Auth**: JWT (python-jose + bcrypt)
- **Free APIs**: Open-Meteo (weather, no key needed)

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_db.py  # Seed database with demo data
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App available at: http://localhost:5173

### Demo Account

- Phone: `9999999999`
- Password: `demo123`

## Features (Current)

- ✅ Farmer registration & authentication (JWT)
- ✅ Market dashboard with real-time KPIs
- ✅ Crop market prices (6 crops, 5 mandis)
- ✅ Price history & trends (30/90/365 day charts)
- ✅ Farm inventory management (CRUD)
- ✅ Community social feed
- ✅ Weather integration (Open-Meteo, free)

## Features (Planned)

- 🔜 AI price predictions (Prophet + XGBoost)
- 🔜 AI financial advisor (open-source LLM)
- 🔜 Government schemes finder
- 🔜 Mandi locator with maps
- 🔜 Multi-language support (Hindi)
- 🔜 Mobile app (React Native)

## Project Structure

```
FintechAgri/
├── backend/              # FastAPI Python backend
│   ├── main.py           # App entry point
│   ├── config.py         # Settings
│   ├── database.py       # SQLAlchemy setup
│   ├── models/           # ORM models
│   ├── schemas/          # Pydantic schemas
│   ├── routers/          # API endpoints
│   ├── services/         # Business logic
│   └── seed_db.py        # Database seeder
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── stores/       # Zustand state stores
│   │   ├── services/     # API service layer
│   │   └── index.css     # Design system
│   └── package.json
└── PROJECT_REQUIREMENTS.md  # Source of truth
```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for the interactive Swagger UI.

## Environment Variables

Create a `.env` file in `backend/` (optional for UAT):

```env
DATABASE_URL=sqlite:///./agromind.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## License

Proprietary — All rights reserved.
