import React, { useState, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CategoryIcon } from '../ui/CategoryIcon';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import type { Category, CategoryType } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
  onSaved: () => void;
}

const CATEGORY_ICONS = [
  'Utensils',
  'Car',
  'Receipt',
  'ShoppingBag',
  'Film',
  'HeartPulse',
  'GraduationCap',
  'ShieldAlert',
  'Briefcase',
  'Laptop',
  'TrendingUp',
  'Gift',
  'Wallet',
  'Coffee',
  'Plane',
  'Home',
  'Zap',
  'CreditCard',
  'Sparkles',
  'Tags',
];

const CATEGORY_COLORS = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#64748b', // Slate
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
  onSaved,
}) => {
  const { showToast } = useAppStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState('Tags');
  const [color, setColor] = useState('#6366f1');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setName(editingCategory.name);
        setType(editingCategory.type);
        setIcon(editingCategory.icon);
        setColor(editingCategory.color);
      } else {
        setName('');
        setType('expense');
        setIcon('Tags');
        setColor('#6366f1');
      }
      setError('');
    }
  }, [isOpen, editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await db.categories.update(editingCategory.id, {
          name: name.trim(),
          type,
          icon,
          color,
        });
        showToast({
          title: 'Kategori Diperbarui',
          description: `Kategori "${name}" berhasil diubah.`,
          type: 'success',
        });
      } else {
        const id = `cat-custom-${Date.now()}`;
        await db.categories.add({
          id,
          name: name.trim(),
          type,
          icon,
          color,
          isDefault: false,
          createdAt: new Date().toISOString(),
        });
        showToast({
          title: 'Kategori Baru Dibuat',
          description: `Kategori "${name}" siap digunakan.`,
          type: 'success',
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
      description="Kelompokkan pengeluaran atau pemasukan sesukamu"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Tipe Kategori */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={type === 'expense' ? 'danger' : 'outline'}
            size="sm"
            onClick={() => setType('expense')}
          >
            Pengeluaran
          </Button>
          <Button
            type="button"
            variant={type === 'income' ? 'success' : 'outline'}
            size="sm"
            onClick={() => setType('income')}
          >
            Pemasukan
          </Button>
        </div>

        <Input
          label="Nama Kategori"
          placeholder="Misal: Kopi & Kafe, Skincare, Peliharaan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />

        {/* Pemilih Ikon */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pilih Ikon
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
            {CATEGORY_ICONS.map((iName) => {
              const isSelected = icon === iName;
              return (
                <button
                  key={iName}
                  type="button"
                  onClick={() => setIcon(iName)}
                  className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-500 scale-105'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60'
                  }`}
                >
                  <CategoryIcon name={iName} color={color} size="sm" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Pemilih Warna */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Warna Aksen
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
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
            Simpan Kategori
          </Button>
        </div>
      </form>
    </Sheet>
  );
};
