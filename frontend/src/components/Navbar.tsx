import React from 'react';
import { ThermometerSnowflake, Play, Pause, Zap, Activity } from 'lucide-react';
import { SimulatorStatus } from '../types';

interface NavbarProps {
  simulatorStatus: SimulatorStatus | null;
  onToggleSimulator: () => void;
  onOpenExcursionModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  simulatorStatus,
  onToggleSimulator,
  onOpenExcursionModal,
}) => {
  const isRunning = simulatorStatus?.is_running ?? true;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <ThermometerSnowflake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Cold<span className="text-sky-600">Trace</span>
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                  AI Cold-Chain
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Intelligent Vaccine Telemetry & Anomaly Detection
              </p>
            </div>
          </div>

          {/* Real-time simulation bar */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live stream badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isRunning ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isRunning ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span className="font-medium">
                {isRunning ? 'Continuous Sensor Feed Active' : 'Simulation Paused'}
              </span>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={onToggleSimulator}
              title={isRunning ? 'Pause continuous simulation' : 'Start continuous simulation'}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isRunning
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span className="hidden sm:inline">Resume</span>
                </>
              )}
            </button>

            {/* Trigger Excursion Modal Launcher */}
            <button
              onClick={onOpenExcursionModal}
              className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Excursion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
