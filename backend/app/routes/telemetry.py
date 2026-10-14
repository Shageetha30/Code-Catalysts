from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import Reading, Shipment
from ..schemas import ReadingResponse, SimulatorStatus, ExcursionTriggerRequest
from ..simulator import simulator

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry"])

@router.get("/latest", response_model=List[ReadingResponse])
def get_latest_readings(db: Session = Depends(get_db)):
    """
    Get the single most recent reading for each active shipment.
    """
    active_shipments = db.query(Shipment).filter(Shipment.status.in_(["Active", "Normal", "Alert"])).all()
    results = []
    for s in active_shipments:
        r = (
            db.query(Reading)
            .filter(Reading.shipment_id == s.id)
            .order_by(Reading.timestamp.desc())
            .first()
        )
        if r:
            results.append(r)
    return results

@router.get("/history/{shipment_id}", response_model=List[ReadingResponse])
def get_reading_history(
    shipment_id: str,
    limit: int = Query(50, ge=5, le=200),
    db: Session = Depends(get_db)
):
    """
    Get chronological reading history for a shipment, ideal for Recharts visualization.
    """
    readings = (
        db.query(Reading)
        .filter(Reading.shipment_id == shipment_id)
        .order_by(Reading.timestamp.desc())
        .limit(limit)
        .all()
    )
    # Return chronological
    return list(reversed(readings))

@router.get("/simulator/status", response_model=SimulatorStatus)
def get_simulator_status(db: Session = Depends(get_db)):
    """
    Get the real-time status of the telemetry simulator.
    """
    active_shipments = db.query(Shipment.id).filter(Shipment.status.in_(["Active", "Normal", "Alert"])).all()
    active_ids = [s[0] for s in active_shipments]
    
    # Check if any shipment is experiencing an excursion
    excursion_modes = [
        state.get("excursion_mode")
        for state in simulator.shipment_states.values()
        if state.get("excursion_mode")
    ]
    mode = f"Excursion Active: {excursion_modes[0]}" if excursion_modes else "Normal Cold-Storage Cycle"

    return SimulatorStatus(
        is_running=simulator.is_running,
        tick_interval_seconds=simulator.interval_seconds,
        active_shipment_ids=active_ids,
        simulated_mode=mode
    )

@router.post("/simulator/start")
def start_simulator():
    """
    Start continuous automatic telemetry generation.
    """
    simulator.start()
    return {"message": "Continuous telemetry simulator started.", "is_running": True}

@router.post("/simulator/pause")
def pause_simulator():
    """
    Pause continuous telemetry generation.
    """
    simulator.pause()
    return {"message": "Continuous telemetry simulator paused.", "is_running": False}

@router.post("/simulator/trigger-excursion")
def trigger_simulated_excursion(req: ExcursionTriggerRequest, db: Session = Depends(get_db)):
    """
    Trigger a simulated temperature excursion (e.g. door open, cooling failure, freeze fault).
    """
    shipment = db.query(Shipment).filter(Shipment.id == req.shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {req.shipment_id} not found")

    steps = 14 if req.severity == "Critical" else (10 if req.severity == "High" else 6)
    simulator.trigger_excursion(req.shipment_id, req.excursion_type, steps=steps)

    # Immediately trigger one simulation tick so the frontend sees the excursion right away
    simulator.generate_single_tick()

    return {
        "message": f"Simulated excursion '{req.excursion_type}' triggered for {req.shipment_id}.",
        "shipment_id": req.shipment_id,
        "excursion_type": req.excursion_type,
        "severity": req.severity,
        "simulated_notice": "Hackathon prototype — simulated data — not for clinical use."
    }

@router.post("/simulator/reset/{shipment_id}")
def reset_shipment_temperature(shipment_id: str, db: Session = Depends(get_db)):
    """
    Reset a shipment's temperature back to nominal cold chain range (4.5°C).
    """
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    simulator.reset_to_normal(shipment_id)
    simulator.generate_single_tick()
    return {"message": f"Shipment {shipment_id} reset to nominal cold chain (4.5°C)."}
