from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base, SessionLocal
from .seed_data import seed_database
from .simulator import simulator
from .routes import shipments, telemetry, incidents, traceability, reviews, ml

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables
    Base.metadata.create_all(bind=engine)
    
    # Populate realistic seed data if empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Start the continuous background telemetry simulation
    simulator.start()

    yield

    # Shutdown
    simulator.pause()

app = FastAPI(
    title="ColdTrace API — Vaccine Cold-Chain Telemetry & AI Anomaly Detection",
    description="Intelligent Vaccine Cold-Chain Monitoring with genuine scikit-learn anomaly detection.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(shipments.router)
app.include_router(telemetry.router)
app.include_router(incidents.router)
app.include_router(traceability.router)
app.include_router(reviews.router)
app.include_router(ml.router)

@app.get("/")
def root():
    return {
        "system": "ColdTrace Intelligent Vaccine Cold-Chain Monitoring API",
        "status": "operational",
        "version": "1.0.0",
        "notice": "Hackathon prototype — simulated data — not for clinical use.",
        "endpoints": {
            "dashboard_stats": "/api/stats",
            "shipments": "/api/shipments",
            "telemetry_latest": "/api/telemetry/latest",
            "simulator_status": "/api/telemetry/simulator/status",
            "incidents": "/api/incidents",
            "traceability": "/api/traceability",
            "batch_reviews": "/api/reviews/batches",
            "ml_anomaly_detect": "/api/ml/detect",
            "ml_evaluate": "/api/ml/evaluate"
        }
    }
