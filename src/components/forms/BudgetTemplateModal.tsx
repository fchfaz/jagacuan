import React, { useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { formatRupiah, parseRupiah } from '../../lib/format';
import { calculate503020Rule } from '../../lib/calculations';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import type { Category } from '../../types';
import { Sparkles, Check, Info } from 'lucide-react';

interface BudgetTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyIncome: number;
  currentMonth: string;
  categories: Category[];
  onApplied: () => void;
}

export const BudgetTemplateModal: React.FC<BudgetTemplateModalProps> = ({
  isOpen,
  onClose,
  monthlyIncome,
  currentMonth,
  categories,
  onApplied,
}) => {
  const { showToast } = useAppStore();
  const [baseIncome, setBaseIncome] = useState<string>(
    monthlyIncome > 0 ? formatRupiah(monthlyIncome, false) : '5.000.000'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericIncome = parseRupiah(baseIncome);
  const breakdown = calculate503020Rule(numericIncome);

  const handleApplyTemplate = async () => {
    if (numericIncome <= 0) return;

    try {
      setIsSubmitting(true);

      // Kategori Kebutuhan (Needs) 50%
      // Dibagi proporsional: Makan (40%), Tagihan (30%), Transport (20%), Kesehatan/Lainnya (10%)
      const needsCategories = [
        { id: 'cat-food', ratio: 0.4 },
        { id: 'cat-bills', ratio: 0.3 },
        { id: 'cat-transport', ratio: 0.2 },
        { id: 'cat-health', ratio: 0.1 },
      ];

      // Kategori Keinginan (Wants) 30%
      // Belanja (60%), Hiburan (40%)
      const wantsCategories = [
        { id: 'cat-shopping', ratio: 0.6 },
        { id: 'cat-entertainment', ratio: 0.4 },
      ];

      // Kategori Tabungan / Darurat (Savings) 20%
      const savingsCategories = [
        { id: 'cat-emergency', ratio: 1.0 },
      ];

      const newBudgets = [];

      for (const item of needsCategories) {
        if (categories.some((c) => c.id === item.id)) {
          newBudgets.push({
            id: `bgt-${item.id}-${currentMonth}`,
            categoryId: item.id,
            month: currentMonth,
            limitAmount: Math.round(breakdown.needs * item.ratio),
          });
        }
      }

      for (const item of wantsCategories) {
        if (categories.some((c) => c.id === item.id)) {
          newBudgets.push({
            id: `bgt-${item.id}-${currentMonth}`,
            categoryId: item.id,
            month: currentMonth,
            limitAmount: Math.round(breakdown.wants * item.ratio),
          });
        }
      }

      for (const item of savingsCategories) {
        if (categories.some((c) => c.id === item.id)) {
          newBudgets.push({
            id: `bgt-${item.id}-${currentMonth}`,
            categoryId: item.id,
            month: currentMonth,
            limitAmount: Math.round(breakdown.savings * item.ratio),
          });
        }
      }

      await db.budgets.bulkPut(newBudgets);

      showToast({
        title: 'Template 50/30/20 Diterapkan',
        description: `Batas pengeluaran untuk ${newBudgets.length} kategori telah disesuaikan.`,
        type: 'success',
      });

      onApplied();
      onClose();
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Gagal menerapkan template',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Template Anggaran 50/30/20"
      description="Alokasikan anggaran ideal secara otomatis berdasarkan pemasukan bulanan"
      maxWidth="md"
    >
      <div className="space-y-5 pt-1">
        {/* Info Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
          <span>
            Prinsip perencanaan finansial membagi pemasukan menjadi: <strong>50% Kebutuhan</strong> (Needs), <strong>30% Keinginan</strong> (Wants), dan <strong>20% Tabungan/Darurat</strong> (Savings).
          </span>
        </div>

        {/* Acuan Pemasukan Bulanan */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Acuan Pemasukan Bulanan
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-bold text-slate-400">
              Rp
            </span>
            <input
              type="text"
              value={baseIncome}
              onChange={(e) => {
                const num = parseRupiah(e.target.value);
                setBaseIncome(num > 0 ? formatRupiah(num, false) : '');
              }}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 tabular-nums outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Alokasi 3 Bagian */}
        <div className="space-y-3">
          {/* 50% Kebutuhan */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-700 dark:text-emerald-400">
                50% Kebutuhan Pokok (Needs)
              </span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {formatRupiah(breakdown.needs)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Makanan, Tagihan & Utilitas, Transportasi, Kesehatan.
            </p>
          </div>

          {/* 30% Keinginan */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-amber-700 dark:text-amber-400">
                30% Keinginan (Wants)
              </span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {formatRupiah(breakdown.wants)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Belanja pribadi, Kafe, Hiburan, Liburan.
            </p>
          </div>

          {/* 20% Tabungan */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-indigo-700 dark:text-indigo-400">
                20% Tabungan & Darurat (Savings)
              </span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {formatRupiah(breakdown.savings)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Dana darurat, Investasi, Pelunasan cicilan produktif.
            </p>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="pt-2 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleApplyTemplate}
            className="flex-1 gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Terapkan Otomatis</span>
          </Button>
        </div>
      </div>
    </Sheet>
  );
};
