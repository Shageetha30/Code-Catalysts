from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ..schemas import AnomalyDetectionRequest, AnomalyDetectionResponse, EvaluationMetrics
from ..ml_detector import ml_detector

router = APIRouter(prefix="/api/ml", tags=["Machine Learning Anomaly Detector"])

@router.post("/detect", response_model=AnomalyDetectionResponse)
def detect_anomaly(req: AnomalyDetectionRequest):
    """
    Evaluate a sequence of temperature readings using the trained scikit-learn IsolationForest model.
    Returns anomaly classification, score (0.0 to 1.0), and diagnostic feature explanation.
    """
    result = ml_detector.detect(
        window=req.temperature_window,
        target_min=req.target_min,
        target_max=req.target_max
    )
    return AnomalyDetectionResponse(**result)

@router.get("/evaluate", response_model=EvaluationMetrics)
def evaluate_model():
    """
    Run an empirical evaluation of the ML anomaly detector on held-out synthetic test sets
    (300 normal windows vs 100 abnormal windows) and report accuracy, TPR, and FPR.
    """
    metrics = ml_detector.evaluate_model_performance()
    return EvaluationMetrics(
        test_samples_total=metrics["test_samples_total"],
        normal_samples=metrics["normal_samples"],
        abnormal_samples=metrics["abnormal_samples"],
        accuracy=metrics["accuracy"],
        false_positive_rate=metrics["false_positive_rate"],
        true_positive_rate=metrics["true_positive_rate"],
        model_description=metrics["model_description"]
    )

@router.get("/synthetic-examples")
def get_synthetic_test_cases() -> Dict[str, Any]:
    """
    Provides pre-packaged test cases for live demonstrations:
    - Normal cold-chain cycle
    - Door open rapid heat spike
    - Compressor failure upward drift
    - Sub-zero freeze plunge
    - High-frequency sensor jitter
    """
    return {
        "test_cases": [
            {
                "id": "case_normal_baseline",
                "name": "Standard Cold-Chain Cycle",
                "description": "Nominal refrigeration cycle with compressor oscillations around 4.5°C.",
                "readings": [4.2, 4.4, 4.6, 4.5, 4.3, 4.1, 4.3, 4.5, 4.6, 4.4],
                "expected_category": "Normal Pattern"
            },
            {
                "id": "case_door_open_spike",
                "name": "Rapid Heat Spike (Door Ajar)",
                "description": "Rapid temperature climb from 4.8°C to 11.2°C with high velocity.",
                "readings": [4.8, 5.2, 5.9, 6.8, 7.8, 8.9, 9.9, 10.6, 11.2, 11.8],
                "expected_category": "Anomalous Pattern Detected"
            },
            {
                "id": "case_pre_excursion_drift",
                "name": "Early Warning: Compressor Failure Drift (Within Threshold)",
                "description": "Temperatures are strictly under 8.0°C (no threshold breach yet!), but velocity and loss of cycling trigger ML alarm.",
                "readings": [4.8, 5.1, 5.5, 5.9, 6.3, 6.7, 7.1, 7.4, 7.7, 7.9],
                "expected_category": "Anomalous Pattern Detected"
            },
            {
                "id": "case_freeze_hazard",
                "name": "Freeze Plunge Hazard",
                "description": "Sudden drop towards sub-zero temperatures endangering protein structures.",
                "readings": [4.0, 3.4, 2.7, 1.9, 1.2, 0.4, -0.2, -0.8, -1.3, -1.8],
                "expected_category": "Anomalous Pattern Detected"
            },
            {
                "id": "case_sensor_instability",
                "name": "Erratic Sensor Oscillation",
                "description": "Loose probe or fluctuating connection causing erratic bouncing readings.",
                "readings": [4.2, 7.8, 2.6, 6.9, 3.1, 7.4, 2.9, 6.8, 3.4, 7.1],
                "expected_category": "Anomalous Pattern Detected"
            }
        ]
    }
