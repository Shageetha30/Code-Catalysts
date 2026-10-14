import React from 'react';

interface StatusBadgeProps {
  type: 'status' | 'severity' | 'priority' | 'review' | 'handoff';
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  const valLower = value.toLowerCase();

  if (type === 'status') {
    if (valLower === 'normal' || valLower === 'completed') {
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (valLower === 'alert' || valLower === 'quarantined') {
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
    } else if (valLower === 'active') {
      colorStyles = 'bg-sky-50 text-sky-700 border-sky-200';
    }
  } else if (type === 'severity' || type === 'priority') {
    if (valLower === 'critical') {
      colorStyles = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
    } else if (valLower === 'high') {
      colorStyles = 'bg-amber-100 text-amber-800 border-amber-300';
    } else if (valLower === 'medium') {
      colorStyles = 'bg-yellow-50 text-yellow-800 border-yellow-200';
    } else {
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  } else if (type === 'review') {
    if (valLower === 'quarantined') {
      colorStyles = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    } else if (valLower === 'under review') {
      colorStyles = 'bg-amber-100 text-amber-800 border-amber-300 font-medium';
    } else if (valLower === 'released') {
      colorStyles = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else {
      colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else if (type === 'handoff') {
    if (valLower === 'completed' || valLower === 'verified') {
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (valLower === 'delayed') {
      colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    } else {
      colorStyles = 'bg-sky-50 text-sky-700 border-sky-200';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles}`}
    >
      {value}
    </span>
  );
};
