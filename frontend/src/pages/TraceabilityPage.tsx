import React, { useState, useEffect } from 'react';
import {
  GitFork,
  MapPin,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Info,
  Check,
  Send
} from 'lucide-react';
import { Checkpoint, ShipmentSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../api/client';

interface TraceabilityPageProps {
  shipments: ShipmentSummary[];
}

export const TraceabilityPage: React.FC<TraceabilityPageProps> = ({ shipments }) => {
  const [selectedShipment, setSelectedShipment] = useState(shipments[0]?.id || 'SHP-7041');
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [signingId, setSigningId] = useState<number | null>(null);
  const [signNotes, setSignNotes] = useState('');

  const fetchCheckpoints = () => {
    if (!selectedShipment) return;
    setLoading(true);
    api
      .getShipmentCheckpoints(selectedShipment)
      .then((data) => setCheckpoints(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCheckpoints();
  }, [selectedShipment]);

  const handleVerify = async (checkpointId: number) => {
    try {
      await api.verifyHandoff(
        checkpointId,
        signNotes || 'Verified by authorized clinical recipient. Cold seal intact.'
      );
      setSigningId(null);
      setSignNotes('');
      fetchCheckpoints();
    } catch (err: any) {
      alert(`Error verifying handoff: ${err.message}`);
    }
  };

  const currentShipment = shipments.find((s) => s.id === selectedShipment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Chain-of-Custody & Route Traceability
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulated route checkpoints, custodian handoffs, sender/receiver verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase">Consignment:</label>
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
        </div>
      </div>

      {/* Simulated GPS & Route Notice (Crucial hackathon compliance rule) */}
      <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-900 leading-relaxed">
          <strong className="font-semibold">Simulated Telemetry Disclaimer:</strong> All route coordinates, GPS approximations, and checkpoint transit logs presented below are synthetic test models generated for hackathon demonstration. ColdTrace does not connect to live satellites or physical vehicle telematics units.
        </div>
      </div>

      {/* Shipment Route Overview Card */}
      {currentShipment && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900">{currentShipment.id}</span>
              <StatusBadge type="status" value={currentShipment.status} />
              <span className="text-xs text-slate-500">• {currentShipment.courier}</span>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Product: <span className="text-slate-900 font-semibold">{currentShipment.vaccine_name}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Origin Facility</div>
              <div className="font-semibold text-slate-800 mt-0.5">{currentShipment.origin}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Destination Clinic</div>
              <div className="font-semibold text-slate-800 mt-0.5">{currentShipment.destination}</div>
            </div>
          </div>
        </div>
      )}

      {/* Checkpoints Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <GitFork className="w-4 h-4 text-sky-600" />
          Sequential Route Custody Ledger
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading route ledger...</div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {checkpoints.map((cp) => {
              const isDone = cp.handoff_status === 'Completed' || cp.handoff_status === 'Verified';
              const isDelayed = cp.handoff_status === 'Delayed';
              const isPending = cp.handoff_status === 'Pending';

              return (
                <div key={cp.id} className="relative group">
                  {/* Timeline circle icon */}
                  <div
                    className={`absolute -left-[30px] sm:-left-[38px] top-0.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs ${
                      isDone
                        ? 'bg-emerald-500'
                        : isDelayed
                        ? 'bg-amber-500'
                        : 'bg-slate-300'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-bold">{cp.step_number}</span>
                    )}
                  </div>

                  <div className="bg-slate-50/80 hover:bg-slate-50 rounded-xl p-4 border border-slate-200/80 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Step {cp.step_number}: {cp.location_name}
                        </span>
                        <StatusBadge type="handoff" value={cp.handoff_status} />
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {cp.recorded_at ? new Date(cp.recorded_at).toLocaleString() : 'Pending ETA'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                      <div>
                        <span className="text-slate-400 font-medium">Designated Custodian:</span>{' '}
                        <strong className="text-slate-800">{cp.custodian_name}</strong>{' '}
                        <span className="text-slate-500">({cp.custodian_role})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Simulated Coordinates:</span>{' '}
                        <code className="text-[11px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {cp.simulated_coordinates}
                        </code>
                      </div>
                    </div>

                    {cp.notes && (
                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                        "{cp.notes}"
                      </div>
                    )}

                    {/* Pending Handoff Signoff Button */}
                    {isPending && (
                      <div className="pt-2 flex items-center justify-end">
                        {signingId === cp.id ? (
                          <div className="w-full flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={signNotes}
                              onChange={(e) => setSignNotes(e.target.value)}
                              placeholder="Receiver verification remarks & signature..."
                              className="text-xs p-2 border border-slate-300 rounded-lg flex-1 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <button
                              onClick={() => handleVerify(cp.id)}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Sign Receipt
                            </button>
                            <button
                              onClick={() => setSigningId(null)}
                              className="px-2 py-2 text-xs text-slate-500 hover:text-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSigningId(cp.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Perform Custody Handoff Sign-off
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
