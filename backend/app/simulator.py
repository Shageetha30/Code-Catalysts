import asyncio
import datetime
import random
import threading
import time
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Shipment, Batch, Reading, Incident, Checkpoint
from .ml_detector import ml_detector
from .review_priority import calculate_batch_review_priority

class TelemetrySimulator:
    def __init__(self):
        self.is_running = True
        self.interval_seconds = 4  # generates new telemetry every 4 seconds
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        
        # State tracking per shipment: current temperature, excursion state, etc.
        self.shipment_states: Dict[str, Dict] = {}
        self.simulated_notice = "Hackathon prototype — simulated data — not for clinical use."

    def initialize_states(self, shipment_ids: List[str]):
        with self._lock:
            for sid in shipment_ids:
                if sid not in self.shipment_states:
                    self.shipment_states[sid] = {
                        "current_temp": round(random.uniform(3.8, 5.2), 2),
                        "excursion_mode": None, # None, DOOR_OPEN_HEAT_SPIKE, COMPRESSOR_FAILURE_DRIFT, FREEZE_FAULT, SENSOR_OSCILLATION
                        "excursion_steps_remaining": 0,
                        "battery": 98.4,
                        "humidity": 45.0
                    }

    def start(self):
        with self._lock:
            self.is_running = True
            if self._thread is None or not self._thread.is_alive():
                self._thread = threading.Thread(target=self._run_loop, daemon=True)
                self._thread.start()

    def pause(self):
        with self._lock:
            self.is_running = False

    def trigger_excursion(self, shipment_id: str, excursion_type: str = "DOOR_OPEN_HEAT_SPIKE", steps: int = 12):
        with self._lock:
            if shipment_id not in self.shipment_states:
                self.shipment_states[shipment_id] = {
                    "current_temp": 4.5,
                    "excursion_mode": None,
                    "excursion_steps_remaining": 0,
                    "battery": 98.0,
                    "humidity": 45.0
                }
            self.shipment_states[shipment_id]["excursion_mode"] = excursion_type
            self.shipment_states[shipment_id]["excursion_steps_remaining"] = steps

    def reset_to_normal(self, shipment_id: str):
        with self._lock:
            if shipment_id in self.shipment_states:
                self.shipment_states[shipment_id]["excursion_mode"] = None
                self.shipment_states[shipment_id]["excursion_steps_remaining"] = 0
                self.shipment_states[shipment_id]["current_temp"] = 4.5

    def _next_temp(self, current_temp: float, mode: Optional[str]) -> float:
        if mode == "DOOR_OPEN_HEAT_SPIKE":
            # Fast temperature rise
            return current_temp + random.uniform(0.6, 1.2)
        elif mode == "COMPRESSOR_FAILURE_DRIFT":
            # Persistent upward drift
            return current_temp + random.uniform(0.2, 0.45)
        elif mode == "FREEZE_FAULT":
            # Sudden freezing drop
            return current_temp - random.uniform(0.7, 1.3)
        elif mode == "SENSOR_OSCILLATION":
            # Wild fluctuations
            return round(4.5 + random.uniform(-3.0, 4.0), 2)
        else:
            # Normal cold storage cycle (oscillating smoothly between 3.6°C and 5.8°C)
            target = 4.6
            drift = (target - current_temp) * 0.15 + random.uniform(-0.15, 0.15)
            new_temp = current_temp + drift
            return round(max(2.5, min(7.5, new_temp)), 2)

    def generate_single_tick(self):
        """Execute one simulation cycle across all active shipments in the database."""
        db: Session = SessionLocal()
        try:
            active_shipments = db.query(Shipment).filter(Shipment.status.in_(["Active", "Alert", "Normal"])).all()
            if not active_shipments:
                return

            sids = [s.id for s in active_shipments]
            self.initialize_states(sids)

            for shipment in active_shipments:
                state = self.shipment_states[shipment.id]
                mode = state["excursion_mode"]
                steps = state["excursion_steps_remaining"]

                new_temp = self._next_temp(state["current_temp"], mode)
                state["current_temp"] = round(new_temp, 2)
                state["battery"] = max(10.0, round(state["battery"] - 0.01, 2))
                state["humidity"] = round(max(30.0, min(75.0, state["humidity"] + random.uniform(-0.5, 0.5))), 1)

                if steps > 1:
                    state["excursion_steps_remaining"] -= 1
                elif steps == 1:
                    state["excursion_mode"] = None
                    state["excursion_steps_remaining"] = 0

                # Fetch last 9 readings to build 10-point sliding window for ML model
                prev_readings = (
                    db.query(Reading.temperature)
                    .filter(Reading.shipment_id == shipment.id)
                    .order_by(Reading.timestamp.desc())
                    .limit(9)
                    .all()
                )
                window = [r[0] for r in reversed(prev_readings)]
                window.append(state["current_temp"])

                # Run ML detector
                ml_result = ml_detector.detect(
                    window=window,
                    target_min=shipment.target_temp_min,
                    target_max=shipment.target_temp_max
                )

                # Check rule-based threshold
                is_threshold_excursion = (
                    state["current_temp"] > shipment.target_temp_max or
                    state["current_temp"] < shipment.target_temp_min
                )

                reading = Reading(
                    shipment_id=shipment.id,
                    timestamp=datetime.datetime.utcnow(),
                    temperature=state["current_temp"],
                    humidity=state["humidity"],
                    battery_level=state["battery"],
                    is_threshold_excursion=is_threshold_excursion,
                    is_ml_anomaly=ml_result["is_anomaly"],
                    anomaly_score=ml_result["anomaly_score"],
                    anomaly_explanation=ml_result["explanation"]
                )
                db.add(reading)
                db.flush()

                # Update shipment status
                if is_threshold_excursion:
                    shipment.status = "Alert"
                elif ml_result["is_anomaly"]:
                    shipment.status = "Alert"
                else:
                    shipment.status = "Normal"

                # If threshold breach or ML anomaly, ensure an incident is logged
                if is_threshold_excursion or (ml_result["is_anomaly"] and ml_result["anomaly_score"] >= 0.70):
                    open_inc = db.query(Incident).filter(
                        Incident.shipment_id == shipment.id,
                        Incident.status.in_(["Open", "Investigating"])
                    ).first()

                    if not open_inc:
                        # Grab linked batch
                        batch = db.query(Batch).filter(Batch.shipment_id == shipment.id).first()
                        batch_id = batch.id if batch else None

                        inc_id = f"INC-{int(time.time()) % 100000:05d}"
                        if is_threshold_excursion:
                            inc_type = "Temperature Threshold"
                            severity = "Critical" if (state["current_temp"] > shipment.target_temp_max + 3.0 or state["current_temp"] < 0) else "High"
                            title = f"Temperature Threshold Excursion ({state['current_temp']}°C)"
                            desc = f"Sensor recorded {state['current_temp']}°C, violating designated range [{shipment.target_temp_min}°C - {shipment.target_temp_max}°C]."
                        else:
                            inc_type = "ML Pattern Anomaly"
                            severity = "Medium"
                            title = f"Pre-Excursion Pattern Anomaly (Score {ml_result['anomaly_score']})"
                            desc = f"ML model detected rapid anomalous thermal vector: {ml_result['explanation']}"

                        new_incident = Incident(
                            id=inc_id,
                            shipment_id=shipment.id,
                            batch_id=batch_id,
                            incident_type=inc_type,
                            severity=severity,
                            title=title,
                            description=desc,
                            recorded_temp=state["current_temp"],
                            status="Open",
                            created_at=datetime.datetime.utcnow()
                        )
                        db.add(new_incident)

                # Recompute review priority for linked batches
                linked_batches = db.query(Batch).filter(Batch.shipment_id == shipment.id).all()
                all_readings = db.query(Reading).filter(Reading.shipment_id == shipment.id).order_by(Reading.timestamp.desc()).limit(50).all()
                all_checkpoints = db.query(Checkpoint).filter(Checkpoint.shipment_id == shipment.id).all()

                for b in linked_batches:
                    score_data = calculate_batch_review_priority(
                        batch=b,
                        readings=all_readings,
                        checkpoints=all_checkpoints,
                        target_min=shipment.target_temp_min,
                        target_max=shipment.target_temp_max
                    )
                    b.priority_score = score_data["priority_score"]
                    b.priority_level = score_data["priority_level"]
                    import json
                    b.priority_breakdown = json.dumps(score_data["breakdown"])

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[Simulator Error] {e}")
        finally:
            db.close()

    def _run_loop(self):
        while True:
            if self.is_running:
                self.generate_single_tick()
            time.sleep(self.interval_seconds)

# Global simulator instance
simulator = TelemetrySimulator()
