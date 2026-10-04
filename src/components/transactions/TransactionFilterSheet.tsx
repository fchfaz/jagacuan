import React from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import type { Account, Category } from '../../types';
import { RotateCcw, Filter } from 'lucide-react';

export interface FilterState {
  search: string;
  type: string; // 'all' | 'income' | 'expense' | 'transfer'
  categoryId: string; // '' for all
  accountId: string; // '' for all
  startDate: string;
  endDate: string;
}

interface TransactionFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  accounts: Account[];
  categories: Category[];
}

export const TransactionFilterSheet: React.FC<TransactionFilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  accounts,
  categories,
}) => {
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  const handleReset = () => {
    const emptyFilters: FilterState = {
      search: '',
      type: 'all',
      categoryId: '',
      accountId: '',
      startDate: '',
      endDate: '',
    };
    setLocalFilters(emptyFilters);
    onApplyFilters(emptyFilters);
    onClose();
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Transaksi"
      description="Saring transaksi berdasarkan kriteria spesifik"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Tipe Transaksi */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Jenis Transaksi
          </label>
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'expense', label: 'Keluar' },
              { id: 'income', label: 'Masuk' },
              { id: 'transfer', label: 'Transfer' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setLocalFilters((prev) => ({ ...prev, type: t.id }))}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  localFilters.type === t.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dompet / Akun */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Dompet / Rekening
          </label>
          <select
            value={localFilters.accountId}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, accountId: e.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none"
          >
            <option value="">Semua Dompet</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Kategori */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Kategori
          </label>
          <select
            value={localFilters.categoryId}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, categoryId: e.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type === 'income' ? 'Masuk' : 'Keluar'})
              </option>
            ))}
          </select>
        </div>

        {/* Rentang Tanggal */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={localFilters.startDate}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={localFilters.endDate}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex-1 gap-1.5 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleApply}
            className="flex-1 gap-1.5 text-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Terapkan Filter</span>
          </Button>
        </div>
      </div>
    </Sheet>
  );
};
