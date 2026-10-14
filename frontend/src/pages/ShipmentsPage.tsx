import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  X,
  MapPin,
  Clock,
  Thermometer,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { ShipmentSummary, ShipmentDetail } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../api/client';

interface ShipmentsPageProps {
  shipments: ShipmentSummary[];
  onOpenExcursionModal: () => void;
}

export const ShipmentsPage: React.FC<ShipmentsPageProps> = ({
  shipments,
  onOpenExcursionModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [shipmentDetail, setShipmentDetail] = useState<ShipmentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (selectedShipmentId) {
      setLoadingDetail(true);
      api
        .getShipmentDetail(selectedShipmentId)
        .then((data) => setShipmentDetail(data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingDetail(false));
    } else {
      setShipmentDetail(null);
    }
  }, [selectedShipmentId]);

  const filtered = shipments.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.vaccine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && s.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Active Vaccine Shipments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end monitored cold-chain consignments with designated WHO thermal boundaries.
          </p>
        </div>
        <button
          onClick={onOpenExcursionModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
        >
          <Flame className="w-4 h-4 text-amber-600 fill-current" />
          Simulate Thermal Excursion
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, vaccine, destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          {['all', 'normal', 'alert'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'all' ? 'All Consignments' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedShipmentId(s.id)}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                  {s.id}
                </span>
                <StatusBadge type="status" value={s.status} />
              </div>

              <div>
                <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">
                  {s.vaccine_name}
                </h4>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-1">To: {s.destination}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Current Temp</div>
                  <div
                    className={`font-bold text-sm mt-0.5 ${
                      s.latest_temp && (s.latest_temp > s.target_temp_max || s.latest_temp < s.target_temp_min)
                        ? 'text-rose-600 font-extrabold'
                        : 'text-slate-800'
                    }`}
                  >
                    {s.latest_temp !== undefined && s.latest_temp !== null
                      ? `${s.latest_temp.toFixed(1)}°C`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">WHO Target Spec</div>
                  <div className="font-semibold text-slate-700 mt-0.5">
                    +{s.target_temp_min}°C to +{s.target_temp_max}°C
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {s.batch_count} Batch{s.batch_count !== 1 ? 'es' : ''}
              </span>
              <span className="text-sky-600 font-medium flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                Inspect Details
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Shipment Details Drawer Modal */}
      {selectedShipmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {loadingDetail || !shipmentDetail ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading shipment records and batch ledger...
              </div>
            ) : (
              <div>
                <div className="bg-slate-900 text-white p-6 flex items-center justify-between rounded-t-2xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{shipmentDetail.id}</h3>
                      <StatusBadge type="status" value={shipmentDetail.status} />
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {shipmentDetail.vaccine_name} • Courier: {shipmentDetail.courier}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedShipmentId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Origin to Destination */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Origin Facility</div>
                      <div className="font-semibold text-slate-800 mt-1">{shipmentDetail.origin}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Destination Bay</div>
                      <div className="font-semibold text-slate-800 mt-1">{shipmentDetail.destination}</div>
                    </div>
                  </div>

                  {/* Linked Batches */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-600" />
                      Associated Vaccine Batches
                    </h4>
                    <div className="space-y-2">
                      {shipmentDetail.batches.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{b.id}</div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {b.vaccine_type} • {b.quantity_doses.toLocaleString()} doses • Exp: {b.expiry_date}
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusBadge type="review" value={b.review_status} />
                            <div className="text-[10px] text-slate-500 mt-1">
                              Priority Score: <strong className="text-slate-800">{b.priority_score}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Route Checkpoints */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      Chain-of-Custody Checkpoint Sequence
                    </h4>
                    <div className="border-l-2 border-slate-200 ml-3 pl-4 space-y-3 text-xs">
                      {shipmentDetail.checkpoints.map((cp) => (
                        <div key={cp.id} className="relative">
                          <span
                            className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                              cp.handoff_status === 'Completed' || cp.handoff_status === 'Verified'
                                ? 'bg-emerald-500'
                                : cp.handoff_status === 'Delayed'
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                            }`}
                          ></span>
                          <div className="font-semibold text-slate-800">
                            {cp.step_number}. {cp.location_name}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Custodian: {cp.custodian_name} ({cp.custodian_role}) •{' '}
                            <span className="font-medium text-slate-600">{cp.handoff_status}</span>
                          </div>
                          {cp.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 italic">
                              "{cp.notes}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Open Incidents */}
                  {shipmentDetail.incidents.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        Recorded Incident Records ({shipmentDetail.incidents.length})
                      </h4>
                      <div className="space-y-2">
                        {shipmentDetail.incidents.map((inc) => (
                          <div
                            key={inc.id}
                            className="p-3 rounded-lg border border-rose-200 bg-rose-50/40 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{inc.title}</span>
                              <StatusBadge type="severity" value={inc.severity} />
                            </div>
                            <p className="text-slate-600 text-[11px]">{inc.description}</p>
                            <div className="text-[10px] text-slate-400">
                              Status: <strong className="text-slate-600">{inc.status}</strong> • Recorded:{' '}
                              {new Date(inc.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end rounded-b-2xl">
                  <button
                    onClick={() => setSelectedShipmentId(null)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Close Consignment View
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
