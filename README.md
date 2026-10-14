<<<<<<< HEAD
# ColdTrace — Intelligent Vaccine Cold-Chain Monitoring

> **Notice:** *Hackathon prototype — simulated data — not for clinical use.*

![ColdTrace Banner](https://img.shields.io/badge/ColdTrace-AI%20Cold--Chain-0284c7?style=for-the-badge&logo=shield)
![Status](https://img.shields.io/badge/Status-Fully%20Operational-10b981?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

---

## 1. Project Overview

Vaccines are delicate biological products. If exposed to temperatures outside their designated storage envelope (typically **+2.0°C to +8.0°C**), their therapeutic efficacy deteriorates, and freezing can irreversibly denature proteins. 

Traditional cold-chain loggers act only as **reactive alarms**: they trigger only *after* the temperature breaches the limit. By then, valuable inventory may already have sustained cumulative damage.

**ColdTrace** is an intelligent cold-chain telemetry platform that pairs:
1. **Rule-Based Threshold Monitoring**: Immediately flags physical breaches above +8.0°C or below +2.0°C.
2. **Predictive AI Anomaly Detection (`scikit-learn`)**: Analyzes an 8-dimensional time-series kinematic feature vector (velocity, acceleration, variance, cyclic oscillation) to catch warming trends and equipment failure vectors **minutes before** boundaries are crossed.
3. **Transparent Review-Priority Scoring**: Quantifies risk across severity, duration, and chain-of-custody gaps (0–100 scale).
4. **Human-in-the-Loop Clinical Triage**: Strictly prevents automated spoilage/safety declarations—ensuring qualified clinical pharmacists record review determinations and audit signatures.

---

## 2. Architecture

```
                                  ┌──────────────────────────────┐
                                  │   React + TypeScript UI      │
                                  │   (Vite, Tailwind, Recharts) │
                                  │   Port: 3000                 │
                                  └──────────────┬───────────────┘
                                                 │
                                           REST API & CORS
                                                 │
                                  ┌──────────────▼───────────────┐
                                  │   FastAPI Python Backend     │
                                  │   Port: 8000                 │
                                  └──────┬───────────────┬───────┘
                                         │               │
                     ┌───────────────────┴───┐       ┌───┴─────────────────────┐
                     │ Telemetry Simulator   │       │ scikit-learn            │
                     │ Continuous generator  │       │ IsolationForest         │
                     │ Fault injection       │       │ 8-D Kinematic Features  │
                     └───────────┬───────────┘       └─────────────────────────┘
                                 │
                     ┌───────────▼───────────┐
                     │ SQLite Database       │
                     │ (Shipments, Batches,  │
                     │  Readings, Incidents, │
                     │  Audits, Checkpoints) │
                     └───────────────────────┘
```

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Python 3.14+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2
- **Database**: SQLite (`coldtrace.db`) with relational schema and persistent audit logging
- **Machine Learning**: `scikit-learn` (IsolationForest), `numpy`, `scipy`
- **Testing**: `pytest`, `httpx`

---

## 4. Beginner-Friendly Step-by-Step Setup

Follow these exact steps in your terminal.

### Prerequisites Check
Ensure you have Python 3.10+ and Node.js 18+ installed:
```bash
python3 --version
node --version
npm --version
```

### Option A: One-Command All-in-One Startup (Recommended)
From the project root directory (`coldtrace`):
```bash
./start.sh
```
This automatically boots both the FastAPI backend and React frontend.

---

### Option B: Running Manually in Separate Terminals

#### Terminal 1 — Backend (FastAPI + SQLite + ML)
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Activate the virtual environment
source venv/bin/activate

# 3. (Optional) If setting up from scratch, install requirements:
# pip install -r requirements.txt

# 4. Start the backend server
python run.py
```
> The backend will initialize SQLite tables, load realistic sample data, train the ML model, and begin continuous telemetry at `http://localhost:8000`.
> Interactive API Docs: `http://localhost:8000/docs`

#### Terminal 2 — Frontend (React + TypeScript)
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. (Optional) If setting up from scratch:
# npm install

# 3. Start the Vite development server
npm run dev
```
> Open your browser at: **`http://localhost:3000`**

---

## 5. Machine Learning Anomaly Detection Approach

### How the Model Works
Rather than applying simple thresholds ($T > 8$ or $T < 2$), the anomaly detector extracts an **8-dimensional feature vector** from sliding temperature windows:
1. `mean_temp`: Average temperature over the time window.
2. `std_temp`: Thermal variance / standard deviation.
3. `velocity`: First difference rate of change ($\frac{\Delta T}{\Delta t}$) in °C/step.
4. `acceleration`: Kinematic rate of velocity change ($\frac{\Delta^2 T}{\Delta t^2}$).
5. `span`: Peak-to-peak amplitude ($\max - \min$).
6. `max_val`: Highest recorded temperature in window.
7. `min_val`: Lowest recorded temperature in window.
8. `sign_changes`: Frequency of derivative direction reversals (detects compressor short-cycling and sensor jitter).

### Training & Synthetic Baseline
The detector uses `IsolationForest(n_estimators=100, contamination=0.08)`. It is trained on synthetic data representing nominal cold storage cycles (smooth sine oscillations between 3.5°C and 5.5°C with subtle refrigeration cycling and sensor noise) and evaluated against 4 realistic failure modes:
- **`DOOR_OPEN_HEAT_SPIKE`**: Fast warming velocity (+0.8°C to +1.4°C/step).
- **`COMPRESSOR_FAILURE_DRIFT`**: Pre-excursion warning where temperature rises steadily under 8°C with loss of cooling cycles.
- **`FREEZE_FAULT`**: Rapid negative plunge below +1.0°C risking protein crystallization.
- **`SENSOR_OSCILLATION`**: Erratic high-frequency fluctuations caused by a loose thermistor probe.

### Difference Between Threshold Alarms and AI Anomalies
| Feature | Traditional Threshold Alert | ColdTrace AI Anomaly Detector |
|---|---|---|
| **Trigger Mechanism** | Fixed static boundary ($T > 8°C$ or $T < 2°C$) | Multi-variable time-series kinematic vector |
| **Response Time** | Reactive (after limit is breached) | Predictive (detects drift before breach) |
| **Early Warning** | ❌ None (silent if $T = 7.9°C$) | ✅ Flags high velocity ($+0.7°C$/step) |
| **Output** | Binary Flag (True / False) | Normalized Anomaly Score (0.0 to 1.0) + Explanation |

---

## 6. Review-Priority Scoring Engine

ColdTrace calculates a transparent **0 to 100 review-priority score** to order pharmacist inspection:
- **Excursion Severity (Max 40 pts)**: Deviation magnitude beyond WHO bounds (sub-zero freeze given 1.5× weight due to irreversibility).
- **Excursion Duration (Max 30 pts)**: Cumulative count of out-of-spec readings.
- **Chain of Custody (Max 20 pts)**: Missing, delayed, or unverified handoffs.
- **ML Anomaly Risk (Max 10 pts)**: Peak AI anomaly score and thermal instability.

> **Clinical Principle:** ColdTrace **never** automatically declares vaccines safe or spoiled. The score only prioritizes human inspection order. Authorized clinical reviewers must inspect and commit a signed review record ("Under Review", "Quarantined", or "Released").

---

## 7. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and simulated data notice |
| `GET` | `/api/stats` | Aggregated KPIs (active shipments, alerts, reviews, incidents) |
| `GET` | `/api/shipments` | List all shipments with current temperature and status |
| `GET` | `/api/shipments/{id}` | Detailed shipment profile, batches, readings, checkpoints |
| `GET` | `/api/telemetry/latest` | Most recent reading for all active shipments |
| `GET` | `/api/telemetry/history/{id}` | Chronological temperature series for Recharts |
| `GET` | `/api/telemetry/simulator/status` | Real-time simulator engine state |
| `POST` | `/api/telemetry/simulator/start` | Start continuous automatic readings |
| `POST` | `/api/telemetry/simulator/pause` | Pause continuous readings |
| `POST` | `/api/telemetry/simulator/trigger-excursion` | Inject simulated thermal excursion |
| `POST` | `/api/telemetry/simulator/reset/{id}` | Reset shipment temperature to nominal 4.5°C |
| `GET` | `/api/incidents` | List timestamped incidents (filter by status/severity) |
| `POST` | `/api/incidents` | Log an incident ticket linked to shipment/batch |
| `PATCH`| `/api/incidents/{id}` | Update status (`Investigating`, `Resolved`) with notes |
| `GET` | `/api/traceability` | List all route checkpoints |
| `GET` | `/api/traceability/{id}` | Ordered chain-of-custody handoffs for shipment |
| `PATCH`| `/api/traceability/checkpoints/{id}/verify` | Digital custody handoff sign-off |
| `GET` | `/api/reviews/batches` | Batches sorted by review-priority score |
| `POST` | `/api/reviews/batches/{id}/action` | Commit review action (`Under Review`, `Quarantined`) |
| `GET` | `/api/reviews/audits` | Immutable audit trail of human review actions |
| `POST` | `/api/ml/detect` | Evaluate temperature window with IsolationForest |
| `GET` | `/api/ml/evaluate` | Empirical test set evaluation metrics (accuracy, TPR, FPR) |
| `GET` | `/api/ml/synthetic-examples` | Pre-packaged demonstration test cases |

---

## 8. Testing & Validation

### Backend Unit & Integration Tests (14 passed)
Run the full test suite with `pytest`:
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest -v
```
Output:
- `test_root_endpoint` ✅
- `test_stats_endpoint` ✅
- `test_shipments_list` ✅
- `test_shipment_detail` ✅
- `test_telemetry_latest` ✅
- `test_incidents_crud` ✅
- `test_batch_review_action` ✅
- `test_ml_detect_endpoint` ✅
- `test_ml_detector_initialization` ✅
- `test_feature_extraction` ✅
- `test_normal_detection` ✅
- `test_anomaly_detection_heat_spike` ✅
- `test_anomaly_detection_freeze_plunge` ✅
- `test_synthetic_evaluation` ✅

### Frontend TypeScript & Production Build Test
Verify that the React frontend builds without errors:
```bash
cd frontend
npm run build
```

---

## 9. Limitations & Real-World Translation

1. **Simulated Telemetry**: Checkpoint GPS coordinates and temperature readings are generated synthetically. In commercial deployment, this connects to physical IoT Bluetooth Low Energy (BLE) or cellular data loggers (e.g., SenseAware, TempTrip).
2. **Clinical Decision Making**: ColdTrace implements strict human-in-the-loop validation. While machine learning can flag risk vectors, actual vaccine release or destruction decisions must consider specific stability budgets, shake tests for freeze damage, and regulatory WHO PQS guidelines.
3. **Database Scalability**: The prototype utilizes SQLite for zero-configuration hackathon evaluation. Production deployment would migrate to PostgreSQL with TimescaleDB for high-throughput time-series compression.

---

## 10. GitHub Submission Instructions

To push this repository to GitHub:

```bash
# 1. Initialize Git in the coldtrace folder
git init

# 2. Add all files
git add .

# 3. Create your initial commit
git commit -m "feat: complete ColdTrace vaccine cold-chain monitoring system"

# 4. Link your remote GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/coldtrace.git

# 5. Push to main branch
git branch -M main
git push -u origin main
```

---

*ColdTrace Hackathon Project — Built with FastAPI, scikit-learn, React, TypeScript, and Recharts.*
=======
# Code-Catalysts
ColdTrace is a vaccine carrier temperature logger that tracks real-time temperatures and alerts logistics staff and nurses during cold-chain transit to prevent vaccine spoilage.
>>>>>>> 5c65fb82f88b90de035a82708f540d500162f703
