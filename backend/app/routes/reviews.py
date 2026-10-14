import datetime
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import Batch, Shipment, Reading, Checkpoint, ReviewAudit
from ..schemas import BatchResponse, BatchReviewRequest, ReviewAuditResponse
from ..review_priority import calculate_batch_review_priority

router = APIRouter(prefix="/api/reviews", tags=["Batch Reviews"])

@router.get("/batches", response_model=List[BatchResponse])
def list_batches_for_review(db: Session = Depends(get_db)):
    """
    List all vaccine batches with their transparent priority score and status.
    """
    batches = db.query(Batch).all()
    # Sort by priority score descending so most urgent are top
    batches.sort(key=lambda b: b.priority_score, reverse=True)
    return batches

@router.get("/batches/{batch_id}", response_model=BatchResponse)
def get_batch_review_detail(batch_id: str, db: Session = Depends(get_db)):
    """
    Get detailed breakdown of a batch review priority score.
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    return batch

@router.post("/batches/{batch_id}/action", response_model=BatchResponse)
def submit_batch_review_action(
    batch_id: str,
    req: BatchReviewRequest,
    db: Session = Depends(get_db)
):
    """
    Record an authorized clinical/operational review action:
    'Under Review', 'Quarantined', or 'Released'.
    
    IMPORTANT: Vaccines are NEVER automatically declared safe or spoiled.
    All status changes require authorized human review with a logged justification.
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

    allowed_actions = ["Under Review", "Quarantined", "Released"]
    if req.action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{req.action}'. Must be one of {allowed_actions}"
        )

    now = datetime.datetime.utcnow()
    batch.review_status = req.action
    batch.review_reason = req.reason
    batch.reviewed_by = req.reviewed_by
    batch.reviewed_at = now

    # Also log to immutable ReviewAudit table
    audit = ReviewAudit(
        batch_id=batch.id,
        action=req.action,
        actor_name=req.reviewed_by,
        actor_role="Clinical / Cold-Chain QA Officer",
        reason=req.reason,
        timestamp=now
    )
    db.add(audit)

    # If quarantined, update shipment status
    if req.action == "Quarantined":
        shipment = db.query(Shipment).filter(Shipment.id == batch.shipment_id).first()
        if shipment:
            shipment.status = "Alert"

    db.commit()
    db.refresh(batch)
    return batch

@router.get("/audits", response_model=List[ReviewAuditResponse])
def list_review_audits(db: Session = Depends(get_db)):
    """
    Get the audit trail of human review actions and decisions.
    """
    return db.query(ReviewAudit).order_by(ReviewAudit.timestamp.desc()).all()
