"""
FastAPI Backend Application Entrypoint for Quantum Algorithm Learning Platform.

Exposes REST API endpoints for:
- System Health Diagnostics (/health)
- Learner Intelligence Profiles (/api/learners/{id}/profile)
- Personalized Recommendations (/api/learners/{id}/recommendations)
- ML Model Predictions (/api/learners/predict)
- AI Quantum Tutor & Loop Engineering (/api/tutor)
"""

import os
from dotenv import load_dotenv
load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.dependencies import get_artifact_store
from src.api.routes import health, learner, recommendations, tutor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler pre-loading static JSON artifacts and ML models on startup."""
    store = get_artifact_store()
    print(f"[INFO] Backend Startup: Cached {len(store.profiles)} learner profiles and {len(store.recommendations)} recommendation sets.")
    yield


app = FastAPI(
    title="Quantum AI Intelligence API",
    description="AI-Based Interactive Quantum Algorithm Learning Platform REST API Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration for local frontend origins (React / Vite / Streamlit)
allowed_origins_env = os.getenv("CORS_ORIGINS", "")
if allowed_origins_env:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API Routers
app.include_router(health.router)
app.include_router(learner.router)
app.include_router(recommendations.router)
app.include_router(tutor.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="127.0.0.1", port=8000, reload=True)
