import pytest
from app.ml_detector import ColdChainAnomalyDetector

def test_ml_detector_initialization():
    detector = ColdChainAnomalyDetector()
    assert detector.is_trained is True
    assert len(detector.feature_names) == 8

def test_feature_extraction():
    detector = ColdChainAnomalyDetector()
    window = [4.1, 4.3, 4.2, 4.5, 4.4]
    feats = detector.extract_features(window)
    assert len(feats) == 8
    # Mean should be around 4.3
    assert 4.0 <= feats[0] <= 4.6

def test_normal_detection():
    detector = ColdChainAnomalyDetector()
    # Typical nominal cold-chain readings (smooth 4.5°C cycle with compressor curve)
    nominal_window = [4.2, 4.3, 4.5, 4.6, 4.7, 4.6, 4.4, 4.3, 4.2, 4.3]
    res = detector.detect(nominal_window)
    assert res["is_anomaly"] is False
    assert res["anomaly_score"] < 0.55
    assert "Nominal" in res["explanation"] or "within standard bounds" in res["explanation"]

def test_anomaly_detection_heat_spike():
    detector = ColdChainAnomalyDetector()
    # Severe heat spike
    spike_window = [4.5, 5.2, 6.1, 7.4, 8.8, 10.2, 11.5, 12.8]
    res = detector.detect(spike_window)
    assert res["is_anomaly"] is True
    assert res["anomaly_score"] > 0.50
    assert "Steep thermal rise" in res["explanation"] or "Breached upper threshold" in res["explanation"]

def test_anomaly_detection_freeze_plunge():
    detector = ColdChainAnomalyDetector()
    # Severe drop into freezing
    freeze_window = [4.0, 3.2, 2.1, 1.0, 0.2, -0.9, -1.8]
    res = detector.detect(freeze_window)
    assert res["is_anomaly"] is True
    assert res["anomaly_score"] > 0.50

def test_synthetic_evaluation():
    detector = ColdChainAnomalyDetector()
    eval_res = detector.evaluate_model_performance()
    assert eval_res["test_samples_total"] == 400
    assert eval_res["accuracy"] >= 0.85
    assert eval_res["true_positive_rate"] >= 0.80
