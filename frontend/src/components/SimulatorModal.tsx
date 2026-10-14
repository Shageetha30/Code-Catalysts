import React, { useState } from 'react';
import { AlertTriangle, Play, Flame, Snowflake, Activity, RotateCcw, X } from 'lucide-react';
import { api } from '../api/client';
import { ShipmentSummary } from '../types';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: ShipmentSummary[];
  onTriggered: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  shipments,
  onTriggered,
}) => {
  const [selectedShipment, setSelectedShipment] = useState(shipments[0]?.id || 'SHP-7041');
  const [scenario, setScenario] = useState('DOOR_OPEN_HEAT_SPIKE');
  const [severity, setSeverity] = useState('High');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'DOOR_OPEN_HEAT_SPIKE',
      name: 'Rapid Heat Spike (Door Ajar / Loading Delay)',
      description: 'Simulates thermal breach climbing +0.8°C to +1.2°C per interval up past 11°C.',
      icon: Flame,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'COMPRESSOR_FAILURE_DRIFT',
      name: 'Compressor Failure Drift (Pre-Excursion Early Warning)',
      description: 'Slow upward drift with loss of refrigeration cycles. ML flags before 8°C!',
      icon: Activity,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'FREEZE_FAULT',
      name: 'Freeze Plunge Hazard (Dry Ice Contact)',
      description: 'Sudden plummet below 1.5°C down to sub-zero freeze danger.',
      icon: Snowflake,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      id: 'SENSOR_OSCILLATION',
      name: 'Erratic Thermal Oscillation',
      description: 'Rapid wild fluctuations indicating loose contact or probe fault.',
      icon: AlertTriangle,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  ];

  const handleTrigger = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      await api.triggerExcursion(selectedShipment, scenario, severity);
      setFeedback(`Excursion triggered for ${selectedShipment}. Telemetry updated.`);
      onTriggered();
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1200);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await api.resetShipmentTemp(selectedShipment);
      setFeedback(`Reset ${selectedShipment} back to nominal 4.5°C.`);
      onTriggered();
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1200);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-base">Telemetry Excursion Simulator</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <strong>Hackathon Simulator:</strong> Inject simulated temperature faults into active vaccine shipments to test threshold alerts, real scikit-learn anomaly detection, and batch review priority scoring.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Target Shipment
            </label>
            <select
              value={selectedShipment}
              onChange={(e) => setSelectedShipment(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.vaccine_name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Excursion Scenario
            </label>
            <div className="space-y-2">
              {scenarios.map((sc) => {
                const Icon = sc.icon;
                const isSelected = scenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setScenario(sc.id)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${sc.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{sc.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{sc.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Severity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Medium', 'High', 'Critical'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`py-1.5 text-xs font-medium rounded-md border transition-all ${
                    severity === lvl
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {feedback && (
            <div className="p-3 text-xs rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-medium">
              {feedback}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to 4.5°C
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleTrigger}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {loading ? 'Triggering...' : 'Inject Fault'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
