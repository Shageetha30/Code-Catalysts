import datetime
import time
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Incident, Shipment, Batch
from ..schemas import IncidentResponse, IncidentCreate, IncidentUpdate

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status: Open, Investigating, Resolved"),
    severity: Optional[str] = Query(None, description="Filter by severity: Low, Medium, High, Critical"),
    shipment_id: Optional[str] = Query(None, description="Filter by shipment ID"),
    db: Session = Depends(get_db)
):
    """
    List all cold chain incidents with optional filters.
    """
    query = db.query(Incident).order_by(Incident.created_at.desc())
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    if shipment_id:
        query = query.filter(Incident.shipment_id == shipment_id)
    return query.all()

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """
    Get a specific incident by ID.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return inc

@router.post("", response_model=IncidentResponse)
def create_incident(req: IncidentCreate, db: Session = Depends(get_db)):
    """
    Manually log a timestamped cold-chain incident linked to a shipment and optional batch.
    """
    shipment = db.query(Shipment).filter(Shipment.id == req.shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {req.shipment_id} not found")

    batch_id = req.batch_id
    if not batch_id:
        b = db.query(Batch).filter(Batch.shipment_id == req.shipment_id).first()
        batch_id = b.id if b else None

    inc_id = f"INC-{int(time.time()) % 100000:05d}"
    incident = Incident(
        id=inc_id,
        shipment_id=req.shipment_id,
        batch_id=batch_id,
        incident_type=req.incident_type,
        severity=req.severity,
        title=req.title,
        description=req.description,
        recorded_temp=req.recorded_temp,
        status="Open",
        created_at=datetime.datetime.utcnow()
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident_status(incident_id: str, req: IncidentUpdate, db: Session = Depends(get_db)):
    """
    Update incident status (Open, Investigating, Resolved) and add resolution notes.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    inc.status = req.status
    if req.resolution_notes:
        inc.resolution_notes = req.resolution_notes
    if req.status == "Resolved" and not inc.resolved_at:
        inc.resolved_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(inc)
    return inc
