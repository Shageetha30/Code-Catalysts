import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Activity,
  AlertTriangle,
  GitFork,
  ClipboardCheck,
  Cpu
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'shipments'
  | 'telemetry'
  | 'alerts'
  | 'traceability'
  | 'review'
  | 'mllab';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  openIncidentsCount: number;
  batchesReviewCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  openIncidentsCount,
  batchesReviewCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageId,
      name: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'shipments' as PageId,
      name: 'Shipments & Inventory',
      icon: Truck,
      badge: null,
    },
    {
      id: 'telemetry' as PageId,
      name: 'Telemetry Monitoring',
      icon: Activity,
      badge: 'Live',
    },
    {
      id: 'alerts' as PageId,
      name: 'Alerts & Incidents',
      icon: AlertTriangle,
      badge: openIncidentsCount > 0 ? `${openIncidentsCount}` : null,
      badgeColor: 'bg-rose-100 text-rose-700 font-semibold',
    },
    {
      id: 'traceability' as PageId,
      name: 'Traceability & Handoffs',
      icon: GitFork,
      badge: null,
    },
    {
      id: 'review' as PageId,
      name: 'Batch Priority Review',
      icon: ClipboardCheck,
      badge: batchesReviewCount > 0 ? `${batchesReviewCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-semibold',
    },
    {
      id: 'mllab' as PageId,
      name: 'AI Anomaly Lab (ML)',
      icon: Cpu,
      badge: 'scikit-learn',
      badgeColor: 'bg-indigo-100 text-indigo-700 font-medium',
    },
  ];

  return (
    <nav aria-label="Sidebar navigation" className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-2">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    item.badgeColor
                      ? item.badgeColor
                      : isActive
                      ? 'bg-sky-500/30 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-slate-800/80">
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs border border-slate-700/50">
          <div className="font-semibold text-slate-200">System Mode</div>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Vaccine Cold Chain Spec: <span className="text-sky-400 font-mono">+2.0°C to +8.0°C</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Local SQLite Persistence</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
