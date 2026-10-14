from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import Shipment, Batch, Reading, Incident, Checkpoint
from ..schemas import ShipmentSummary, ShipmentDetail

router = APIRouter(prefix="/api", tags=["Shipments"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get aggregated dashboard KPIs:
    - Active shipments
    - Normal shipments
    - Temperature alerts
    - Batches requiring review
    - Recent incidents
    """
    total_active = db.query(Shipment).filter(Shipment.status.in_(["Active", "Normal", "Alert"])).count()
    normal_shipments = db.query(Shipment).filter(Shipment.status == "Normal").count()
    alert_shipments = db.query(Shipment).filter(Shipment.status == "Alert").count()
    
    # Batches requiring review: High or Critical priority OR Under Review / Quarantined
    batches_requiring_review = db.query(Batch).filter(
        (Batch.priority_level.in_(["High", "Critical"])) | (Batch.review_status.in_(["Under Review", "Quarantined"]))
    ).count()

    open_incidents = db.query(Incident).filter(Incident.status.in_(["Open", "Investigating"])).count()
    total_incidents = db.query(Incident).count()

    return {
        "active_shipments": total_active,
        "normal_shipments": normal_shipments,
        "temperature_alerts": alert_shipments,
        "batches_requiring_review": batches_requiring_review,
        "open_incidents": open_incidents,
        "total_incidents": total_incidents,
        "simulated_notice": "Hackathon prototype — simulated data — not for clinical use."
    }

@router.get("/shipments", response_model=List[ShipmentSummary])
def list_shipments(db: Session = Depends(get_db)):
    """
    List all vaccine shipments with latest temperature and incident counts.
    """
    shipments = db.query(Shipment).order_by(Shipment.created_at.desc()).all()
    results = []

    for s in shipments:
        latest_reading = (
            db.query(Reading)
            .filter(Reading.shipment_id == s.id)
            .order_by(Reading.timestamp.desc())
            .first()
        )
        batch_count = db.query(Batch).filter(Batch.shipment_id == s.id).count()
        open_incidents = db.query(Incident).filter(
            Incident.shipment_id == s.id,
            Incident.status.in_(["Open", "Investigating"])
        ).count()

        results.append(ShipmentSummary(
            id=s.id,
            origin=s.origin,
            destination=s.destination,
            courier=s.courier,
            status=s.status,
            vaccine_name=s.vaccine_name,
            target_temp_min=s.target_temp_min,
            target_temp_max=s.target_temp_max,
            created_at=s.created_at,
            updated_at=s.updated_at,
            batch_count=batch_count,
            latest_temp=latest_reading.temperature if latest_reading else None,
            latest_status=s.status,
            open_incidents_count=open_incidents
        ))

    return results

@router.get("/shipments/{shipment_id}", response_model=ShipmentDetail)
def get_shipment_detail(shipment_id: str, db: Session = Depends(get_db)):
    """
    Get full details for a shipment including linked batches, recent readings, checkpoints, and incidents.
    """
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    recent_readings = (
        db.query(Reading)
        .filter(Reading.shipment_id == shipment_id)
        .order_by(Reading.timestamp.desc())
        .limit(30)
        .all()
    )
    # Reverse so readings are chronological
    recent_readings.reverse()

    return ShipmentDetail(
        id=shipment.id,
        origin=shipment.origin,
        destination=shipment.destination,
        courier=shipment.courier,
        status=shipment.status,
        vaccine_name=shipment.vaccine_name,
        target_temp_min=shipment.target_temp_min,
        target_temp_max=shipment.target_temp_max,
        created_at=shipment.created_at,
        updated_at=shipment.updated_at,
        batches=shipment.batches,
        recent_readings=recent_readings,
        checkpoints=shipment.checkpoints,
        incidents=shipment.incidents
    )
