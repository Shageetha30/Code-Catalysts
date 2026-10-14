from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# Reading schemas
class ReadingBase(BaseModel):
    temperature: float = Field(..., description="Temperature reading in Celsius")
    humidity: Optional[float] = Field(45.0, description="Relative humidity %")
    battery_level: Optional[float] = Field(98.0, description="Sensor battery %")

class ReadingCreate(ReadingBase):
    shipment_id: str

class ReadingResponse(ReadingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: str
    timestamp: datetime
    is_threshold_excursion: bool
    is_ml_anomaly: bool
    anomaly_score: float
    anomaly_explanation: Optional[str] = None

# Checkpoint schemas
class CheckpointResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: str
    step_number: int
    location_name: str
    simulated_coordinates: str
    custodian_role: str
    custodian_name: str
    handoff_status: str
    recorded_at: Optional[datetime] = None
    notes: Optional[str] = None

# Batch schemas
class BatchBase(BaseModel):
    id: str
    vaccine_type: str
    quantity_doses: int
    manufacturing_date: str
    expiry_date: str

class BatchResponse(BatchBase):
    model_config = ConfigDict(from_attributes=True)

    shipment_id: str
    review_status: str
    review_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    priority_score: float
    priority_level: str
    priority_breakdown: Optional[str] = None

class BatchReviewRequest(BaseModel):
    action: str = Field(..., description="Action: 'Under Review', 'Quarantined', or 'Released'")
    reason: str = Field(..., min_length=5, description="Clear medical/operational justification for this action")
    reviewed_by: str = Field(..., min_length=2, description="Name and title of authorized reviewer")

# Incident schemas
class IncidentCreate(BaseModel):
    shipment_id: str
    batch_id: Optional[str] = None
    incident_type: str
    severity: str = "Medium"
    title: str
    description: str
    recorded_temp: Optional[float] = None

class IncidentUpdate(BaseModel):
    status: str = Field(..., description="Status: 'Open', 'Investigating', or 'Resolved'")
    resolution_notes: Optional[str] = None

class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    shipment_id: str
    batch_id: Optional[str] = None
    incident_type: str
    severity: str
    title: str
    description: str
    recorded_temp: Optional[float] = None
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

# Shipment schemas
class ShipmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    origin: str
    destination: str
    courier: str
    status: str
    vaccine_name: str
    target_temp_min: float
    target_temp_max: float
    created_at: datetime
    updated_at: datetime
    batch_count: int = 0
    latest_temp: Optional[float] = None
    latest_status: Optional[str] = None
    open_incidents_count: int = 0

class ShipmentDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    origin: str
    destination: str
    courier: str
    status: str
    vaccine_name: str
    target_temp_min: float
    target_temp_max: float
    created_at: datetime
    updated_at: datetime
    batches: List[BatchResponse] = []
    recent_readings: List[ReadingResponse] = []
    checkpoints: List[CheckpointResponse] = []
    incidents: List[IncidentResponse] = []

# Review Audit Schema
class ReviewAuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_id: str
    action: str
    actor_name: str
    actor_role: str
    reason: str
    timestamp: datetime

# ML Detector Schemas
class AnomalyDetectionRequest(BaseModel):
    temperature_window: List[float] = Field(..., min_length=3, description="Recent sequential temperature readings (°C)")
    target_min: float = 2.0
    target_max: float = 8.0

class AnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float = Field(..., description="Calculated ML anomaly score (0.0 to 1.0)")
    raw_decision_score: float
    prediction_label: str # "Normal Pattern" or "Anomalous Pattern Detected"
    model_type: str
    explanation: str
    feature_insights: Dict[str, Any]

class EvaluationMetrics(BaseModel):
    test_samples_total: int
    normal_samples: int
    abnormal_samples: int
    accuracy: float
    false_positive_rate: float
    true_positive_rate: float
    model_description: str

# Simulator Schemas
class SimulatorStatus(BaseModel):
    is_running: bool
    tick_interval_seconds: int
    active_shipment_ids: List[str]
    simulated_mode: str # "Normal Cycle", "Excursion Triggered", "Drift Warning"
    simulated_notice: str = "Hackathon prototype — simulated data — not for clinical use."

class ExcursionTriggerRequest(BaseModel):
    shipment_id: str
    excursion_type: str = Field("DOOR_OPEN_HEAT_SPIKE", description="DOOR_OPEN_HEAT_SPIKE, COMPRESSOR_FAILURE_DRIFT, FREEZE_FAULT, or SENSOR_OSCILLATION")
    severity: str = Field("High", description="Medium, High, Critical")
