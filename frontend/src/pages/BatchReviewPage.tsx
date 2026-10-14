import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Info,
  Clock,
  UserCheck,
  X,
  FileText
} from 'lucide-react';
import { Batch, ReviewAudit, BatchPriorityBreakdown } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../api/client';

interface BatchReviewPageProps {
  onRefreshStats: () => void;
}

export const BatchReviewPage: React.FC<BatchReviewPageProps> = ({ onRefreshStats }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [audits, setAudits] = useState<ReviewAudit[]>([]);
  const [loading, setLoading] = useState(false);

  // Review Action Modal
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [actionChoice, setActionChoice] = useState<'Under Review' | 'Quarantined' | 'Released'>('Under Review');
  const [reviewerName, setReviewerName] = useState('Dr. J. Martinez, Lead Pharmacist');
  const [reviewReason, setReviewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getBatches(), api.getReviewAudits()])
      .then(([bData, aData]) => {
        setBatches(bData);
        setAudits(aData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !reviewReason || !reviewerName) return;

    try {
      setSubmitting(true);
      await api.submitBatchAction(selectedBatch.id, actionChoice, reviewReason, reviewerName);
      setSelectedBatch(null);
      setReviewReason('');
      loadData();
      onRefreshStats();
    } catch (err: any) {
      alert(`Error recording batch review: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Batch Review & Quarantine Triage
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Transparent priority scoring engine based on excursion severity, cumulative duration, and handoff integrity.
          </p>
        </div>
      </div>

      {/* Critical Medical Ethics Notice */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-bold text-amber-950 uppercase tracking-wide block mb-1">
              Ethical Healthcare Guardrail: Human-in-the-Loop Decisioning
            </strong>
            ColdTrace calculates transparent priority scores (0 to 100) purely to prioritize human inspection order.{' '}
            <span className="underline font-semibold">
              The AI never automatically declares vaccines safe or spoiled.
            </span>{' '}
            Formal release, quarantine, or stability testing determinations require authorized clinical pharmacist evaluation and digital signature.
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" />
            Vaccine Batches Under Monitored Custody ({batches.length})
          </h3>
          <span className="text-xs text-slate-400">Ordered by Priority Score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Batch ID</th>
                <th className="px-4 py-3">Shipment</th>
                <th className="px-4 py-3">Formulation & Doses</th>
                <th className="px-4 py-3">Priority Score</th>
                <th className="px-4 py-3">Triage Level</th>
                <th className="px-4 py-3">Review Status</th>
                <th className="px-4 py-3">Authorized Sign-off</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b) => {
                let breakdown: BatchPriorityBreakdown | null = null;
                try {
                  if (b.priority_breakdown) breakdown = JSON.parse(b.priority_breakdown);
                } catch (e) {}

                return (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                      {b.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {b.shipment_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{b.vaccine_type}</div>
                      <div className="text-[10px] text-slate-400">
                        {b.quantity_doses.toLocaleString()} doses • Exp: {b.expiry_date}
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-bold text-slate-900">{b.priority_score} / 100</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-rose-500 h-2"
                          style={{ width: `${breakdown?.severity_points || 0}%` }}
                          title={`Severity: ${breakdown?.severity_points || 0} pts`}
                        ></div>
                        <div
                          className="bg-amber-500 h-2"
                          style={{ width: `${breakdown?.duration_points || 0}%` }}
                          title={`Duration: ${breakdown?.duration_points || 0} pts`}
                        ></div>
                        <div
                          className="bg-blue-500 h-2"
                          style={{ width: `${breakdown?.handoff_points || 0}%` }}
                          title={`Handoffs: ${breakdown?.handoff_points || 0} pts`}
                        ></div>
                        <div
                          className="bg-indigo-500 h-2"
                          style={{ width: `${breakdown?.ml_points || 0}%` }}
                          title={`ML Risk: ${breakdown?.ml_points || 0} pts`}
                        ></div>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 flex justify-between">
                        <span>Sev: {breakdown?.severity_points || 0}</span>
                        <span>Dur: {breakdown?.duration_points || 0}</span>
                        <span>Handoff: {breakdown?.handoff_points || 0}</span>
                        <span>ML: {breakdown?.ml_points || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="priority" value={b.priority_level} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="review" value={b.review_status} />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {b.reviewed_by ? (
                        <div>
                          <div className="font-medium text-slate-900 text-[11px] line-clamp-1">
                            {b.reviewed_by}
                          </div>
                          {b.review_reason && (
                            <div className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5">
                              "{b.review_reason}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Pending clinical review</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedBatch(b);
                          setActionChoice(b.review_status === 'Standard' ? 'Under Review' : b.review_status as any);
                          setReviewReason(b.review_reason || '');
                        }}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
                      >
                        Review / Triage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Quarantine Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSubmitReview}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Authorized Batch Decision: {selectedBatch.id}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shipment {selectedBatch.shipment_id} • Priority Score: {selectedBatch.priority_score}/100
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Select Action Determination
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionChoice('Under Review')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs transition-colors ${
                      actionChoice === 'Under Review'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Under Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionChoice('Quarantined')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs transition-colors ${
                      actionChoice === 'Quarantined'
                        ? 'bg-rose-100 text-rose-900 border-rose-400 ring-1 ring-rose-400'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Quarantine Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionChoice('Released')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs transition-colors ${
                      actionChoice === 'Released'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Release for Use
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Authorized Reviewer Signature & Role
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Vance, Lead QA Pharmacist"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Clinical / Stability Justification (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Detail rationale: e.g., cumulative time above 8°C was 14 mins; manufacturer stability budget allows 20 mins; vaccine potency test scheduled..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                <strong>Audit Compliance:</strong> This determination will be indelibly saved to the local SQLite audit log with your digital signature and timestamp.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  {submitting ? 'Recording...' : 'Commit Determination'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Review Audit Trail Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-slate-600" />
          Immutable Clinical Audit Trail ({audits.length} Records)
        </h3>

        {audits.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">
            No human review actions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {audits.map((a) => (
              <div key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono">{a.batch_id}</span>
                    <span className="font-semibold text-slate-800">{a.action}</span>
                    <span className="text-slate-400">• by {a.actor_name} ({a.actor_role})</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">"{a.reason}"</p>
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(a.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
