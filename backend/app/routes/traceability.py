import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import Checkpoint, Shipment
from ..schemas import CheckpointResponse

router = APIRouter(prefix="/api/traceability", tags=["Traceability"])

@router.get("", response_model=List[CheckpointResponse])
def list_all_checkpoints(db: Session = Depends(get_db)):
    """
    List all route checkpoints across active shipments.
    Notice: Simulated route coordinates only. Never real GPS.
    """
    return db.query(Checkpoint).order_by(Checkpoint.shipment_id, Checkpoint.step_number).all()

@router.get("/{shipment_id}", response_model=List[CheckpointResponse])
def get_shipment_checkpoints(shipment_id: str, db: Session = Depends(get_db)):
    """
    Get ordered checkpoints and chain of custody handoffs for a specific shipment.
    """
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    return (
        db.query(Checkpoint)
        .filter(Checkpoint.shipment_id == shipment_id)
        .order_by(Checkpoint.step_number.asc())
        .all()
    )

@router.patch("/checkpoints/{checkpoint_id}/verify", response_model=CheckpointResponse)
def verify_custody_handoff(
    checkpoint_id: int,
    notes: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Simulate custody handoff sign-off and transit verification.
    """
    cp = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_id).first()
    if not cp:
        raise HTTPException(status_code=404, detail=f"Checkpoint {checkpoint_id} not found")

    cp.handoff_status = "Completed"
    cp.recorded_at = datetime.datetime.utcnow()
    cp.notes = f"{cp.notes or ''} [Verified & Signed: {notes}]"

    db.commit()
    db.refresh(cp)
    return cp
