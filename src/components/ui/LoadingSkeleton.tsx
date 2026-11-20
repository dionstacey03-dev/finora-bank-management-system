import React from 'react';

export const TableLoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800/70" aria-busy="true" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between py-3.5 px-2 gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800/80 animate-pulse shrink-0" />
            <div className="space-y-2 flex-1 max-w-xs">
              <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800/90 animate-pulse" />
              <div className="h-2.5 w-1/2 rounded bg-slate-200/70 dark:bg-slate-800/60 animate-pulse" />
            </div>
          </div>
          <div className="hidden sm:block h-3 w-20 rounded bg-slate-200/80 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800/90 animate-pulse" />
        </div>
      ))}
    </div>
  );
};
