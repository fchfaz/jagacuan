import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useAppStore } from '../store/useAppStore';
import {
  calculateAccountBalances,
  calculateBudgetStatus,
  calculateMonthSummary,
  calculateTotalBalance,
  evaluateBudgetsForMonth,
  filterTransactionsByPeriod,
} from '../lib/calculations';
import { formatRupiah } from '../lib/format';
import type {
  Account,
  Budget,
  Category,
  CategoryBudgetStatus,
  MonthSummary,
  Transaction,
} from '../types';

export function useFinanceData() {
  const { currentMonth, showToast, setLastUsedAccountId } = useAppStore();

  // Ambil data reactive secara real-time dari Dexie IndexedDB
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const budgets =
    useLiveQuery(
      () => db.budgets.where('month').equals(currentMonth).toArray(),
      [currentMonth]
    ) || [];

  const allTransactions =
    useLiveQuery(
      () => db.transactions.orderBy('date').reverse().toArray(),
      []
    ) || [];

  const settingsList = useLiveQuery(() => db.settings.toArray(), []) || [];
  const settingsMap = Object.fromEntries(settingsList.map((s) => [s.key, s.value]));
  const startDayOfMonth = Number(settingsMap.startDayOfMonth) || 1;

  // Hitung saldo riil setiap dompet
  const balances = calculateAccountBalances(accounts, allTransactions);
  const totalBalance = calculateTotalBalance(accounts, allTransactions);

  // Transaksi pada bulan aktif
  const monthlyTransactions = filterTransactionsByPeriod(
    allTransactions,
    currentMonth,
    startDayOfMonth
  );

  // Ringkasan bulanan (pemasukan, pengeluaran, tabungan, top kategori)
  const monthlySummary: MonthSummary = calculateMonthSummary(
    allTransactions,
    categories,
    currentMonth,
    startDayOfMonth
  );

  // Evaluasi anggaran per kategori untuk bulan aktif
  const categoryBudgets: CategoryBudgetStatus[] = evaluateBudgetsForMonth(
    budgets,
    categories,
    monthlyTransactions
  );

  // Kategori yang sedang waspada (>= 80%) atau bahaya (>= 100%)
  const budgetAlerts = categoryBudgets.filter(
    (b) => b.status === 'warning' || b.status === 'danger'
  );

  // 5 transaksi paling terbaru
  const recentTransactions = allTransactions.slice(0, 5);

  /**
   * Tambah transaksi baru dengan deteksi peringatan anggaran (80% dan 100%)
   */
  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const newId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowIso = new Date().toISOString();

    const newTx: Transaction = {
      ...data,
      id: newId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Cek status anggaran sebelum penambahan jika bertipe pengeluaran
    let warningMessage: string | null = null;
    if (data.type === 'expense' && data.categoryId) {
      const budget = budgets.find((b) => b.categoryId === data.categoryId);
      if (budget && budget.limitAmount > 0) {
        const currentSpent = monthlyTransactions
          .filter((t) => t.type === 'expense' && t.categoryId === data.categoryId)
          .reduce((sum, t) => sum + t.amount, 0);

        const newSpent = currentSpent + data.amount;
        const prevStatus = calculateBudgetStatus(budget.limitAmount, currentSpent);
        const nextStatus = calculateBudgetStatus(budget.limitAmount, newSpent);
        const category = categories.find((c) => c.id === data.categoryId);
        const catName = category?.name || 'Kategori';

        if (prevStatus.status === 'safe' && nextStatus.status === 'warning') {
          warningMessage = `Anggaran ${catName} hampir habis nih, sisa ${formatRupiah(
            nextStatus.remainingAmount
          )}.`;
        } else if (prevStatus.status !== 'danger' && nextStatus.status === 'danger') {
          warningMessage = `Anggaran ${catName} sudah melewati batas nih (${nextStatus.percentage}%). Yuk lebih cermat!`;
        }
      }
    }

    await db.transactions.add(newTx);
    setLastUsedAccountId(data.accountId);

    // Tampilkan toast konfirmasi & opsi batalkan
    showToast({
      title: 'Transaksi berhasil dicatat',
      description: `${data.type === 'income' ? 'Pemasukan' : data.type === 'expense' ? 'Pengeluaran' : 'Transfer'} ${formatRupiah(data.amount)} tersimpan.`,
      type: 'success',
      action: {
        label: 'Batalkan',
        onClick: async () => {
          await db.transactions.delete(newId);
          showToast({
            title: 'Transaksi dibatalkan',
            description: `${formatRupiah(data.amount)} telah dihapus dari catatan.`,
            type: 'default',
          });
        },
      },
    });

    // Jika ada peringatan anggaran, berikan notifikasi ramah terpisah
    if (warningMessage) {
      setTimeout(() => {
        showToast({
          title: 'Perhatian Anggaran',
          description: warningMessage!,
          type: 'warning',
          duration: 6000,
        });
      }, 500);
    }

    return newId;
  };

  /**
   * Update transaksi yang sudah ada
   */
  const updateTransaction = async (
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ): Promise<void> => {
    await db.transactions.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    showToast({
      title: 'Transaksi diperbarui',
      type: 'success',
    });
  };

  /**
   * Hapus transaksi dengan fitur Batalkan (Undo) via Toast
   */
  const deleteTransaction = async (id: string): Promise<void> => {
    const existing = await db.transactions.get(id);
    if (!existing) return;

    await db.transactions.delete(id);

    showToast({
      title: 'Transaksi dihapus',
      description: `${formatRupiah(existing.amount)} telah dihapus.`,
      type: 'default',
      action: {
        label: 'Batalkan',
        onClick: async () => {
          // Pulihkan kembali data transaksi persis
          await db.transactions.add(existing);
          showToast({
            title: 'Transaksi dipulihkan',
            type: 'success',
          });
        },
      },
    });
  };

  return {
    accounts,
    categories,
    budgets,
    allTransactions,
    monthlyTransactions,
    balances,
    totalBalance,
    monthlySummary,
    categoryBudgets,
    budgetAlerts,
    recentTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
