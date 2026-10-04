import React, { useState } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { AccountModal } from '../components/forms/AccountModal';
import { GoalModal } from '../components/forms/GoalModal';
import { formatRupiah } from '../lib/format';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Account, SavingsGoal } from '../types';
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Target,
  PiggyBank,
  CheckCircle2,
  Building2,
  Smartphone,
  Banknote,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

export const WalletsPage: React.FC = () => {
  const { accounts, balances, totalBalance, allTransactions } = useFinanceData();
  const { showToast } = useAppStore();

  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Hapus akun dompet dengan pengecekan apakah ada transaksi
  const handleDeleteAccount = async (account: Account) => {
    try {
      const txCount = await db.transactions
        .where('accountId')
        .equals(account.id)
        .or('toAccountId')
        .equals(account.id)
        .count();

      if (txCount > 0) {
        showToast({
          title: 'Dompet Tidak Dapat Dihapus',
          description: `Dompet ini memiliki ${txCount} riwayat transaksi aktif. Hapus atau pindahkan transaksinya terlebih dahulu.`,
          type: 'warning',
          duration: 5000,
        });
        return;
      }

      await db.accounts.delete(account.id);
      showToast({
        title: 'Dompet Dihapus',
        description: `Dompet "${account.name}" berhasil dihapus.`,
        type: 'default',
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Gagal menghapus dompet',
        type: 'error',
      });
    }
  };

  // Hapus target tabungan
  const handleDeleteGoal = async (id: string) => {
    try {
      await db.goals.delete(id);
      showToast({
        title: 'Target Tabungan Dihapus',
        type: 'default',
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Tambah simpanan cepat ke target tabungan
  const handleQuickAddSavings = async (goal: SavingsGoal, addAmount: number) => {
    try {
      const newSaved = goal.savedAmount + addAmount;
      await db.goals.update(goal.id, { savedAmount: newSaved });
      showToast({
        title: 'Tabungan Bertambah!',
        description: `+${formatRupiah(addAmount)} ditambahkan ke ${goal.name}.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getAccountIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'Banknote':
        return <Banknote className="w-5 h-5" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-150">
      {/* 1. Header Dompet */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dompet & Rekening
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Total saldo gabungan: <strong className="text-indigo-600 dark:text-indigo-400 tabular-nums">{formatRupiah(totalBalance)}</strong>
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingAccount(null);
            setIsAccountModalOpen(true);
          }}
          className="gap-1.5 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>+ Tambah Dompet</span>
        </Button>
      </div>

      {/* 2. Daftar Kartu Dompet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const currentBalance = balances[acc.id] ?? 0;
          const txCount = allTransactions.filter(
            (t) => t.accountId === acc.id || t.toAccountId === acc.id
          ).length;

          return (
            <Card key={acc.id} hoverEffect={true} className="overflow-hidden">
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: acc.color || '#3b82f6' }}
              />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: acc.color || '#3b82f6' }}
                    >
                      {getAccountIcon(acc.icon)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {acc.name}
                      </h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {acc.type === 'bank'
                          ? 'Rekening Bank'
                          : acc.type === 'cash'
                          ? 'Uang Tunai'
                          : acc.type === 'ewallet'
                          ? 'E-Wallet'
                          : 'Lainnya'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Edit dompet"
                      onClick={() => {
                        setEditingAccount(acc);
                        setIsAccountModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus dompet"
                      onClick={() => handleDeleteAccount(acc)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Saldo Saat Ini
                  </span>
                  <div
                    className={`text-2xl font-black tabular-nums mt-0.5 ${
                      currentBalance < 0
                        ? 'text-rose-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {formatRupiah(currentBalance)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>Saldo awal: {formatRupiah(acc.initialBalance)}</span>
                    <span>{txCount} transaksi</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. Bagian Target Tabungan (Savings Goals) */}
      <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Tujuan Tabungan (Savings Goals)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau progres target dana darurat, impian, dan kebutuhan masa depan
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>+ Buat Target Tabungan</span>
          </Button>
        </div>

        {/* Daftar Target Tabungan */}
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const percentage = Math.min(
                100,
                Math.round((goal.savedAmount / goal.targetAmount) * 100)
              );
              const isCompleted = goal.savedAmount >= goal.targetAmount;

              return (
                <Card key={goal.id} hoverEffect={true}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {goal.name}
                          </h4>
                          {goal.deadline && (
                            <span className="text-[11px] text-slate-400">
                              Target s/d {goal.deadline}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Edit target"
                          onClick={() => {
                            setEditingGoal(goal);
                            setIsGoalModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Hapus target"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          {formatRupiah(goal.savedAmount)} / {formatRupiah(goal.targetAmount)}
                        </span>
                        <span
                          className={`font-bold tabular-nums ${
                            isCompleted ? 'text-emerald-600' : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>
                      <ProgressBar
                        value={percentage}
                        variant={isCompleted ? 'success' : 'primary'}
                        size="sm"
                      />
                    </div>

                    {/* Quick Add Savings Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 font-medium">Tambah simpanan:</span>
                      <div className="flex items-center gap-1">
                        {[100_000, 500_000, 1_000_000].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => handleQuickAddSavings(goal, inc)}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
                          >
                            +{formatRupiah(inc, false)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={PiggyBank}
            title="Belum Ada Target Tabungan"
            description="Buat target dana darurat, DP rumah, atau liburan impian untuk memotivasi kebiasaan menabungmu."
            actionLabel="+ Buat Target Tabungan"
            onAction={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Modal Dompet */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        editingAccount={editingAccount}
        onSaved={() => {}}
      />

      {/* Modal Target Tabungan */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        editingGoal={editingGoal}
        onSaved={() => {}}
      />
    </div>
  );
};
