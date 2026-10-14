import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Snowflake,
  BatteryCharging,
  Droplets,
  AlertOctagon,
  CheckCircle2,
  Cpu,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { Reading, ShipmentSummary, SimulatorStatus } from '../types';
import { api } from '../api/client';

interface TelemetryPageProps {
  shipments: ShipmentSummary[];
  simulatorStatus: SimulatorStatus | null;
  onToggleSimulator: () => void;
  onRefresh: () => void;
}

export const TelemetryPage: React.FC<TelemetryPageProps> = ({
  shipments,
  simulatorStatus,
  onToggleSimulator,
  onRefresh,
}) => {
  const [selectedShipment, setSelectedShipment] = useState(shipments[0]?.id || 'SHP-7041');
  const [history, setHistory] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchHistory = () => {
    if (!selectedShipment) return;
    api.getTelemetryHistory(selectedShipment, 40)
      .then((data) => setHistory(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [selectedShipment]);

  const latest = history[history.length - 1];
  const isRunning = simulatorStatus?.is_running ?? true;

  const handleTrigger = async (type: string, severity = 'High') => {
    try {
      setActionFeedback(`Triggering ${type}...`);
      await api.triggerExcursion(selectedShipment, type, severity);
      setActionFeedback(`Fault ${type} injected into ${selectedShipment}. Updating stream...`);
      fetchHistory();
      onRefresh();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const handleReset = async () => {
    try {
      setActionFeedback('Resetting to 4.5°C...');
      await api.resetShipmentTemp(selectedShipment);
      setActionFeedback(`Shipment ${selectedShipment} stabilized at 4.5°C.`);
      fetchHistory();
      onRefresh();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const chartData = history.map((r) => {
    const timeStr = new Date(r.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return {
      time: timeStr,
      temp: r.temperature,
      isExcursion: r.is_threshold_excursion ? r.temperature : null,
      isAnomaly: r.is_ml_anomaly ? r.temperature : null,
      score: r.anomaly_score,
      humidity: r.humidity,
    };
  });

  return (
    <div className="space-y-6">
      {/* Title & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Real-Time Vaccine Telemetry Station
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            High-frequency cold-chain sensor feed paired with automated ML anomaly inference.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedShipment}
            onChange={(e) => setSelectedShipment(e.target.value)}
            className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-xs focus:ring-2 focus:ring-sky-500"
          >
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.vaccine_name}
              </option>
            ))}
          </select>

          <button
            onClick={onToggleSimulator}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isRunning
                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl text-xs font-medium animate-in fade-in">
          {actionFeedback}
        </div>
      )}

      {/* Real-time telemetry metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold">
            <span>Latest Sensor Temp</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                latest && (latest.temperature > 8.0 || latest.temperature < 2.0)
                  ? 'text-rose-600'
                  : 'text-slate-900'
              }`}
            >
              {latest ? `${latest.temperature.toFixed(2)}°C` : '—'}
            </span>
            <span className="text-xs text-slate-400">Spec: 2°C - 8°C</span>
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5">
            {latest?.is_threshold_excursion ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                Threshold Excursion Active
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Within Safe Envelope
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold">
            <span>ML Anomaly Score</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                latest && latest.anomaly_score >= 0.55
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {latest ? `${(latest.anomaly_score * 100).toFixed(0)}%` : '0%'}
            </span>
            <span className="text-xs text-slate-400">
              {latest && latest.anomaly_score >= 0.55 ? 'Anomalous' : 'Nominal'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 line-clamp-1">
            {latest?.anomaly_explanation || 'IsolationForest pattern nominal.'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold">
            <span>Relative Humidity</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {latest ? `${latest.humidity.toFixed(1)}%` : '45%'}
            </span>
            <span className="text-xs text-slate-400">Target &lt;65%</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Seal integrity normal</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold">
            <span>Sensor Battery</span>
            <BatteryCharging className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {latest ? `${latest.battery_level.toFixed(1)}%` : '98%'}
            </span>
            <span className="text-xs text-slate-400">Lithium-IoT</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Estimated 45 days runtime</div>
        </div>
      </div>

      {/* Simulator Control Board */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3 mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Interactive Fault Simulator
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Inject Controlled Cold-Chain Thermal Events into {selectedShipment}
            </h3>
          </div>
          <div className="text-[11px] text-slate-400">
            Tests machine learning anomaly response in real time
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => handleTrigger('DOOR_OPEN_HEAT_SPIKE', 'High')}
            className="p-3 bg-slate-800/80 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-500/60 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <Flame className="w-4 h-4" />
              <span>Door Ajar Spike</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Rapid thermal rise exceeding 8°C threshold.
            </p>
          </button>

          <button
            onClick={() => handleTrigger('COMPRESSOR_FAILURE_DRIFT', 'Medium')}
            className="p-3 bg-slate-800/80 hover:bg-sky-950/40 border border-slate-700 hover:border-sky-500/60 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
              <Activity className="w-4 h-4" />
              <span>Compressor Drift</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Pre-excursion slow warming. ML flags before 8°C!
            </p>
          </button>

          <button
            onClick={() => handleTrigger('FREEZE_FAULT', 'Critical')}
            className="p-3 bg-slate-800/80 hover:bg-cyan-950/40 border border-slate-700 hover:border-cyan-500/60 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
              <Snowflake className="w-4 h-4" />
              <span>Freeze Plunge</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Plunge into sub-zero range (&lt;0°C freeze hazard).
            </p>
          </button>

          <button
            onClick={() => handleTrigger('SENSOR_OSCILLATION', 'Medium')}
            className="p-3 bg-slate-800/80 hover:bg-purple-950/40 border border-slate-700 hover:border-purple-500/60 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
              <Cpu className="w-4 h-4" />
              <span>Sensor Jitter</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Wild erratic oscillations from loose probe.
            </p>
          </button>

          <button
            onClick={handleReset}
            className="p-3 bg-slate-800/80 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <RotateCcw className="w-4 h-4" />
              <span>Restore 4.5°C</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Gradually stabilize thermal baseline.
            </p>
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Temperature History & Anomaly Detection Timeline ({selectedShipment})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live updates every 3s. Red dots indicate threshold breaches; amber dots indicate AI anomaly flags.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {history.length} data points logged
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
              <YAxis domain={[-3, 14]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" unit="°C" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl border border-slate-700 space-y-1">
                        <div className="font-semibold text-sky-400">{selectedShipment}</div>
                        <div>Time: {d.time}</div>
                        <div className="text-lg font-bold">{d.temp}°C</div>
                        <div className="text-slate-400">ML Anomaly Score: {(d.score * 100).toFixed(0)}%</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={8.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'WHO Max (+8°C)', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={2.0} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'WHO Min (+2°C)', fill: '#3b82f6', fontSize: 10 }} />
              <Line type="monotone" dataKey="temp" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 2.5 }} />
              <Line type="monotone" dataKey="isExcursion" stroke="#ef4444" strokeWidth={0} dot={{ r: 6, fill: '#ef4444', stroke: '#fee2e2', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="isAnomaly" stroke="#f59e0b" strokeWidth={0} dot={{ r: 4.5, fill: '#f59e0b', stroke: '#fef3c7', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Raw Reading Stream Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-700">
            Recent Telemetry Stream Table
          </h3>
          <span className="text-xs text-slate-400">Showing last 12 readings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Temperature</th>
                <th className="px-4 py-2.5">Threshold Alert</th>
                <th className="px-4 py-2.5">ML Anomaly Score</th>
                <th className="px-4 py-2.5">Diagnostic Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.slice(-12).reverse().map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-600 font-mono">
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 font-bold text-slate-900">
                    <span
                      className={
                        r.temperature > 8.0 || r.temperature < 2.0
                          ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded'
                          : 'text-slate-800'
                      }
                    >
                      {r.temperature.toFixed(2)}°C
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {r.is_threshold_excursion ? (
                      <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px]">
                        BREACH
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                        IN SPEC
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`font-semibold ${
                        r.anomaly_score >= 0.55 ? 'text-amber-600' : 'text-slate-600'
                      }`}
                    >
                      {(r.anomaly_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 max-w-xs truncate">
                    {r.anomaly_explanation || 'Nominal cold storage trajectory.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
