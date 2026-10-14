import json
from typing import List, Dict, Any
from .models import Reading, Checkpoint, Batch

def calculate_batch_review_priority(
    batch: Batch,
    readings: List[Reading],
    checkpoints: List[Checkpoint],
    target_min: float = 2.0,
    target_max: float = 8.0
) -> Dict[str, Any]:
    """
    Transparent Vaccine Batch Review-Priority Scoring Engine (0.0 to 100.0).
    
    CRITICAL HEALTHCARE PRINCIPLE:
    This algorithm ONLY scores risk priority to guide human triage.
    It NEVER automatically declares vaccines spoiled, degraded, or safe.
    
    Scoring Formula Breakdown (Total 100 Points):
    1. Excursion Severity (Max 40 pts): Max deviation magnitude beyond target bounds.
    2. Excursion Duration (Max 30 pts): Cumulative count of out-of-range sensor readings.
    3. Chain-of-Custody Integrity (Max 20 pts): Missing, delayed, or unverified handoffs.
    4. ML Pattern Volatility (Max 10 pts): AI Anomaly score and kinematic instability.
    """
    if not readings:
        return {
            "priority_score": 0.0,
            "priority_level": "Low",
            "breakdown": {
                "severity_points": 0.0,
                "duration_points": 0.0,
                "handoff_points": 0.0,
                "ml_points": 0.0,
                "max_temp_deviation_c": 0.0,
                "excursion_readings_count": 0,
                "missing_handoffs_count": 0,
                "highest_ml_anomaly_score": 0.0,
                "human_decision_disclaimer": "Human QA review required. Algorithmic scores prioritize inspection order only; they do not dictate vaccine potency or viability."
            }
        }

    # 1. Severity Calculation (Max 40 pts)
    max_above = 0.0
    max_below = 0.0
    excursion_count = 0
    ml_anomaly_count = 0
    highest_ml_score = 0.0

    for r in readings:
        if r.temperature > target_max:
            excursion_count += 1
            dev = r.temperature - target_max
            if dev > max_above:
                max_above = dev
        elif r.temperature < target_min:
            excursion_count += 1
            dev = target_min - r.temperature
            if dev > max_below:
                max_below = dev

        if r.is_ml_anomaly:
            ml_anomaly_count += 1
        if r.anomaly_score > highest_ml_score:
            highest_ml_score = r.anomaly_score

    # Freeze excursions are clinically more hazardous for many vaccines than mild heat
    effective_dev = max_above + (max_below * 1.5)
    # 0 to 4°C deviation maps to 0 to 40 pts
    severity_pts = min(40.0, effective_dev * 10.0)

    # 2. Duration Calculation (Max 30 pts)
    # Each out-of-spec reading adds duration weight
    duration_pts = min(30.0, float(excursion_count * 5.0))

    # 3. Chain of Custody & Handoff Discrepancies (Max 20 pts)
    missing_handoffs = 0
    for cp in checkpoints:
        if cp.handoff_status in ["Pending", "Delayed", "Disputed"]:
            missing_handoffs += 1
    
    handoff_pts = min(20.0, float(missing_handoffs * 10.0))

    # 4. ML Anomaly Risk (Max 10 pts)
    ml_pts = min(10.0, (highest_ml_score * 7.0) + min(3.0, ml_anomaly_count * 0.5))

    total_score = round(min(100.0, severity_pts + duration_pts + handoff_pts + ml_pts), 1)

    if total_score >= 75.0:
        priority_level = "Critical"
    elif total_score >= 50.0:
        priority_level = "High"
    elif total_score >= 25.0:
        priority_level = "Medium"
    else:
        priority_level = "Low"

    breakdown = {
        "severity_points": round(severity_pts, 1),
        "duration_points": round(duration_pts, 1),
        "handoff_points": round(handoff_pts, 1),
        "ml_points": round(ml_pts, 1),
        "max_temp_deviation_c": round(max(max_above, max_below), 2),
        "excursion_readings_count": excursion_count,
        "missing_handoffs_count": missing_handoffs,
        "highest_ml_anomaly_score": round(highest_ml_score, 2),
        "human_decision_disclaimer": "Human QA review required. Algorithmic scores prioritize inspection order only; they do not dictate vaccine potency or viability."
    }

    return {
        "priority_score": total_score,
        "priority_level": priority_level,
        "breakdown": breakdown
    }
