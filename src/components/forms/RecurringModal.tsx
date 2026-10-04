import React, { useState, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatRupiah, parseRupiah } from '../../lib/format';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import type { RecurringRule, Account, Category, RecurringFrequency } from '../../types';
import { format } from 'date-fns';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  editingRule?: RecurringRule | null;
  onSaved: () => void;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  editingRule,
  onSaved,
}) => {
  const { showToast } = useAppStore();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [nextDate, setNextDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingRule) {
        setType(editingRule.templateTransaction.type === 'income' ? 'income' : 'expense');
        setAmount(formatRupiah(editingRule.templateTransaction.amount, false));
        setFrequency(editingRule.frequency);
        setAccountId(editingRule.templateTransaction.accountId);
        setCategoryId(editingRule.templateTransaction.categoryId || '');
        setNextDate(editingRule.nextDate);
        setNotes(editingRule.templateTransaction.notes || '');
      } else {
        setType('expense');
        setAmount('');
        setFrequency('monthly');
        setAccountId(accounts[0]?.id || '');
        const relevantCats = categories.filter((c) => c.type === 'expense');
        setCategoryId(relevantCats[0]?.id || '');
        setNextDate(format(new Date(), 'yyyy-MM-dd'));
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, editingRule, accounts, categories]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseRupiah(amount);

    if (numAmount <= 0) {
      setError('Nominal harus lebih dari Rp 0');
      return;
    }
    if (!accountId) {
      setError('Pilih dompet');
      return;
    }
    if (!categoryId) {
      setError('Pilih kategori');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingRule) {
        await db.recurring.update(editingRule.id, {
          frequency,
          nextDate,
          templateTransaction: {
            type,
            amount: numAmount,
            accountId,
            categoryId,
            notes: notes.trim(),
          },
        });
        showToast({
          title: 'Transaksi Berulang Diperbarui',
          type: 'success',
        });
      } else {
        const id = `rule-${Date.now()}`;
        await db.recurring.add({
          id,
          frequency,
          nextDate,
          active: true,
          templateTransaction: {
            type,
            amount: numAmount,
            accountId,
            categoryId,
            notes: notes.trim(),
          },
          createdAt: new Date().toISOString(),
        });
        showToast({
          title: 'Jadwal Rutin Dibuat',
          description: `Transaksi otomatis ${frequency === 'monthly' ? 'bulanan' : 'mingguan'} berhasil diset.`,
          type: 'success',
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan transaksi rutin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingRule ? 'Ubah Transaksi Rutin' : 'Tambah Transaksi Berulang'}
      description="Gaji, tagihan internet, langganan streaming, atau cicilan bulanan"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Tipe: Pemasukan / Pengeluaran */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={type === 'expense' ? 'danger' : 'outline'}
            size="sm"
            onClick={() => {
              setType('expense');
              const relevant = categories.filter((c) => c.type === 'expense');
              if (relevant.length > 0) setCategoryId(relevant[0].id);
            }}
          >
            Pengeluaran Rutin
          </Button>
          <Button
            type="button"
            variant={type === 'income' ? 'success' : 'outline'}
            size="sm"
            onClick={() => {
              setType('income');
              const relevant = categories.filter((c) => c.type === 'income');
              if (relevant.length > 0) setCategoryId(relevant[0].id);
            }}
          >
            Pemasukan Rutin (Gaji)
          </Button>
        </div>

        {/* Nominal */}
        <Input
          label="Nominal Rutin"
          placeholder="0"
          value={amount}
          onChange={(e) => {
            const n = parseRupiah(e.target.value);
            setAmount(n > 0 ? formatRupiah(n, false) : '');
          }}
          leftIcon={<span className="text-xs font-bold">Rp</span>}
          error={error}
        />

        {/* Frekuensi & Tanggal Mulai */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Frekuensi
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="monthly">Bulanan</option>
              <option value="weekly">Mingguan</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Jadwal Pertama
            </label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
        </div>

        {/* Dompet & Kategori */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Dompet
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Catatan Pengingat"
          placeholder="Misal: WiFi Indihome, Spotify Family, Kost Bulanan"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

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
            Simpan Jadwal Rutin
          </Button>
        </div>
      </form>
    </Sheet>
  );
};
