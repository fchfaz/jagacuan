import React from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { EmptyState } from '../components/ui/EmptyState';
import { formatMonthYear, formatRupiah } from '../lib/format';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    accounts,
    categories,
    totalBalance,
    monthlySummary,
    categoryBudgets,
    budgetAlerts,
    recentTransactions,
    deleteTransaction,
  } = useFinanceData();

  const {
    currentMonth,
    setActiveTab,
    openAddTransaction,
    openEditTransaction,
  } = useAppStore();

  // Ambil maksimal 4 anggaran teratas yang paling banyak terpakai
  const topBudgets = [...categoryBudgets]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Header Ringkasan & CTA Cepat */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Ringkasan Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Periode: <strong className="text-slate-700 dark:text-slate-200">{formatMonthYear(currentMonth)}</strong>
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openAddTransaction}
          className="gap-2 shadow-md shadow-indigo-600/20 sm:w-auto w-full"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>+ Catat Cuan</span>
        </Button>
      </div>

      {/* 2. Kartu Besar Total Saldo & Dua Kartu Pemasukan/Pengeluaran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Kartu Besar: Total Saldo Gabungan */}
        <Card className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white border-none shadow-indigo-600/20 shadow-xl overflow-hidden relative">
          <div className="absolute right-0 -bottom-6 w-36 h-36 bg-white/5 rounded-full pointer-events-none blur-xl" />
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between text-indigo-100">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Saldo Semua Dompet
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums mt-1">
              {formatRupiah(totalBalance)}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{accounts.length} Dompet Terhubung</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('wallets')}
                className="hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
              >
                Detail
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Kartu Kecil: Pemasukan Bulan Ini (Hijau) */}
        <Card hoverEffect={true}>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pemasukan Bulan Ini
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              + {formatRupiah(monthlySummary.totalIncome)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
              <span>Sisa Tabungan:</span>
              <span className={`font-semibold tabular-nums ${monthlySummary.netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {monthlySummary.netSavings >= 0 ? '+' : ''}{formatRupiah(monthlySummary.netSavings)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Kartu Kecil: Pengeluaran Bulan Ini (Merah) */}
        <Card hoverEffect={true}>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pengeluaran Bulan Ini
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-500 dark:text-rose-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-500 dark:text-rose-400 tabular-nums">
              - {formatRupiah(monthlySummary.totalExpense)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
              <span>Terbesar:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                {monthlySummary.topExpenseCategory?.name || 'Belum ada'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Banner Peringatan Anggaran (Jika ada yang mendekati / lewat limit) */}
      {budgetAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Peringatan Anggaran
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Ada {budgetAlerts.length} kategori yang hampir atau sudah melebihi batas bulan ini.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('budgets')}
            className="border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100/60 shrink-0 text-xs"
          >
            Lihat Anggaran
          </Button>
        </div>
      )}

      {/* 4. Grid Dua Kolom: Ringkasan Anggaran & 5 Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Ringkasan Anggaran (Envelope Budgeting) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle>Ringkasan Anggaran</CardTitle>
              <CardDescription>Batas pengeluaran per kategori teratas</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('budgets')}
              className="text-xs text-indigo-600 dark:text-indigo-400 gap-1 p-0 hover:bg-transparent"
            >
              <span>Atur</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {topBudgets.length > 0 ? (
              topBudgets.map((bgt) => (
                <div key={bgt.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIcon
                        name={bgt.categoryIcon}
                        color={bgt.categoryColor}
                        size="xs"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {bgt.categoryName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-right">
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatRupiah(bgt.spentAmount)} / {formatRupiah(bgt.limitAmount)}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md ${
                          bgt.status === 'danger'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                            : bgt.status === 'warning'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}
                      >
                        {bgt.percentage}%
                      </span>
                    </div>
                  </div>

                  <ProgressBar value={bgt.percentage} variant="auto" size="xs" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-60 text-indigo-500" />
                <p className="text-xs font-medium">Belum ada anggaran yang disetel untuk bulan ini.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('budgets')}
                  className="mt-3 text-xs"
                >
                  + Atur Anggaran Bulan Ini
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kolom Kanan: 5 Transaksi Terbaru */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle>Transaksi Terbaru</CardTitle>
              <CardDescription>Aktivitas pengeluaran dan pemasukan terakhir</CardDescription>
            </div>
            {recentTransactions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('transactions')}
                className="text-xs text-indigo-600 dark:text-indigo-400 gap-1 p-0 hover:bg-transparent"
              >
                <span>Lihat semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  accounts={accounts}
                  categories={categories}
                  onEdit={(id) => openEditTransaction(id)}
                  onDelete={(id) => deleteTransaction(id)}
                />
              ))
            ) : (
              <EmptyState
                title="Belum ada transaksi"
                description="Mulai catat transaksi pertamamu untuk menjaga keuangan tetap teratur."
                actionLabel="+ Catat Transaksi"
                onAction={openAddTransaction}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
