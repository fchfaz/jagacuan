import React, { useState, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatRupiah, parseRupiah } from '../../lib/format';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import type { Account, AccountType } from '../../types';
import {
  Banknote,
  Building2,
  Smartphone,
  Briefcase,
  Wallet,
  CreditCard,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
  onSaved: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'Banknote', label: 'Tunai', icon: Banknote },
  { name: 'Building2', label: 'Bank', icon: Building2 },
  { name: 'Smartphone', label: 'E-Wallet', icon: Smartphone },
  { name: 'Briefcase', label: 'Usaha/Toko', icon: Briefcase },
  { name: 'Wallet', label: 'Dompet', icon: Wallet },
  { name: 'CreditCard', label: 'Kartu', icon: CreditCard },
  { name: 'CircleDollarSign', label: 'Tabungan', icon: CircleDollarSign },
];

const AVAILABLE_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#64748B', // Slate
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  editingAccount,
  onSaved,
}) => {
  const { showToast } = useAppStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [initialBalance, setInitialBalance] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [color, setColor] = useState('#3B82F6');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingAccount) {
        setName(editingAccount.name);
        setType(editingAccount.type);
        setInitialBalance(formatRupiah(editingAccount.initialBalance, false));
        setIcon(editingAccount.icon || 'Wallet');
        setColor(editingAccount.color || '#3B82F6');
      } else {
        setName('');
        setType('bank');
        setInitialBalance('0');
        setIcon('Building2');
        setColor('#3B82F6');
      }
      setError('');
    }
  }, [isOpen, editingAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama dompet wajib diisi');
      return;
    }

    const balanceNum = parseRupiah(initialBalance);

    try {
      setIsSubmitting(true);
      if (editingAccount) {
        await db.accounts.update(editingAccount.id, {
          name: name.trim(),
          type,
          initialBalance: balanceNum,
          icon,
          color,
        });
        showToast({
          title: 'Dompet Diperbarui',
          description: `Dompet "${name}" berhasil diubah.`,
          type: 'success',
        });
      } else {
        const id = `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await db.accounts.add({
          id,
          name: name.trim(),
          type,
          initialBalance: balanceNum,
          icon,
          color,
          createdAt: new Date().toISOString(),
        });
        showToast({
          title: 'Dompet Baru Ditambahkan',
          description: `Dompet "${name}" siap digunakan.`,
          type: 'success',
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan dompet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingAccount ? 'Ubah Dompet' : 'Tambah Dompet Baru'}
      description="Atur rekening bank, e-wallet, uang tunai, atau keuangan usaha"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Input
          label="Nama Dompet"
          placeholder="Misal: BCA Utama, GoPay, Dompet Toko"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />

        {/* Tipe Dompet */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tipe Akun
          </label>
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            {[
              { id: 'cash', label: 'Tunai' },
              { id: 'bank', label: 'Bank' },
              { id: 'ewallet', label: 'E-Wallet' },
              { id: 'other', label: 'Lainnya' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as AccountType)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  type === t.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Saldo Awal */}
        <Input
          label="Saldo Awal"
          placeholder="0"
          value={initialBalance}
          onChange={(e) => {
            const num = parseRupiah(e.target.value);
            setInitialBalance(num > 0 ? formatRupiah(num, false) : '');
          }}
          leftIcon={<span className="text-xs font-bold">Rp</span>}
          helperText="Saldo riil dihitung otomatis: Saldo Awal + Pemasukan - Pengeluaran +/- Transfer."
        />

        {/* Pemilih Ikon */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pilih Ikon
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ICONS.map((item) => {
              const IconComp = item.icon;
              const isSelected = icon === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-500'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-500'
                  }`}
                  title={item.label}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Pemilih Warna */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Warna Tema Dompet
          </label>
          <div className="flex items-center gap-2">
            {AVAILABLE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
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
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="flex-1"
          >
            {editingAccount ? 'Perbarui Dompet' : 'Simpan Dompet'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
};
