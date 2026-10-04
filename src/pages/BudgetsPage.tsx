import React, { useState } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { EmptyState } from '../components/ui/EmptyState';
import { BudgetModal } from '../components/forms/BudgetModal';
import { BudgetTemplateModal } from '../components/forms/BudgetTemplateModal';
import { formatMonthYear, formatRupiah } from '../lib/format';
import { db } from '../db/db';
import { subMonths, format } from 'date-fns';
import {
  Plus,
  Copy,
  Sparkles,
  Pencil,
  Trash2,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const {
    categories,
    budgets,
    categoryBudgets,
    monthlySummary,
  } = useFinanceData();

  const { currentMonth, showToast } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string | undefined>(undefined);
  const [filterTab, setFilterTab] = useState<'all' | 'safe' | 'warning' | 'danger'>('all');

  // Total batasan anggaran vs total pengeluaran untuk kategori yang dianggarkan
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpentInBudgets = categoryBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const remainingTotal = totalBudgeted - totalSpentInBudgets;
  const overallPercentage = totalBudgeted > 0
    ? Math.round((totalSpentInBudgets / totalBudgeted) * 100)
    : 0;

  // Salin anggaran bulan lalu
  const handleCopyPrevMonthBudgets = async () => {
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      const prevDate = subMonths(new Date(year, month - 1, 1), 1);
      const prevMonthStr = format(prevDate, 'yyyy-MM');

      const prevBudgets = await db.budgets.where('month').equals(prevMonthStr).toArray();

      if (prevBudgets.length === 0) {
        showToast({
          title: 'Tidak Ada Anggaran Bulan Lalu',
          description: `Tidak ditemukan anggaran tercatat pada periode ${formatMonthYear(prevMonthStr)}.`,
          type: 'warning',
        });
        return;
      }

      // Duplikasikan untuk bulan aktif
      const newBudgets = prevBudgets.map((b) => ({
        id: `bgt-${b.categoryId}-${currentMonth}`,
        categoryId: b.categoryId,
        month: currentMonth,
        limitAmount: b.limitAmount,
      }));

      await db.budgets.bulkPut(newBudgets);

      showToast({
        title: 'Anggaran Berhasil Disalin',
        description: `${newBudgets.length} kategori anggaran dari ${formatMonthYear(prevMonthStr)} disalin ke bulan ini.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Gagal menyalin anggaran',
        type: 'error',
      });
    }
  };

  // Hapus satu anggaran kategori
  const handleDeleteBudget = async (categoryId: string) => {
    try {
      await db.budgets.where('categoryId').equals(categoryId).and((b) => b.month === currentMonth).delete();
      showToast({
        title: 'Batas Anggaran Dihapus',
        type: 'default',
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Filter daftar anggaran berdasarkan status tab
  const filteredCategoryBudgets = categoryBudgets.filter((b) => {
    if (filterTab === 'safe') return b.status === 'safe';
    if (filterTab === 'warning') return b.status === 'warning';
    if (filterTab === 'danger') return b.status === 'danger';
    return true;
  });

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-150">
      {/* 1. Header & Tombol Tindakan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Anggaran Bulanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Batas pengeluaran sistem amplop (envelope) untuk <strong className="text-slate-700 dark:text-slate-200">{formatMonthYear(currentMonth)}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrevMonthBudgets}
            className="gap-1.5 text-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salin Bulan Lalu</span>
            <span className="sm:hidden">Salin</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsTemplateModalOpen(true)}
            className="gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aturan 50/30/20</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedCatId(undefined);
              setIsModalOpen(true);
            }}
            className="gap-1.5 text-xs shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>+ Set Anggaran</span>
          </Button>
        </div>
      </div>

      {/* 2. Kartu Besar Ringkasan Total Anggaran */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Anggaran Disiapkan
              </span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums mt-1">
                {formatRupiah(totalBudgeted)}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Terpakai: <strong>{formatRupiah(totalSpentInBudgets)}</strong> • Sisa:{' '}
                <strong className={remainingTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {formatRupiah(remainingTotal)}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="p-3 rounded-2xl bg-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Status Global
                </span>
                <span
                  className={`text-xl font-black tabular-nums ${
                    overallPercentage >= 100
                      ? 'text-rose-400'
                      : overallPercentage >= 80
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {overallPercentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <ProgressBar value={overallPercentage} variant="auto" size="sm" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Filter Tab (Semua, Aman, Waspada, Melebihi Batas) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs">
          {[
            { id: 'all', label: `Semua (${categoryBudgets.length})` },
            { id: 'safe', label: `Aman (${categoryBudgets.filter((b) => b.status === 'safe').length})` },
            { id: 'warning', label: `Waspada (${categoryBudgets.filter((b) => b.status === 'warning').length})` },
            { id: 'danger', label: `Lewat (${categoryBudgets.filter((b) => b.status === 'danger').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Daftar Kartu Amplop Anggaran per Kategori */}
      {filteredCategoryBudgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategoryBudgets.map((bgt) => {
            const isDanger = bgt.status === 'danger';
            const isWarning = bgt.status === 'warning';

            return (
              <Card
                key={bgt.categoryId}
                hoverEffect={true}
                className={
                  isDanger
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                    : isWarning
                    ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20'
                    : ''
                }
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon
                        name={bgt.categoryIcon}
                        color={bgt.categoryColor}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {bgt.categoryName}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Batas: <strong>{formatRupiah(bgt.limitAmount)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                          isDanger
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : isWarning
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {bgt.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-3">
                    <ProgressBar value={bgt.percentage} variant="auto" size="sm" />
                  </div>

                  {/* Sisa & Pengeluaran Terpakai */}
                  <div className="flex items-center justify-between text-xs pt-1 text-slate-600 dark:text-slate-300">
                    <div>
                      <span>Terpakai: </span>
                      <strong className="text-slate-900 dark:text-white tabular-nums">
                        {formatRupiah(bgt.spentAmount)}
                      </strong>
                    </div>

                    <div>
                      <span>Sisa: </span>
                      <strong
                        className={`tabular-nums ${
                          isDanger
                            ? 'text-rose-600 dark:text-rose-400'
                            : isWarning
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatRupiah(bgt.remainingAmount)}
                      </strong>
                    </div>
                  </div>

                  {/* Peringatan Ramah Inline */}
                  {isDanger && (
                    <div className="mt-3 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Sudah melewati batas anggaran yang direncanakan.</span>
                    </div>
                  )}

                  {isWarning && (
                    <div className="mt-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Tersisa {formatRupiah(bgt.remainingAmount)}, gunakan dengan bijak.</span>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCatId(bgt.categoryId);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Ubah Batas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBudget(bgt.categoryId)}
                      className="p-1.5 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={PieChart}
          title={
            categoryBudgets.length === 0
              ? 'Belum Ada Anggaran untuk Bulan Ini'
              : 'Tidak Ada Kategori pada Filter Ini'
          }
          description={
            categoryBudgets.length === 0
              ? 'Atur batas pengeluaran per kategori atau gunakan template otomatis 50/30/20 agar pengeluaran tidak bocor.'
              : 'Ubah pilihan filter tab di atas untuk melihat kategori lainnya.'
          }
          actionLabel={
            categoryBudgets.length === 0
              ? '+ Set Anggaran Pertama'
              : 'Tampilkan Semua'
          }
          onAction={() => {
            if (categoryBudgets.length === 0) {
              setIsModalOpen(true);
            } else {
              setFilterTab('all');
            }
          }}
        />
      )}

      {/* Modal Form Set/Edit Budget */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        existingBudgets={budgets}
        currentMonth={currentMonth}
        initialCategoryId={selectedCatId}
        onSaved={() => {}}
      />

      {/* Modal Template 50/30/20 */}
      <BudgetTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        monthlyIncome={monthlySummary.totalIncome}
        currentMonth={currentMonth}
        categories={categories}
        onApplied={() => {}}
      />
    </div>
  );
};
