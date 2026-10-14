import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  ShieldAlert,
  ArrowRight,
  Flame,
  Activity,
  Layers
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
  Legend
} from 'recharts';
import { DashboardStats, ShipmentSummary, Reading, Incident } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PageId } from '../components/Sidebar';

interface DashboardPageProps {
  stats: DashboardStats | null;
  shipments: ShipmentSummary[];
  telemetry: Reading[];
  incidents: Incident[];
  onNavigate: (page: PageId) => void;
  onOpenExcursionModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  shipments,
  telemetry,
  incidents,
  onNavigate,
  onOpenExcursionModal,
}) => {
  // Format telemetry for Recharts
  const chartData = telemetry.slice(-25).map((r, i) => {
    const timeStr = new Date(r.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return {
      name: timeStr,
      temp: r.temperature,
      threshold: r.is_threshold_excursion ? r.temperature : null,
      mlAnomaly: r.is_ml_anomaly ? r.temperature : null,
      score: r.anomaly_score,
      shipment: r.shipment_id,
      humidity: r.humidity,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cold-Chain Operations Command
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time vaccine thermal monitoring, automated ML anomaly detection, and human review triage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExcursionModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-current" />
            Simulate Excursion
          </button>
          <button
            onClick={() => onNavigate('telemetry')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            Live Telemetry Station
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Shipments
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats?.active_shipments ?? shipments.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Continuous GPS & probe tracking</div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Normal In-Spec
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {stats?.normal_shipments ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600/90 mt-0.5">Within +2°C to +8°C band</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Thermal Alerts
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {stats?.temperature_alerts ?? 0}
            </div>
            <div className="text-[11px] text-rose-600/90 mt-0.5">Excursions or ML anomalies</div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Batch Reviews
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {stats?.batches_requiring_review ?? 0}
            </div>
            <div className="text-[11px] text-amber-600/90 mt-0.5">High/Critical priority triage</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Open Incidents
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats?.open_incidents ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Under investigation</div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Chart Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-base font-semibold text-slate-900">
                Live Vaccine Cold-Chain Telemetry Stream
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous readings visualized against standard WHO vaccine storage envelope [+2.0°C to +8.0°C].
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-0.5 bg-sky-500 rounded-full inline-block"></span>
              <span>Sensor Temperature</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>ML Pattern Anomaly</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              <span>Threshold Breach</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis
                  domain={[-3, 14]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  unit="°C"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl border border-slate-700 space-y-1">
                          <div className="font-semibold text-sky-400">{data.shipment}</div>
                          <div className="text-slate-300">Timestamp: {data.name}</div>
                          <div className="text-lg font-bold text-white">{data.temp}°C</div>
                          <div className="text-slate-400">Relative Humidity: {data.humidity}%</div>
                          <div className="text-xs pt-1 border-t border-slate-800">
                            AI Anomaly Score:{' '}
                            <span
                              className={
                                data.score >= 0.55
                                  ? 'text-rose-400 font-bold'
                                  : 'text-emerald-400'
                              }
                            >
                              {(data.score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* 2.0°C and 8.0°C WHO Boundaries */}
                <ReferenceLine
                  y={8.0}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Upper Max (+8°C)', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }}
                />
                <ReferenceLine
                  y={2.0}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  label={{ value: 'Lower Min (+2°C)', position: 'insideBottomRight', fill: '#3b82f6', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  name="Temperature"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#0284c7' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  name="Threshold Breach"
                  stroke="#ef4444"
                  strokeWidth={0}
                  dot={{ r: 5, fill: '#ef4444', stroke: '#fee2e2', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="mlAnomaly"
                  name="AI Anomaly"
                  stroke="#f59e0b"
                  strokeWidth={0}
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#fef3c7', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Waiting for initial telemetry readings from simulator...
            </div>
          )}
        </div>
      </div>

      {/* Grid: Active Shipments Overview & Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Shipments Card List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              Active Monitored Shipments
            </h3>
            <button
              onClick={() => onNavigate('shipments')}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
            >
              View all ({shipments.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {shipments.map((s) => (
              <div
                key={s.id}
                onClick={() => onNavigate('shipments')}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{s.id}</span>
                    <StatusBadge type="status" value={s.status} />
                  </div>
                  <div className="text-xs font-medium text-slate-700">{s.vaccine_name}</div>
                  <div className="text-[11px] text-slate-500">
                    {s.origin.split('(')[0]} → {s.destination.split(',')[0]}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">
                    {s.latest_temp !== undefined && s.latest_temp !== null
                      ? `${s.latest_temp.toFixed(1)}°C`
                      : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Target: [{s.target_temp_min}°C - {s.target_temp_max}°C]
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents Card List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Recent Alerts & Incidents
            </h3>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
            >
              Manage all ({incidents.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {incidents.slice(0, 4).map((inc) => (
              <div
                key={inc.id}
                onClick={() => onNavigate('alerts')}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900">{inc.title}</span>
                  <StatusBadge type="severity" value={inc.severity} />
                </div>
                <p className="text-xs text-slate-600 line-clamp-1">{inc.description}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Linked: <strong className="text-slate-600">{inc.shipment_id}</strong>
                    {inc.batch_id ? ` (${inc.batch_id})` : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(inc.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
