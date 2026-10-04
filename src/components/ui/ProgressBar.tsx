import React from 'react';

export interface ProgressBarProps {
  value: number; // Persentase (misal 65 atau 115)
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'auto' | 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'sm',
  variant = 'auto',
  showLabel = false,
  className = '',
}) => {
  // Hitung persentase murni
  const percentage = Math.max(0, Math.round((value / max) * 100));
  // Lebar visual bar dibatasi max 100% agar tidak keluar container
  const visualWidth = Math.min(percentage, 100);

  // Tentukan warna berdasarkan variant atau aturan otomatis:
  // <80% hijau (emerald), 80-99% kuning (amber), >=100% merah (rose)
  const getBarColor = () => {
    if (variant !== 'auto') {
      const colors = {
        primary: 'bg-indigo-600 dark:bg-indigo-500',
        success: 'bg-emerald-500 dark:bg-emerald-400',
        warning: 'bg-amber-500 dark:bg-amber-400',
        danger: 'bg-rose-500 dark:bg-rose-500',
      };
      return colors[variant];
    }

    if (percentage >= 100) {
      return 'bg-rose-500 dark:bg-rose-500';
    }
    if (percentage >= 80) {
      return 'bg-amber-500 dark:bg-amber-400';
    }
    return 'bg-emerald-500 dark:bg-emerald-400';
  };

  const heights = {
    xs: 'h-1.5',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Progress</span>
          <span
            className={`font-semibold tabular-nums ${
              percentage >= 100
                ? 'text-rose-600 dark:text-rose-400'
                : percentage >= 80
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {percentage}%
          </span>
        </div>
      )}

      <div
        className={`w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${heights[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${getBarColor()}`}
          style={{ width: `${visualWidth}%` }}
        />
      </div>
    </div>
  );
};
