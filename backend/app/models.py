import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String, primary_key=True, index=True) # e.g. SHP-7041
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    courier = Column(String, nullable=False)
    status = Column(String, default="Active") # Active, Normal, Alert, Completed, Quarantined
    vaccine_name = Column(String, nullable=False)
    target_temp_min = Column(Float, default=2.0)
    target_temp_max = Column(Float, default=8.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    batches = relationship("Batch", back_populates="shipment", cascade="all, delete-orphan")
    readings = relationship("Reading", back_populates="shipment", cascade="all, delete-orphan")
    checkpoints = relationship("Checkpoint", back_populates="shipment", cascade="all, delete-orphan", order_by="Checkpoint.step_number")
    incidents = relationship("Incident", back_populates="shipment", cascade="all, delete-orphan")

class Batch(Base):
    __tablename__ = "batches"

    id = Column(String, primary_key=True, index=True) # e.g. BNT-2026-X1
    shipment_id = Column(String, ForeignKey("shipments.id"), nullable=False)
    vaccine_type = Column(String, nullable=False)
    quantity_doses = Column(Integer, default=1000)
    manufacturing_date = Column(String, nullable=False)
    expiry_date = Column(String, nullable=False)
    
    # Review status: Standard, Under Review, Quarantined, Released
    review_status = Column(String, default="Standard")
    review_reason = Column(Text, nullable=True)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Review Priority Scoring Engine (0 to 100)
    priority_score = Column(Float, default=0.0)
    priority_level = Column(String, default="Low") # Low, Medium, High, Critical
    priority_breakdown = Column(Text, nullable=True) # JSON string of scoring components

    shipment = relationship("Shipment", back_populates="batches")
    incidents = relationship("Incident", back_populates="batch")

class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    shipment_id = Column(String, ForeignKey("shipments.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, default=45.0)
    battery_level = Column(Float, default=98.5)
    
    # Threshold Alert (Rule-based: <2°C or >8°C)
    is_threshold_excursion = Column(Boolean, default=False)
    
    # Genuine Machine Learning Anomaly
    is_ml_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0) # Normalized score (0.0 normal -> 1.0 extreme anomaly)
    anomaly_explanation = Column(Text, nullable=True)

    shipment = relationship("Shipment", back_populates="readings")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True) # e.g. INC-2026-001
    shipment_id = Column(String, ForeignKey("shipments.id"), nullable=False)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=True)
    incident_type = Column(String, nullable=False) # "Temperature Threshold", "ML Pattern Anomaly", "Handoff Discrepancy", "Transit Delay"
    severity = Column(String, default="Medium") # Low, Medium, High, Critical
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    recorded_temp = Column(Float, nullable=True)
    status = Column(String, default="Open") # Open, Investigating, Resolved
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    shipment = relationship("Shipment", back_populates="incidents")
    batch = relationship("Batch", back_populates="incidents")

class Checkpoint(Base):
    __tablename__ = "checkpoints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    shipment_id = Column(String, ForeignKey("shipments.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    location_name = Column(String, nullable=False)
    simulated_coordinates = Column(String, default="Simulated Route Checkpoint")
    custodian_role = Column(String, nullable=False)
    custodian_name = Column(String, nullable=False)
    handoff_status = Column(String, default="Completed") # Completed, Pending, Delayed, Verified
    recorded_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    shipment = relationship("Shipment", back_populates="checkpoints")

class ReviewAudit(Base):
    __tablename__ = "review_audits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False) # "Marked Under Review", "Quarantined", "Released"
    actor_name = Column(String, nullable=False)
    actor_role = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
