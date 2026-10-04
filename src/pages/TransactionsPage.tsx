import React, { useMemo, useState } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAppStore } from '../store/useAppStore';
import { TransactionItem } from '../components/transactions/TransactionItem';
import {
  TransactionFilterSheet,
  type FilterState,
} from '../components/transactions/TransactionFilterSheet';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { formatRupiah, formatTransactionGroupDate } from '../lib/format';
import {
  Plus,
  Search,
  Filter,
  X,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const {
    accounts,
    categories,
    allTransactions,
    deleteTransaction,
  } = useFinanceData();

  const { openAddTransaction, openEditTransaction } = useAppStore();

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    categoryId: '',
    accountId: '',
    startDate: '',
    endDate: '',
  });

  // Hitung jumlah filter aktif (selain default)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.categoryId) count++;
    if (filters.accountId) count++;
    if (filters.startDate || filters.endDate) count++;
    return count;
  }, [filters]);

  // Filter daftar transaksi berdasarkan pencarian teks dan filter aktif
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      // 1. Pencarian teks (catatan atau nama kategori atau nama dompet)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const noteMatch = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
        const cat = categories.find((c) => c.id === tx.categoryId);
        const catMatch = cat ? cat.name.toLowerCase().includes(query) : false;
        const acc = accounts.find((a) => a.id === tx.accountId);
        const accMatch = acc ? acc.name.toLowerCase().includes(query) : false;

        if (!noteMatch && !catMatch && !accMatch) {
          return false;
        }
      }

      // 2. Filter tipe
      if (filters.type !== 'all' && tx.type !== filters.type) {
        return false;
      }

      // 3. Filter dompet
      if (filters.accountId) {
        const isSource = tx.accountId === filters.accountId;
        const isDestination = tx.toAccountId === filters.accountId;
        if (!isSource && !isDestination) return false;
      }

      // 4. Filter kategori
      if (filters.categoryId && tx.categoryId !== filters.categoryId) {
        return false;
      }

      // 5. Rentang tanggal
      const txDate = tx.date.split('T')[0];
      if (filters.startDate && txDate < filters.startDate) return false;
      if (filters.endDate && txDate > filters.endDate) return false;

      return true;
    });
  }, [allTransactions, filters, categories, accounts]);

  // Kelompokkan transaksi per tanggal ("Hari ini", "Kemarin", "Kamis, 1 Okt 2026")
  const groupedTransactions = useMemo(() => {
    const groups: Record<
      string,
      {
        dateStr: string;
        formattedDate: string;
        transactions: typeof filteredTransactions;
        totalDayExpense: number;
        totalDayIncome: number;
      }
    > = {};

    for (const tx of filteredTransactions) {
      const dateKey = tx.date.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateStr: dateKey,
          formattedDate: formatTransactionGroupDate(dateKey),
          transactions: [],
          totalDayExpense: 0,
          totalDayIncome: 0,
        };
      }

      groups[dateKey].transactions.push(tx);
      if (tx.type === 'expense') {
        groups[dateKey].totalDayExpense += tx.amount;
      } else if (tx.type === 'income') {
        groups[dateKey].totalDayIncome += tx.amount;
      }
    }

    // Urutkan tanggal terbaru ke terlama
    return Object.values(groups).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [filteredTransactions]);

  // Hitung total ringkasan untuk hasil pencarian/filter saat ini
  const filterSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') expense += tx.amount;
    }
    return { income, expense };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 pb-6">
      {/* Header & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Semua Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Total {filteredTransactions.length} transaksi tercatat
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openAddTransaction}
          className="gap-2 shadow-md shadow-indigo-600/20 sm:w-auto w-full"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>+ Catat Transaksi</span>
        </Button>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari transaksi (nama, kategori, dompet, catatan)..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          variant={activeFilterCount > 0 ? 'primary' : 'outline'}
          size="md"
          onClick={() => setIsFilterSheetOpen(true)}
          className="shrink-0 gap-1.5 rounded-2xl"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-indigo-700 text-xs font-bold flex items-center justify-center -mr-1">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mini Bar Ringkasan Hasil Filter (Jika Ada Filter Aktif) */}
      {(activeFilterCount > 0 || filters.search) && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs animate-in fade-in">
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            Hasil saringan: <strong>{filteredTransactions.length}</strong> transaksi
          </span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
              +{formatRupiah(filterSummary.income)}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
              -{formatRupiah(filterSummary.expense)}
            </span>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  search: '',
                  type: 'all',
                  categoryId: '',
                  accountId: '',
                  startDate: '',
                  endDate: '',
                })
              }
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-1 cursor-pointer"
            >
              Hapus Filter
            </button>
          </div>
        </div>
      )}

      {/* Daftar Transaksi Dikelompokkan per Tanggal */}
      <div className="space-y-6">
        {groupedTransactions.length > 0 ? (
          groupedTransactions.map((group) => (
            <div key={group.dateStr} className="space-y-2">
              {/* Header Tanggal + Total Harian */}
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {group.formattedDate}
                </span>

                <div className="flex items-center gap-2 text-xs tabular-nums font-semibold">
                  {group.totalDayExpense > 0 && (
                    <span className="text-rose-500 dark:text-rose-400 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {formatRupiah(group.totalDayExpense)}
                    </span>
                  )}
                  {group.totalDayIncome > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <ArrowDownLeft className="w-3 h-3" />
                      {formatRupiah(group.totalDayIncome)}
                    </span>
                  )}
                </div>
              </div>

              {/* Daftar item transaksi pada tanggal tersebut */}
              <div className="space-y-2">
                {group.transactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    accounts={accounts}
                    categories={categories}
                    onEdit={(id) => openEditTransaction(id)}
                    onDelete={(id) => deleteTransaction(id)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="Tidak Ada Transaksi Ditemukan"
            description={
              filters.search || activeFilterCount > 0
                ? 'Coba sesuaikan kata kunci pencarian atau bersihkan filter yang aktif.'
                : 'Mulai dengan mencatat pengeluaran atau pemasukan pertamamu.'
            }
            actionLabel={
              filters.search || activeFilterCount > 0
                ? 'Bersihkan Filter'
                : '+ Catat Transaksi Baru'
            }
            onAction={() => {
              if (filters.search || activeFilterCount > 0) {
                setFilters({
                  search: '',
                  type: 'all',
                  categoryId: '',
                  accountId: '',
                  startDate: '',
                  endDate: '',
                });
              } else {
                openAddTransaction();
              }
            }}
          />
        )}
      </div>

      {/* Filter Bottom Sheet Modal */}
      <TransactionFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
};
