import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatMonthYear } from '../../lib/format';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const MonthPicker: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentMonth, goToPrevMonth, goToNextMonth, goToCurrentMonth } = useAppStore();
  const currentRealMonth = format(new Date(), 'yyyy-MM');
  const isNotCurrentMonth = currentMonth !== currentRealMonth;

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <button
        type="button"
        aria-label="Bulan sebelumnya"
        onClick={goToPrevMonth}
        className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1.5 px-2">
        <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className={`font-semibold text-slate-800 dark:text-slate-100 tabular-nums ${compact ? 'text-xs' : 'text-sm'}`}>
          {formatMonthYear(currentMonth)}
        </span>
      </div>

      <button
        type="button"
        aria-label="Bulan berikutnya"
        onClick={goToNextMonth}
        className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {isNotCurrentMonth && (
        <button
          type="button"
          onClick={goToCurrentMonth}
          title="Kembali ke bulan ini"
          className="ml-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
        >
          Bulan ini
        </button>
      )}
    </div>
  );
};
