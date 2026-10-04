import React, { useMemo } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { EmptyState } from '../components/ui/EmptyState';
import { formatMonthYear, formatRupiah } from '../lib/format';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { subMonths, format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  Lightbulb,
  PiggyBank,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const {
    categories,
    allTransactions,
    monthlyTransactions,
    monthlySummary,
  } = useFinanceData();

  const { currentMonth, openAddTransaction } = useAppStore();

  // 1. Data Donut Chart: Pengeluaran per Kategori Bulan Aktif
  const categoryExpenseData = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    let totalExpense = 0;

    for (const tx of monthlyTransactions) {
      if (tx.type === 'expense' && tx.categoryId) {
        expenseMap[tx.categoryId] = (expenseMap[tx.categoryId] || 0) + tx.amount;
        totalExpense += tx.amount;
      }
    }

    if (totalExpense === 0) return [];

    return Object.entries(expenseMap)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Lainnya',
          amount,
          color: cat?.color || '#6366f1',
          icon: cat?.icon || 'Tags',
          percentage: Math.round((amount / totalExpense) * 100),
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions, categories]);

  // 2. Data Bar Chart: Pemasukan vs Pengeluaran 6 Bulan Terakhir
  const sixMonthsTrendData = useMemo(() => {
    const [currYear, currMonthNum] = currentMonth.split('-').map(Number);
    const baseDate = new Date(currYear, currMonthNum - 1, 1);
    const months = [];

    // Hasilkan 6 bulan terakhir mundur dari bulan aktif
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(baseDate, i);
      const ym = format(d, 'yyyy-MM');
      const label = format(d, 'MMM yy', { locale: id });
      months.push({ yearMonth: ym, label });
    }

    return months.map(({ yearMonth, label }) => {
      let income = 0;
      let expense = 0;

      for (const tx of allTransactions) {
        const txYM = tx.date.substring(0, 7);
        if (txYM === yearMonth) {
          if (tx.type === 'income') income += tx.amount;
          else if (tx.type === 'expense') expense += tx.amount;
        }
      }

      return {
        label,
        yearMonth,
        income,
        expense,
        net: income - expense,
      };
    });
  }, [allTransactions, currentMonth]);

  // 3. Insight Kalkulasi
  const daysElapsed = Math.min(new Date().getDate(), 30);
  const averageDailyExpense = daysElapsed > 0
    ? Math.round(monthlySummary.totalExpense / daysElapsed)
    : 0;

  const isSurplus = monthlySummary.netSavings >= 0;

  // Custom Tooltip Recharts untuk format Rupiah
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-100">{data.name || data.payload.label}</p>
          <p className="text-slate-600 dark:text-slate-300">
            Nominal: <strong className="text-indigo-600 dark:text-indigo-400 tabular-nums">{formatRupiah(data.value)}</strong>
          </p>
          {data.payload.percentage !== undefined && (
            <p className="text-slate-500">Porsi: <strong>{data.payload.percentage}%</strong></p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-150">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Laporan & Analisis Cuan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Visualisasi arus kas & tren keuangan untuk <strong className="text-slate-700 dark:text-slate-200">{formatMonthYear(currentMonth)}</strong>
        </p>
      </div>

      {/* 2. Empat Kartu Insight Cerdas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Insight: Pengeluaran Terbesar */}
        <Card hoverEffect={true}>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pengeluaran Terbesar
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-500">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate mt-1">
              {monthlySummary.topExpenseCategory?.name || 'Belum Ada'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              {monthlySummary.topExpenseCategory
                ? `${formatRupiah(monthlySummary.topExpenseCategory.amount)} (${monthlySummary.topExpenseCategory.percentage}%)`
                : 'Tidak ada pengeluaran'}
            </p>
          </CardContent>
        </Card>

        {/* Insight: Rasio Tabungan */}
        <Card hoverEffect={true}>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Rasio Tabungan
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
              {monthlySummary.savingsRate}% Pemasukan
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              {isSurplus ? '+' : ''}{formatRupiah(monthlySummary.netSavings)} tersimpan
            </p>
          </CardContent>
        </Card>

        {/* Insight: Rata-Rata Harian */}
        <Card hoverEffect={true}>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Rata-rata Harian
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {formatRupiah(averageDailyExpense)} / hari
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Berdasarkan {daysElapsed} hari berjalan
            </p>
          </CardContent>
        </Card>

        {/* Insight: Status Arus Kas */}
        <Card hoverEffect={true}>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Arus Kas Bulan Ini
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isSurplus
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-500'
              }`}>
                {isSurplus ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold mt-1 ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {isSurplus ? 'Surplus (Aman)' : 'Defisit (Perlu Atur)'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isSurplus ? 'Pemasukan lebih besar' : 'Pengeluaran melebihi pemasukan'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Donut Chart & Legenda Komposisi Pengeluaran */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-indigo-500" />
            <CardTitle>Distribusi Pengeluaran per Kategori</CardTitle>
          </div>
          <CardDescription>
            Komposisi ke mana saja cuanmu mengalir pada bulan ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryExpenseData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Donut Chart Canvas */}
              <div className="lg:col-span-6 h-64 sm:h-72 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpenseData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categoryExpenseData.map((entry) => (
                        <Cell key={`cell-${entry.id}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Label inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total Keluar
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {formatRupiah(monthlySummary.totalExpense)}
                  </span>
                </div>
              </div>

              {/* Legenda Terstruktur & Nominal */}
              <div className="lg:col-span-6 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {categoryExpenseData.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-900 dark:text-white font-bold tabular-nums">
                        {formatRupiah(item.amount)}
                      </span>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 w-10 text-right tabular-nums">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={PieIcon}
              title="Belum Ada Pengeluaran Bulan Ini"
              description="Catat transaksi pengeluaranmu untuk melihat grafik proporsi kategori."
              actionLabel="+ Catat Pengeluaran"
              onAction={openAddTransaction}
            />
          )}
        </CardContent>
      </Card>

      {/* 4. Bar Chart: Perbandingan 6 Bulan Terakhir */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <CardTitle>Tren Arus Kas 6 Bulan Terakhir</CardTitle>
          </div>
          <CardDescription>
            Perbandingan pemasukan vs pengeluaran dari waktu ke waktu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sixMonthsTrendData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#888888' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0', opacity: 0.3 }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#888888' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}jt`;
                    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
                    return String(val);
                  }}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const inc = payload.find((p) => p.dataKey === 'income')?.value || 0;
                      const exp = payload.find((p) => p.dataKey === 'expense')?.value || 0;
                      const net = Number(inc) - Number(exp);
                      return (
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{label}</p>
                          <p className="text-emerald-600 dark:text-emerald-400">
                            Pemasukan: <strong className="tabular-nums">{formatRupiah(Number(inc))}</strong>
                          </p>
                          <p className="text-rose-500">
                            Pengeluaran: <strong className="tabular-nums">{formatRupiah(Number(exp))}</strong>
                          </p>
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                            Net: <strong className={net >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                              {net >= 0 ? '+' : ''}{formatRupiah(net)}
                            </strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  formatter={(val) => (val === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                />
                <Bar
                  dataKey="income"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="expense"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
