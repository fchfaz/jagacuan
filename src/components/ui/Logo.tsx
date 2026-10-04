import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="logoShield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
            <linearGradient id="logoCoin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          {/* Shield */}
          <path
            d="M 256 60 C 335 60 415 95 415 95 C 415 285 320 395 256 445 C 192 395 97 285 97 95 C 97 95 177 60 256 60 Z"
            fill="url(#logoShield)"
          />
          {/* Coin */}
          <circle cx="256" cy="245" r="95" fill="url(#logoCoin)" />
          <circle
            cx="256"
            cy="245"
            r="78"
            fill="none"
            stroke="#D97706"
            strokeWidth="5"
            strokeDasharray="8 6"
          />
          <text
            x="256"
            y="266"
            fontFamily="system-ui, sans-serif"
            fontSize="72"
            fontWeight="900"
            fill="#78350F"
            textAnchor="middle"
          >
            Rp
          </text>
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight text-slate-900 dark:text-white ${titleSizes[size]}`}>
            Jaga<span className="text-indigo-600 dark:text-indigo-400">Cuan</span>
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Catat. Atur. Jaga cuanmu.
          </span>
        )}
      </div>
    </div>
  );
};
