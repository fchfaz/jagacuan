import React, { useState, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatRupiah, parseRupiah } from '../../lib/format';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import type { SavingsGoal } from '../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: SavingsGoal | null;
  onSaved: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal,
  onSaved,
}) => {
  const { showToast } = useAppStore();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setName(editingGoal.name);
        setTargetAmount(formatRupiah(editingGoal.targetAmount, false));
        setSavedAmount(formatRupiah(editingGoal.savedAmount, false));
        setDeadline(editingGoal.deadline || '');
      } else {
        setName('');
        setTargetAmount('');
        setSavedAmount('0');
        setDeadline('');
      }
      setError('');
    }
  }, [isOpen, editingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama tujuan tabungan wajib diisi');
      return;
    }

    const targetNum = parseRupiah(targetAmount);
    if (targetNum <= 0) {
      setError('Target nominal harus lebih dari Rp 0');
      return;
    }

    const savedNum = parseRupiah(savedAmount);

    try {
      setIsSubmitting(true);
      if (editingGoal) {
        await db.goals.update(editingGoal.id, {
          name: name.trim(),
          targetAmount: targetNum,
          savedAmount: savedNum,
          deadline: deadline || undefined,
        });
        showToast({
          title: 'Target Tabungan Diperbarui',
          type: 'success',
        });
      } else {
        const id = `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await db.goals.add({
          id,
          name: name.trim(),
          targetAmount: targetNum,
          savedAmount: savedNum,
          deadline: deadline || undefined,
          createdAt: new Date().toISOString(),
        });
        showToast({
          title: 'Target Tabungan Baru Dibuat',
          description: `Target "${name}" sebesar ${formatRupiah(targetNum)} berhasil diset.`,
          type: 'success',
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan target tabungan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingGoal ? 'Ubah Target Tabungan' : 'Target Tabungan Baru'}
      description="Rencanakan dana darurat, liburan, atau impian finansialmu"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Input
          label="Nama Target"
          placeholder="Misal: Dana Darurat 6 Bulan, Beli Laptop, Umroh"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />

        <Input
          label="Target Nominal"
          placeholder="0"
          value={targetAmount}
          onChange={(e) => {
            const num = parseRupiah(e.target.value);
            setTargetAmount(num > 0 ? formatRupiah(num, false) : '');
          }}
          leftIcon={<span className="text-xs font-bold">Rp</span>}
        />

        <Input
          label="Nominal Terkumpul Saat Ini"
          placeholder="0"
          value={savedAmount}
          onChange={(e) => {
            const num = parseRupiah(e.target.value);
            setSavedAmount(num > 0 ? formatRupiah(num, false) : '');
          }}
          leftIcon={<span className="text-xs font-bold">Rp</span>}
        />

        <Input
          label="Batas Waktu (Opsional)"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
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
            Simpan Target
          </Button>
        </div>
      </form>
    </Sheet>
  );
};
