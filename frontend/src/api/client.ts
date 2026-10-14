import {
  DashboardStats,
  ShipmentSummary,
  ShipmentDetail,
  Reading,
  Incident,
  Checkpoint,
  Batch,
  ReviewAudit,
  SimulatorStatus,
  AnomalyDetectionResponse,
  EvaluationMetrics
} from '../types';

// In production or when VITE_API_URL is configured, use the remote backend URL.
// When unset (local development), fallback to '/api' which leverages Vite's dev proxy.
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const sanitizedBase = rawApiUrl.replace(/\/+$/, '');
export const API_BASE = sanitizedBase
  ? (sanitizedBase.endsWith('/api') ? sanitizedBase : `${sanitizedBase}/api`)
  : '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errBody.detail || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Stats & Dashboard
  getStats: () => request<DashboardStats>('/stats'),

  // Shipments
  getShipments: () => request<ShipmentSummary[]>('/shipments'),
  getShipmentDetail: (id: string) => request<ShipmentDetail>(`/shipments/${id}`),

  // Telemetry & Simulator
  getLatestTelemetry: () => request<Reading[]>('/telemetry/latest'),
  getTelemetryHistory: (shipmentId: string, limit = 40) =>
    request<Reading[]>(`/telemetry/history/${shipmentId}?limit=${limit}`),
  getSimulatorStatus: () => request<SimulatorStatus>('/telemetry/simulator/status'),
  startSimulator: () => request<{ message: string; is_running: boolean }>('/telemetry/simulator/start', { method: 'POST' }),
  pauseSimulator: () => request<{ message: string; is_running: boolean }>('/telemetry/simulator/pause', { method: 'POST' }),
  triggerExcursion: (shipmentId: string, excursionType: string, severity = 'High') =>
    request<{ message: string }>('/telemetry/simulator/trigger-excursion', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentId, excursion_type: excursionType, severity }),
    }),
  resetShipmentTemp: (shipmentId: string) =>
    request<{ message: string }>(`/telemetry/simulator/reset/${shipmentId}`, { method: 'POST' }),

  // Incidents
  getIncidents: (status?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Incident[]>(`/incidents${qs}`);
  },
  createIncident: (payload: {
    shipment_id: string;
    incident_type: string;
    severity: string;
    title: string;
    description: string;
    recorded_temp?: number;
  }) => request<Incident>('/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  updateIncidentStatus: (id: string, status: string, resolution_notes?: string) =>
    request<Incident>(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution_notes }),
    }),

  // Traceability & Checkpoints
  getAllCheckpoints: () => request<Checkpoint[]>('/traceability'),
  getShipmentCheckpoints: (shipmentId: string) => request<Checkpoint[]>(`/traceability/${shipmentId}`),
  verifyHandoff: (checkpointId: number, notes: string) =>
    request<Checkpoint>(`/traceability/checkpoints/${checkpointId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }),

  // Batch Reviews
  getBatches: () => request<Batch[]>('/reviews/batches'),
  getBatchDetail: (batchId: string) => request<Batch>(`/reviews/batches/${batchId}`),
  submitBatchAction: (batchId: string, action: 'Under Review' | 'Quarantined' | 'Released', reason: string, reviewed_by: string) =>
    request<Batch>(`/reviews/batches/${batchId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, reason, reviewed_by }),
    }),
  getReviewAudits: () => request<ReviewAudit[]>('/reviews/audits'),

  // ML Detector
  detectAnomaly: (window: number[], target_min = 2.0, target_max = 8.0) =>
    request<AnomalyDetectionResponse>('/ml/detect', {
      method: 'POST',
      body: JSON.stringify({ temperature_window: window, target_min, target_max }),
    }),
  evaluateModel: () => request<EvaluationMetrics>('/ml/evaluate'),
  getSyntheticTestCases: () =>
    request<{
      test_cases: Array<{
        id: string;
        name: string;
        description: string;
        readings: number[];
        expected_category: string;
      }>;
    }>('/ml/synthetic-examples'),
};
