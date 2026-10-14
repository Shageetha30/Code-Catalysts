import React, { useState, useEffect } from 'react';
import { NoticeBanner } from './components/NoticeBanner';
import { Navbar } from './components/Navbar';
import { Sidebar, PageId } from './components/Sidebar';
import { SimulatorModal } from './components/SimulatorModal';
import { DashboardPage } from './pages/DashboardPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { AlertsPage } from './pages/AlertsPage';
import { TraceabilityPage } from './pages/TraceabilityPage';
import { BatchReviewPage } from './pages/BatchReviewPage';
import { MLModelLabPage } from './pages/MLModelLabPage';
import { api, API_BASE } from './api/client';
import { DashboardStats, ShipmentSummary, Reading, Incident, SimulatorStatus } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [telemetry, setTelemetry] = useState<Reading[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [simulatorStatus, setSimulatorStatus] = useState<SimulatorStatus | null>(null);
  const [isExcursionModalOpen, setIsExcursionModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchGlobalData = async () => {
    try {
      const [sData, shpData, tData, iData, simData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getShipments().catch(() => []),
        api.getLatestTelemetry().catch(() => []),
        api.getIncidents().catch(() => []),
        api.getSimulatorStatus().catch(() => null),
      ]);

      if (sData) setStats(sData);
      setShipments(shpData);
      setTelemetry(tData);
      setIncidents(iData);
      if (simData) setSimulatorStatus(simData);
      setApiError(null);
    } catch (err: any) {
      console.error('Polling error:', err);
      setApiError(err.message || 'Unable to connect to ColdTrace backend API');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSimulator = async () => {
    if (!simulatorStatus) return;
    try {
      if (simulatorStatus.is_running) {
        await api.pauseSimulator();
      } else {
        await api.startSimulator();
      }
      const newStatus = await api.getSimulatorStatus();
      setSimulatorStatus(newStatus);
    } catch (err: any) {
      console.error('Error toggling simulator:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* 1. Notice Banner: Simulated data not for clinical use */}
      <NoticeBanner />

      {/* 2. Top Navigation Bar */}
      <Navbar
        simulatorStatus={simulatorStatus}
        onToggleSimulator={handleToggleSimulator}
        onOpenExcursionModal={() => setIsExcursionModalOpen(true)}
      />

      {/* Main Body with Sidebar + Active Page */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          openIncidentsCount={stats?.open_incidents || 0}
          batchesReviewCount={stats?.batches_requiring_review || 0}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Backend Connection Issue:</strong>
                <p className="text-xs text-rose-700 mt-0.5">{apiError}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Target API: <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono text-rose-800">{API_BASE}</code>. Ensure your FastAPI backend service is running and CORS is configured to allow this frontend origin.
                </p>
              </div>
            </div>
          )}

          {initialLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              <span className="text-xs font-medium">Connecting to ColdTrace telemetry database...</span>
            </div>
          ) : (
            <>
              {currentPage === 'dashboard' && (
                <DashboardPage
                  stats={stats}
                  shipments={shipments}
                  telemetry={telemetry}
                  incidents={incidents}
                  onNavigate={setCurrentPage}
                  onOpenExcursionModal={() => setIsExcursionModalOpen(true)}
                />
              )}

              {currentPage === 'shipments' && (
                <ShipmentsPage
                  shipments={shipments}
                  onOpenExcursionModal={() => setIsExcursionModalOpen(true)}
                />
              )}

              {currentPage === 'telemetry' && (
                <TelemetryPage
                  shipments={shipments}
                  simulatorStatus={simulatorStatus}
                  onToggleSimulator={handleToggleSimulator}
                  onRefresh={fetchGlobalData}
                />
              )}

              {currentPage === 'alerts' && (
                <AlertsPage
                  incidents={incidents}
                  shipments={shipments}
                  onRefresh={fetchGlobalData}
                />
              )}

              {currentPage === 'traceability' && (
                <TraceabilityPage shipments={shipments} />
              )}

              {currentPage === 'review' && (
                <BatchReviewPage onRefreshStats={fetchGlobalData} />
              )}

              {currentPage === 'mllab' && <MLModelLabPage />}
            </>
          )}
        </main>
      </div>

      {/* Simulator Excursion Modal */}
      <SimulatorModal
        isOpen={isExcursionModalOpen}
        onClose={() => setIsExcursionModalOpen(false)}
        shipments={shipments}
        onTriggered={fetchGlobalData}
      />
    </div>
  );
};

export default App;
