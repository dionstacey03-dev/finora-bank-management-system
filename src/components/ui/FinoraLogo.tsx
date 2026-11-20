import React from 'react';

interface FinoraLogoProps {
  compact?: boolean;
}

export const FinoraLogo: React.FC<FinoraLogoProps> = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-3 select-none whitespace-nowrap shrink-0">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          fill="#0B1730"
          stroke="url(#finora_stroke)"
          strokeWidth="1.25"
        />
        <path
          d="M9.5 10.5H22.5M9.5 16H19M9.5 10.5V22.5"
          stroke="#22D3EE"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="21.5" cy="20.5" r="2.25" fill="#F0F6FC" />
        <defs>
          <linearGradient id="finora_stroke" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22D3EE" stopOpacity="0.85" />
            <stop offset="1" stopColor="#334155" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-[0.08em] text-slate-900 dark:text-[#F0F6FC]">
          FINORA
        </span>
      )}
    </div>
  );
};
