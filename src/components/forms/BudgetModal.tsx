import React, { useState, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatRupiah, parseRupiah } from '../../lib/format';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import type { Budget, Category } from '../../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  existingBudgets: Budget[];
  currentMonth: string;
  initialCategoryId?: string;
  onSaved: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingBudgets,
  currentMonth,
  initialCategoryId,
  onSaved,
}) => {
  const { showToast } = useAppStore();
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const [categoryId, setCategoryId] = useState<string>('');
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      const targetCatId =
        initialCategoryId ||
        expenseCategories[0]?.id ||
        '';

      setCategoryId(targetCatId);

      const existing = existingBudgets.find((b) => b.categoryId === targetCatId);
      if (existing) {
        setDisplayAmount(formatRupiah(existing.limitAmount, false));
      } else {
        setDisplayAmount('');
      }
    }
  }, [isOpen, initialCategoryId, existingBudgets, expenseCategories]);

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    setError('');
    const existing = existingBudgets.find((b) => b.categoryId === newCatId);
    if (existing) {
      setDisplayAmount(formatRupiah(existing.limitAmount, false));
    } else {
      setDisplayAmount('');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseRupiah(raw);
    if (num === 0 && raw === '') {
      setDisplayAmount('');
    } else {
      setDisplayAmount(formatRupiah(num, false));
    }
    setError('');
  };

  const addQuickIncrement = (inc: number) => {
    const curr = parseRupiah(displayAmount);
    setDisplayAmount(formatRupiah(curr + inc, false));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitAmount = parseRupiah(displayAmount);

    if (limitAmount <= 0) {
      setError('Batas anggaran harus lebih besar dari Rp 0');
      return;
    }

    try {
      setIsSubmitting(true);
      const budgetId = `bgt-${categoryId}-${currentMonth}`;

      await db.budgets.put({
        id: budgetId,
        categoryId,
        month: currentMonth,
        limitAmount,
      });

      const cat = categories.find((c) => c.id === categoryId);
      showToast({
        title: 'Anggaran Disimpan',
        description: `Batas ${cat?.name || 'Kategori'} ditetapkan sebesar ${formatRupiah(limitAmount)}`,
        type: 'success',
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan anggaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Atur Anggaran Kategori"
      description="Tentukan batas pengeluaran bulanan (envelope limit)"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        {/* Pilih Kategori */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Kategori Pengeluaran
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
            {expenseCategories.map((cat) => {
              const isSelected = categoryId === cat.id;
              const hasBudget = existingBudgets.some((b) => b.categoryId === cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <CategoryIcon name={cat.icon} color={cat.color} size="sm" />
                  <span className="text-[11px] font-semibold mt-1 truncate w-full">
                    {cat.name}
                  </span>
                  {hasBudget && (
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      Sudah ada
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Limit Nominal */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Batas Maksimal Bulanan
          </span>
          <div className="relative w-full flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-slate-400 dark:text-slate-500 mr-1.5">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full text-center text-3xl sm:text-4xl font-black bg-transparent text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none tabular-nums max-w-[280px]"
            />
          </div>

          {/* Quick Increments */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 w-full">
            {[100_000, 250_000, 500_000, 1_000_000, 2_500_000].map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => addQuickIncrement(inc)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              >
                +{formatRupiah(inc, false)}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-medium mt-2 animate-in fade-in">
              {error}
            </p>
          )}
        </div>

        {/* Buttons */}
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
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="flex-1"
          >
            Simpan Anggaran
          </Button>
        </div>
      </form>
    </Sheet>
  );
};
