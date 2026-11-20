import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const sizeClass =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
        ? 'w-14 h-14 text-base'
        : 'w-10 h-10 text-sm';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-xl object-cover border border-slate-300 dark:border-slate-700/60 shrink-0 bg-slate-100 dark:bg-[#0B1730]`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClass} rounded-xl bg-cyan-50 border border-cyan-600/30 text-cyan-800 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-slate-800 dark:border-cyan-400/25 dark:text-cyan-200 font-display font-semibold flex items-center justify-center shrink-0`}
    >
      {initials || 'FN'}
    </div>
  );
};
