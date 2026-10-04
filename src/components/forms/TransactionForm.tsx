import React, { useEffect, useRef, useState } from 'react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatRupiah, parseRupiah } from '../../lib/format';
import { transactionFormSchema } from '../../lib/validation';
import type { TransactionType } from '../../types';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  Wallet,
  AlertCircle,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';

interface TransactionFormProps {
  onSuccess?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
  const {
    accounts,
    categories,
    balances,
    addTransaction,
    updateTransaction,
    allTransactions,
  } = useFinanceData();

  const {
    editingTransactionId,
    closeTransactionModal,
    lastUsedAccountId,
  } = useAppStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // Cari data transaksi jika mode edit
  const editingTx = editingTransactionId
    ? allTransactions.find((t) => t.id === editingTransactionId)
    : null;

  // Form State
  const [type, setType] = useState<TransactionType>(editingTx ? editingTx.type : 'expense');
  const [displayAmount, setDisplayAmount] = useState<string>(
    editingTx ? formatRupiah(editingTx.amount, false) : ''
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    editingTx?.categoryId || ''
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    editingTx?.accountId || lastUsedAccountId || (accounts[0]?.id ?? '')
  );
  const [selectedToAccountId, setSelectedToAccountId] = useState<string>(
    editingTx?.toAccountId || ''
  );
  const [date, setDate] = useState<string>(
    editingTx ? editingTx.date.split('T')[0] : format(new Date(), 'yyyy-MM-dd')
  );
  const [notes, setNotes] = useState<string>(editingTx?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autofocus input nominal saat dibuka
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Filter kategori berdasarkan tipe yang dipilih
  const filteredCategories = categories.filter((c) =>
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  // Set kategori default pertama kali jika belum dipilih
  useEffect(() => {
    if (!selectedCategoryId && filteredCategories.length > 0) {
      setSelectedCategoryId(filteredCategories[0].id);
    }
  }, [type, filteredCategories, selectedCategoryId]);

  // Perubahan tipe transaksi
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setErrors({});
    const relevantCats = categories.filter((c) =>
      newType === 'income' ? c.type === 'income' : c.type === 'expense'
    );
    if (relevantCats.length > 0) {
      setSelectedCategoryId(relevantCats[0].id);
    }
    // Jika ganti ke transfer, pastikan toAccountId berbeda dengan accountId
    if (newType === 'transfer') {
      const otherAccount = accounts.find((a) => a.id !== selectedAccountId);
      if (otherAccount) {
        setSelectedToAccountId(otherAccount.id);
      }
    }
  };

  // Format nominal otomatis saat mengetik (misal 15000 -> 15.000)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const num = parseRupiah(rawVal);
    if (num === 0 && rawVal === '') {
      setDisplayAmount('');
    } else {
      setDisplayAmount(formatRupiah(num, false));
    }
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  // Tombol shortcut nominal cepat
  const addQuickAmount = (increment: number) => {
    const current = parseRupiah(displayAmount);
    const updated = current + increment;
    setDisplayAmount(formatRupiah(updated, false));
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  // Peringatan jika saldo dompet asal tidak cukup (untuk transfer atau pengeluaran)
  const numericAmount = parseRupiah(displayAmount);
  const currentAccountBalance = balances[selectedAccountId] ?? 0;
  const isBalanceInsufficient =
    (type === 'expense' || type === 'transfer') &&
    numericAmount > currentAccountBalance;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      type,
      amount: displayAmount,
      accountId: selectedAccountId,
      toAccountId: type === 'transfer' ? selectedToAccountId : null,
      categoryId: type === 'transfer' ? null : selectedCategoryId,
      date,
      notes: notes.trim(),
    };

    const result = transactionFormSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0] as string;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTx) {
        await updateTransaction(editingTx.id, {
          type: result.data.type,
          amount: result.data.amount,
          accountId: result.data.accountId,
          toAccountId: result.data.toAccountId || null,
          categoryId: result.data.categoryId || null,
          date: result.data.date,
          notes: result.data.notes,
        });
      } else {
        await addTransaction({
          type: result.data.type,
          amount: result.data.amount,
          accountId: result.data.accountId,
          toAccountId: result.data.toAccountId || null,
          categoryId: result.data.categoryId || null,
          date: result.data.date,
          notes: result.data.notes,
        });
      }

      closeTransactionModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setErrors({ form: 'Terjadi kesalahan saat menyimpan transaksi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Pemilih Tipe Transaksi (Tabs) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            type === 'expense'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Pengeluaran</span>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            type === 'income'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Pemasukan</span>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('transfer')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            type === 'transfer'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Transfer</span>
        </button>
      </div>

      {/* 2. Keypad / Input Nominal Besar */}
      <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
          Nominal (Rupiah)
        </span>
        <div className="relative w-full flex items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-slate-400 dark:text-slate-500 mr-1.5">
            Rp
          </span>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={displayAmount}
            onChange={handleAmountChange}
            placeholder="0"
            className="w-full text-center text-3xl sm:text-4xl font-black bg-transparent text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none tabular-nums max-w-[280px]"
          />
        </div>

        {/* Quick Amount Increment Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 w-full">
          {[10_000, 20_000, 50_000, 100_000, 500_000].map((inc) => (
            <button
              key={inc}
              type="button"
              onClick={() => addQuickAmount(inc)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
            >
              +{formatRupiah(inc, false)}
            </button>
          ))}
          {displayAmount && (
            <button
              type="button"
              onClick={() => setDisplayAmount('')}
              className="text-[11px] font-medium px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {errors.amount && (
          <p className="text-xs text-rose-500 font-medium mt-2 animate-in fade-in">
            {errors.amount}
          </p>
        )}
      </div>

      {/* 3. Pemilih Kategori (Chip Grid dengan Ikon Pastel) - Kecuali Transfer */}
      {type !== 'transfer' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Kategori {type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</span>
            <span className="text-[11px] text-slate-400 font-normal">Wajib dipilih</span>
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <CategoryIcon name={cat.icon} color={cat.color} size="sm" />
                  <span className="text-[11px] font-semibold mt-1.5 line-clamp-1">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.categoryId && (
            <p className="text-xs text-rose-500">{errors.categoryId}</p>
          )}
        </div>
      )}

      {/* 4. Pemilih Dompet (Asal & Tujuan jika Transfer) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dompet Utama / Asal */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-indigo-500" />
            <span>{type === 'transfer' ? 'Dari Dompet' : 'Dompet'}</span>
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[44px]"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatRupiah(balances[acc.id] || 0)})
              </option>
            ))}
          </select>
          {errors.accountId && (
            <p className="text-xs text-rose-500">{errors.accountId}</p>
          )}
        </div>

        {/* Dompet Tujuan (Khusus Transfer) */}
        {type === 'transfer' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ke Dompet Tujuan</span>
            </label>
            <select
              value={selectedToAccountId}
              onChange={(e) => setSelectedToAccountId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[44px]"
            >
              <option value="" disabled>
                -- Pilih Dompet Tujuan --
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} disabled={acc.id === selectedAccountId}>
                  {acc.name} {acc.id === selectedAccountId ? '(Asal)' : ''}
                </option>
              ))}
            </select>
            {errors.toAccountId && (
              <p className="text-xs text-rose-500">{errors.toAccountId}</p>
            )}
          </div>
        ) : (
          /* Tanggal Transaksi */
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tanggal</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>
        )}
      </div>

      {/* Tanggal untuk tipe transfer (karena di transfer kolomnya penuh) */}
      {type === 'transfer' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tanggal Transfer</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[44px]"
          />
        </div>
      )}

      {/* Peringatan Saldo Dompet Asal Tidak Mencukupi (Non-blocking peringatan) */}
      {isBalanceInsufficient && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            Saldo dompet saat ini ({formatRupiah(currentAccountBalance)}) lebih kecil dari nominal yang dicatat. Transaksi tetap dapat disimpan.
          </span>
        </div>
      )}

      {/* 5. Catatan Opsional */}
      <Input
        label="Catatan (Opsional)"
        placeholder="Misal: Coto makassar & es teh"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        error={errors.notes}
      />

      {errors.form && (
        <p className="text-xs text-rose-500 text-center font-medium">{errors.form}</p>
      )}

      {/* 6. Tombol Aksi */}
      <div className="pt-2 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={closeTransactionModal}
          className="flex-1"
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="flex-1 gap-2"
        >
          <Check className="w-4 h-4" />
          <span>{editingTx ? 'Perbarui Transaksi' : 'Simpan Transaksi'}</span>
        </Button>
      </div>
    </form>
  );
};
