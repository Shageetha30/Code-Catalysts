import React from 'react';
import { AlertCircle } from 'lucide-react';

export const NoticeBanner: React.FC = () => {
  return (
    <aside aria-label="Simulated prototype notice" className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
      <div className="flex items-center gap-2 mx-auto font-medium">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Notice:</strong> Hackathon prototype — simulated data — not for clinical use.
        </span>
      </div>
    </aside>
  );
};
