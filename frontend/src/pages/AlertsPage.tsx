import React, { useState } from 'react';
import {
  AlertTriangle,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  PlusCircle,
  FileText,
  X,
  TrendingUp,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { Incident, ShipmentSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../api/client';

interface AlertsPageProps {
  incidents: Incident[];
  shipments: ShipmentSummary[];
  onRefresh: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  incidents,
  shipments,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'comparison'>('incidents');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // New incident modal
  const [isCreating, setIsCreating] = useState(false);
  const [newShipmentId, setNewShipmentId] = useState(shipments[0]?.id || 'SHP-7041');
  const [newType, setNewType] = useState('Temperature Threshold');
  const [newSeverity, setNewSeverity] = useState('High');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter === 'all') return true;
    return inc.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIncident) return;
    try {
      setIsUpdating(true);
      await api.updateIncidentStatus(selectedIncident.id, newStatus, resolutionNotes);
      setSelectedIncident(null);
      setResolutionNotes('');
      onRefresh();
    } catch (err: any) {
      alert(`Error updating incident: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    try {
      setIsUpdating(true);
      await api.createIncident({
        shipment_id: newShipmentId,
        incident_type: newType,
        severity: newSeverity,
        title: newTitle,
        description: newDesc,
      });
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      onRefresh();
    } catch (err: any) {
      alert(`Error creating incident: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Alerts & Incident Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Separation of rule-based temperature threshold alarms from AI pattern anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
              activeTab === 'comparison'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            AI vs Threshold Logic
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Log Incident
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'incidents'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Incident Tickets Ledger ({incidents.length})
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'comparison'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          AI Anomaly vs. Threshold Logic Comparison
        </button>
      </div>

      {activeTab === 'incidents' ? (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
            {['all', 'open', 'investigating', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Incidents Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Incident ID</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Consignment & Batch</th>
                    <th className="px-4 py-3">Title & Summary</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Logged</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {inc.id}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                            inc.incident_type === 'ML Pattern Anomaly'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inc.incident_type === 'ML Pattern Anomaly' ? (
                            <Cpu className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {inc.incident_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{inc.shipment_id}</div>
                        {inc.batch_id && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Batch: {inc.batch_id}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <div className="font-semibold text-slate-900">{inc.title}</div>
                        <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                          {inc.description}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge type="severity" value={inc.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inc.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inc.status === 'Investigating'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(inc.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedIncident(inc);
                            setResolutionNotes(inc.resolution_notes || '');
                          }}
                          className="px-2.5 py-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded border border-sky-200 font-medium text-[11px] transition-colors"
                        >
                          Triage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* AI vs Threshold Logic Comparison Tab */
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <Cpu className="w-4 h-4" />
              Machine Learning Architecture Spotlight
            </div>
            <h2 className="text-xl font-bold mt-1">
              Why ColdTrace Combines Thresholds with scikit-learn Isolation Forest
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Standard cold-chain loggers only ring alarms when the physical boundary is breached (&gt;8.0°C or &lt;2.0°C). By the time an alarm rings, vaccines may have already absorbed dangerous cumulative heat or freeze damage. ColdTrace trains an Isolation Forest on multi-variable kinematic features to flag anomalous trends <strong>before</strong> the physical boundary is ever crossed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional Thresholds Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Traditional Rule-Based Threshold Alerts
                    </h3>
                    <p className="text-xs text-slate-500">Fixed static boundary: T &lt; 2°C or T &gt; 8°C</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Reactive
                </span>
              </div>

              <ul className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>100% Deterministic:</strong> Guaranteed to catch any explicit limit breach.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Blind to Early Warning:</strong> If temperature rises rapidly from 4°C to 7.8°C (+1.2°C/min), threshold logic remains completely silent because 7.8°C &lt; 8.0°C.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Ignorant of Kinematics:</strong> Cannot detect sensor oscillations, loose probes, or refrigeration compressor cycle failure.</span>
                </li>
              </ul>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800">Trigger Formula:</span>
                <code className="block mt-1 font-mono text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                  is_excursion = (temperature &gt; 8.0) or (temperature &lt; 2.0)
                </code>
              </div>
            </div>

            {/* AI Anomaly Detection Card */}
            <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-xs space-y-3 ring-1 ring-indigo-500/10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      ColdTrace AI Anomaly Detector
                    </h3>
                    <p className="text-xs text-slate-500">scikit-learn Isolation Forest on 8 kinematic features</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Proactive & Predictive
                </span>
              </div>

              <ul className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Pre-Excursion Alarm:</strong> Catches rapid thermal velocity vectors minutes before crossing 8°C.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Kinematic Multi-Feature Analysis:</strong> Analyzes velocity (dT/dt), acceleration (d²T/dt²), variance, and cycling sign flips.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Explainable AI Output:</strong> Produces normalized anomaly score (0.0 to 1.0) and human-readable diagnostic explanations.</span>
                </li>
              </ul>

              <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 text-xs">
                <span className="font-semibold text-indigo-900">Feature Vector:</span>
                <code className="block mt-1 font-mono text-[10px] text-indigo-900 bg-white p-1.5 rounded border border-indigo-200">
                  [mean_temp, std_dev, velocity_dT, accel_d2T, span, max, min, sign_flips]
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Triage / Update Incident Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Incident Triage: {selectedIncident.id}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shipment: {selectedIncident.shipment_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Title</span>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {selectedIncident.title}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Description</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-0.5">
                  {selectedIncident.description}
                </p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Resolution Notes & Audit Remarks
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter actions taken, cooler inspection results, or technician sign-off..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>

                <div className="flex gap-2">
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus('Investigating')}
                    className="px-3 py-2 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg font-semibold transition-colors"
                  >
                    Mark Investigating
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus('Resolved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                  >
                    Resolve Incident
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Incident Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateIncident}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">Manually Record Incident Ticket</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Target Shipment
                </label>
                <select
                  value={newShipmentId}
                  onChange={(e) => setNewShipmentId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.vaccine_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Category
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Temperature Threshold">Temperature Threshold</option>
                    <option value="ML Pattern Anomaly">ML Pattern Anomaly</option>
                    <option value="Handoff Discrepancy">Handoff Discrepancy</option>
                    <option value="Transit Delay">Transit Delay</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Severity
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Courier Transit Delay at Checkpoint 3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail observed issue, ambient conditions, or driver notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold"
                >
                  Save Incident Ticket
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
