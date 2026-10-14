import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  BarChart2,
  Layers,
  HelpCircle,
  Flame,
  Snowflake
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { AnomalyDetectionResponse, EvaluationMetrics } from '../types';
import { api } from '../api/client';

export const MLModelLabPage: React.FC = () => {
  const [testCases, setTestCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case_pre_excursion_drift');
  const [customInput, setCustomInput] = useState<string>('');
  const [activeWindow, setActiveWindow] = useState<number[]>([4.8, 5.1, 5.5, 5.9, 6.3, 6.7, 7.1, 7.4, 7.7, 7.9]);
  const [detectionResult, setDetectionResult] = useState<AnomalyDetectionResponse | null>(null);
  const [evalMetrics, setEvalMetrics] = useState<EvaluationMetrics | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [testing, setTesting] = useState(false);

  // Load test cases & evaluation metrics on mount
  useEffect(() => {
    api.getSyntheticTestCases().then((res) => {
      setTestCases(res.test_cases);
    });

    setEvaluating(true);
    api.evaluateModel()
      .then((m) => setEvalMetrics(m))
      .catch((err) => console.error(err))
      .finally(() => setEvaluating(false));
  }, []);

  // Run detection whenever active window changes
  useEffect(() => {
    if (activeWindow.length >= 3) {
      setTesting(true);
      api.detectAnomaly(activeWindow)
        .then((res) => setDetectionResult(res))
        .catch((err) => console.error(err))
        .finally(() => setTesting(false));
    }
  }, [activeWindow]);

  const handleSelectCase = (tc: any) => {
    setSelectedCaseId(tc.id);
    setActiveWindow(tc.readings);
    setCustomInput(tc.readings.join(', '));
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customInput
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (parsed.length >= 3) {
      setSelectedCaseId('custom');
      setActiveWindow(parsed);
    } else {
      alert('Please enter at least 3 valid temperature numbers separated by commas.');
    }
  };

  const chartData = activeWindow.map((temp, i) => ({
    step: `T-${activeWindow.length - 1 - i}`,
    temp,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Anomaly Lab (scikit-learn Isolation Forest)
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Genuine ML Model
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Interactive sandbox: evaluate live model accuracy and test synthetic cold-chain failure profiles.
          </p>
        </div>
      </div>

      {/* Held-out Synthetic Evaluation Metrics Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/40 pb-4 mb-4">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              Empirical Model Validation
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Trained on Engineered Kinematics • Tested on Held-Out Synthetic Telemetry
            </h3>
          </div>
          <button
            onClick={() => {
              setEvaluating(true);
              api.evaluateModel()
                .then((m) => setEvalMetrics(m))
                .finally(() => setEvaluating(false));
            }}
            disabled={evaluating}
            className="px-3 py-1.5 bg-indigo-600/60 hover:bg-indigo-600 rounded-lg text-xs font-semibold text-white border border-indigo-400/30 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            Re-evaluate Model
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-indigo-800/40">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Test Accuracy</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {evalMetrics ? `${(evalMetrics.accuracy * 100).toFixed(1)}%` : '...'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across {evalMetrics?.test_samples_total || 400} test windows</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-indigo-800/40">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">True Positive Rate (TPR)</div>
            <div className="text-2xl font-extrabold text-sky-400 mt-1">
              {evalMetrics ? `${(evalMetrics.true_positive_rate * 100).toFixed(1)}%` : '...'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Anomaly sensitivity rate</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-indigo-800/40">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">False Positive Rate (FPR)</div>
            <div className="text-2xl font-extrabold text-indigo-300 mt-1">
              {evalMetrics ? `${(evalMetrics.false_positive_rate * 100).toFixed(1)}%` : '...'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Low nuisance false alarms</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-indigo-800/40">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Test Set Distribution</div>
            <div className="text-lg font-bold text-slate-200 mt-1">
              {evalMetrics?.normal_samples} Norm / {evalMetrics?.abnormal_samples} Anom
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Dual-distribution balance</div>
          </div>
        </div>
      </div>

      {/* Interactive Synthetic Scenario Picker */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Select Synthetic Cold-Chain Scenario to Test
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {testCases.map((tc) => {
            const isSelected = selectedCaseId === tc.id;
            return (
              <button
                key={tc.id}
                onClick={() => handleSelectCase(tc)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-snug">{tc.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {tc.description}
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-indigo-600">
                  Expected: {tc.expected_category}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Input Bar */}
        <form onSubmit={handleApplyCustom} className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Or type custom sequential temperatures (e.g. 4.2, 4.8, 5.5, 6.4, 7.8, 9.2)"
            className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-xs transition-colors"
          >
            Run Custom Vector
          </button>
        </form>
      </div>

      {/* Real-Time Detection Inference Results Card */}
      {detectionResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Sequence Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Input Temperature Sliding Window ({activeWindow.length} readings)
                </h3>
                <p className="text-xs text-slate-500">Evaluated against WHO [+2.0°C - +8.0°C] bounds</p>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-slate-600">
                <span>Range: [{Math.min(...activeWindow).toFixed(1)}°C - {Math.max(...activeWindow).toFixed(1)}°C]</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="step" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis domain={[-3, 14]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" unit="°C" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-xl border border-slate-700">
                            <span className="font-bold text-sky-400">{payload[0].payload.step}</span>:{' '}
                            {payload[0].payload.temp}°C
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={8.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Upper Limit (+8°C)', fill: '#ef4444', fontSize: 10 }} />
                  <ReferenceLine y={2.0} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'Lower Limit (+2°C)', fill: '#3b82f6', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke={detectionResult.is_anomaly ? '#ef4444' : '#0284c7'}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: detectionResult.is_anomaly ? '#ef4444' : '#0284c7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Inference Diagnostics */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs uppercase font-bold text-slate-400">Model Inference</span>
                <span className="text-[10px] font-mono text-slate-500">{detectionResult.model_type}</span>
              </div>

              {/* Status Header */}
              <div className="mt-4 p-4 rounded-xl text-center border space-y-1 bg-slate-50">
                <div
                  className={`text-lg font-bold ${
                    detectionResult.is_anomaly ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {detectionResult.prediction_label}
                </div>
                <div className="text-xs text-slate-500">
                  Calculated Anomaly Score:{' '}
                  <strong className="text-slate-900 font-bold">
                    {(detectionResult.anomaly_score * 100).toFixed(0)}%
                  </strong>{' '}
                  (Raw decision score: {detectionResult.raw_decision_score})
                </div>
              </div>

              {/* Explanation Text */}
              <div className="mt-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Diagnostic Explanation
                </span>
                <p className="text-xs text-slate-700 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100/80 leading-relaxed">
                  {detectionResult.explanation}
                </p>
              </div>

              {/* Extracted Kinematic Features Grid */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Extracted Kinematic Features (8-D Vector)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block">Velocity (dT/dt):</span>
                    <strong className="text-slate-800">
                      {detectionResult.feature_insights.velocity_rate > 0 ? '+' : ''}
                      {detectionResult.feature_insights.velocity_rate}°C/step
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block">Std Dev Volatility:</span>
                    <strong className="text-slate-800">
                      {detectionResult.feature_insights.volatility_std}°C
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block">Peak-to-Peak Span:</span>
                    <strong className="text-slate-800">
                      {detectionResult.feature_insights.span_range}°C
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block">Cycle Sign Flips:</span>
                    <strong className="text-slate-800">
                      {detectionResult.feature_insights.oscillation_flips} flips
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              Isolation Forest computes path lengths in random feature partitions. Outliers isolate in very few splits.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
