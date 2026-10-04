import type {
  Account,
  Budget,
  Category,
  CategoryBudgetStatus,
  MonthSummary,
  Transaction,
} from '../types';

/**
 * Menghitung saldo setiap dompet secara akurat:
 * Saldo = initialBalance + Pemasukan - Pengeluaran + Transfer Masuk - Transfer Keluar
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Inisialisasi dengan initialBalance
  for (const acc of accounts) {
    balances[acc.id] = acc.initialBalance || 0;
  }

  // Akumulasikan semua transaksi
  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;

    if (tx.type === 'income') {
      if (balances[tx.accountId] !== undefined) {
        balances[tx.accountId] += amount;
      }
    } else if (tx.type === 'expense') {
      if (balances[tx.accountId] !== undefined) {
        balances[tx.accountId] -= amount;
      }
    } else if (tx.type === 'transfer') {
      // Potong dari dompet asal
      if (balances[tx.accountId] !== undefined) {
        balances[tx.accountId] -= amount;
      }
      // Tambah ke dompet tujuan
      if (tx.toAccountId && balances[tx.toAccountId] !== undefined) {
        balances[tx.toAccountId] += amount;
      }
    }
  }

  return balances;
}

/**
 * Menghitung total saldo seluruh dompet
 */
export function calculateTotalBalance(
  accounts: Account[],
  transactions: Transaction[]
): number {
  const balances = calculateAccountBalances(accounts, transactions);
  return Object.values(balances).reduce((acc, curr) => acc + curr, 0);
}

/**
 * Menentukan rentang tanggal bulan berjalan dengan memperhitungkan hari awal bulan (cutoff date)
 * Default startDayOfMonth = 1 (1 s/d akhir bulan)
 * Jika misal startDayOfMonth = 25 (siklus gajian 25 Sep s/d 24 Okt untuk bulan Oktober)
 */
export function getMonthDateRange(
  yearMonth: string,
  startDayOfMonth = 1
): { startDate: Date; endDate: Date } {
  const [year, month] = yearMonth.split('-').map(Number);

  if (startDayOfMonth <= 1) {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    // Hari terakhir bulan
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  } else {
    // Dimulai dari tanggal startDayOfMonth bulan sebelumnya
    const prevMonthDate = new Date(year, month - 2, startDayOfMonth, 0, 0, 0, 0);
    // Berakhir pada tanggal (startDayOfMonth - 1) bulan berjalan
    const currentCutoffDate = new Date(year, month - 1, startDayOfMonth - 1, 23, 59, 59, 999);
    return { startDate: prevMonthDate, endDate: currentCutoffDate };
  }
}

/**
 * Filter transaksi yang masuk ke dalam periode bulan tertentu
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  yearMonth: string,
  startDayOfMonth = 1
): Transaction[] {
  const { startDate, endDate } = getMonthDateRange(yearMonth, startDayOfMonth);
  const startTs = startDate.getTime();
  const endTs = endDate.getTime();

  return transactions.filter((tx) => {
    // Normalisasi tanggal ISO 'YYYY-MM-DD'
    const dateObj = new Date(tx.date.length === 10 ? `${tx.date}T00:00:00` : tx.date);
    const txTs = dateObj.getTime();
    return txTs >= startTs && txTs <= endTs;
  });
}

/**
 * Hitung status anggaran (persentase, nominal tersisa, dan level peringatan):
 * < 80%   -> 'safe' (hijau)
 * 80%-99% -> 'warning' (kuning/amber)
 * >= 100% -> 'danger' (merah/rose)
 */
export function calculateBudgetStatus(
  limitAmount: number,
  spentAmount: number
): {
  percentage: number;
  remainingAmount: number;
  status: 'safe' | 'warning' | 'danger';
} {
  const limit = Math.max(0, limitAmount);
  const spent = Math.max(0, spentAmount);

  if (limit === 0) {
    return {
      percentage: spent > 0 ? 100 : 0,
      remainingAmount: -spent,
      status: spent > 0 ? 'danger' : 'safe',
    };
  }

  const percentage = Math.round((spent / limit) * 100);
  const remainingAmount = limit - spent;

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (percentage >= 100) {
    status = 'danger';
  } else if (percentage >= 80) {
    status = 'warning';
  }

  return { percentage, remainingAmount, status };
}

/**
 * Evaluasi seluruh anggaran per kategori untuk bulan tertentu
 */
export function evaluateBudgetsForMonth(
  budgets: Budget[],
  categories: Category[],
  monthlyTransactions: Transaction[]
): CategoryBudgetStatus[] {
  // Hitung total pengeluaran per kategori
  const spentMap: Record<string, number> = {};
  for (const tx of monthlyTransactions) {
    if (tx.type === 'expense' && tx.categoryId) {
      spentMap[tx.categoryId] = (spentMap[tx.categoryId] || 0) + tx.amount;
    }
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return budgets.map((bgt) => {
    const category = categoryMap.get(bgt.categoryId);
    const spentAmount = spentMap[bgt.categoryId] || 0;
    const { percentage, remainingAmount, status } = calculateBudgetStatus(
      bgt.limitAmount,
      spentAmount
    );

    return {
      categoryId: bgt.categoryId,
      categoryName: category?.name || 'Kategori Tidak Diketahui',
      categoryIcon: category?.icon || 'Tags',
      categoryColor: category?.color || '#6366f1',
      limitAmount: bgt.limitAmount,
      spentAmount,
      remainingAmount,
      percentage,
      status,
    };
  });
}

/**
 * Hitung ringkasan keuangan bulanan (Pemasukan, Pengeluaran, Tabungan Bersih, Kategori Pengeluaran Teratas)
 */
export function calculateMonthSummary(
  transactions: Transaction[],
  categories: Category[],
  yearMonth: string,
  startDayOfMonth = 1
): MonthSummary {
  const periodTransactions = filterTransactionsByPeriod(transactions, yearMonth, startDayOfMonth);

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory: Record<string, number> = {};

  for (const tx of periodTransactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount;
      if (tx.categoryId) {
        expenseByCategory[tx.categoryId] = (expenseByCategory[tx.categoryId] || 0) + tx.amount;
      }
    }
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0
    ? Math.max(0, Math.round((netSavings / totalIncome) * 100))
    : 0;

  // Temukan kategori pengeluaran terbesar
  let topExpenseCategory: MonthSummary['topExpenseCategory'] = undefined;
  let maxExpense = 0;
  let maxCatId = '';

  for (const [catId, amount] of Object.entries(expenseByCategory)) {
    if (amount > maxExpense) {
      maxExpense = amount;
      maxCatId = catId;
    }
  }

  if (maxCatId) {
    const cat = categories.find((c) => c.id === maxCatId);
    topExpenseCategory = {
      categoryId: maxCatId,
      name: cat?.name || 'Lainnya',
      amount: maxExpense,
      percentage: totalExpense > 0 ? Math.round((maxExpense / totalExpense) * 100) : 0,
    };
  }

  return {
    yearMonth,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    topExpenseCategory,
  };
}

/**
 * Hitung rekomendasi anggaran 50/30/20 dari total pemasukan
 * 50% Kebutuhan Pokok (Needs)
 * 30% Keinginan (Wants)
 * 20% Tabungan / Investasi / Pelunasan Hutang (Savings/Debts)
 */
export function calculate503020Rule(totalIncome: number): {
  needs: number;
  wants: number;
  savings: number;
} {
  const income = Math.max(0, totalIncome);
  return {
    needs: Math.round(income * 0.5),
    wants: Math.round(income * 0.3),
    savings: Math.round(income * 0.2),
  };
}
