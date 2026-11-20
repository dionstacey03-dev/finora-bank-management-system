import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  padding = 'md',
}) => {
  const padClass =
    padding === 'none'
      ? ''
      : padding === 'sm'
        ? 'p-4'
        : padding === 'lg'
          ? 'p-6 sm:p-7'
          : 'p-5 sm:p-6';

  return (
    <section
      className={`rounded-2xl bg-white border border-slate-300/85 shadow-sm dark:shadow-none dark:bg-[#0D182E]/75 dark:backdrop-blur-xl dark:border-slate-700/40 ${padClass} ${className}`}
    >
      {children}
    </section>
  );
};
