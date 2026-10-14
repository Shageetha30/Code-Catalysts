export interface Reading {
  id: number;
  shipment_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  battery_level: number;
  is_threshold_excursion: boolean;
  is_ml_anomaly: boolean;
  anomaly_score: number;
  anomaly_explanation?: string;
}

export interface Checkpoint {
  id: number;
  shipment_id: string;
  step_number: number;
  location_name: string;
  simulated_coordinates: string;
  custodian_role: string;
  custodian_name: string;
  handoff_status: 'Completed' | 'Pending' | 'Delayed' | 'Verified';
  recorded_at?: string;
  notes?: string;
}

export interface BatchPriorityBreakdown {
  severity_points: number;
  duration_points: number;
  handoff_points: number;
  ml_points: number;
  max_temp_deviation_c: number;
  excursion_readings_count: number;
  missing_handoffs_count: number;
  highest_ml_anomaly_score: number;
  human_decision_disclaimer: string;
}

export interface Batch {
  id: string;
  shipment_id: string;
  vaccine_type: string;
  quantity_doses: number;
  manufacturing_date: string;
  expiry_date: string;
  review_status: 'Standard' | 'Under Review' | 'Quarantined' | 'Released';
  review_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  priority_score: number;
  priority_level: 'Low' | 'Medium' | 'High' | 'Critical';
  priority_breakdown?: string;
}

export interface Incident {
  id: string;
  shipment_id: string;
  batch_id?: string;
  incident_type: 'Temperature Threshold' | 'ML Pattern Anomaly' | 'Handoff Discrepancy' | 'Transit Delay';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  recorded_temp?: number;
  status: 'Open' | 'Investigating' | 'Resolved';
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ShipmentSummary {
  id: string;
  origin: string;
  destination: string;
  courier: string;
  status: 'Active' | 'Normal' | 'Alert' | 'Completed' | 'Quarantined';
  vaccine_name: string;
  target_temp_min: number;
  target_temp_max: number;
  created_at: string;
  updated_at: string;
  batch_count: number;
  latest_temp?: number;
  latest_status?: string;
  open_incidents_count: number;
}

export interface ShipmentDetail extends ShipmentSummary {
  batches: Batch[];
  recent_readings: Reading[];
  checkpoints: Checkpoint[];
  incidents: Incident[];
}

export interface DashboardStats {
  active_shipments: number;
  normal_shipments: number;
  temperature_alerts: number;
  batches_requiring_review: number;
  open_incidents: number;
  total_incidents: number;
  simulated_notice: string;
}

export interface SimulatorStatus {
  is_running: boolean;
  tick_interval_seconds: number;
  active_shipment_ids: string[];
  simulated_mode: string;
  simulated_notice: string;
}

export interface AnomalyDetectionResponse {
  is_anomaly: boolean;
  anomaly_score: number;
  raw_decision_score: number;
  prediction_label: string;
  model_type: string;
  explanation: string;
  feature_insights: {
    mean_temperature: number;
    volatility_std: number;
    velocity_rate: number;
    acceleration: number;
    span_range: number;
    window_max: number;
    window_min: number;
    oscillation_flips: number;
  };
}

export interface EvaluationMetrics {
  test_samples_total: number;
  normal_samples: number;
  abnormal_samples: number;
  accuracy: number;
  false_positive_rate: number;
  true_positive_rate: number;
  model_description: string;
}

export interface ReviewAudit {
  id: number;
  batch_id: string;
  action: string;
  actor_name: string;
  actor_role: string;
  reason: string;
  timestamp: string;
}
