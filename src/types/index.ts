/**
 * Tipe data lengkap untuk aplikasi Jaga Cuan
 * Semua nominal Rupiah disimpan sebagai INTEGER positif (bukan float)
 */

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number; // Integer (Rupiah)
  icon: string;
  color: string;
  createdAt: string; // ISO String
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // Format: 'YYYY-MM'
  limitAmount: number; // Integer (Rupiah)
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Integer positif (Rupiah)
  accountId: string; // Dompet sumber (atau dompet transaksi)
  toAccountId?: string | null; // Dompet tujuan (hanya jika type === 'transfer')
  categoryId?: string | null; // Kategori (null jika transfer)
  date: string; // Format ISO: 'YYYY-MM-DD' atau 'YYYY-MM-DDTHH:mm:ss.sssZ'
  notes?: string;
  recurringId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RecurringFrequency = 'weekly' | 'monthly';

export interface RecurringRule {
  id: string;
  templateTransaction: {
    type: TransactionType;
    amount: number;
    accountId: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    notes?: string;
  };
  frequency: RecurringFrequency;
  nextDate: string; // Format ISO 'YYYY-MM-DD'
  active: boolean;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number; // Integer
  savedAmount: number; // Integer
  deadline?: string; // Format ISO 'YYYY-MM-DD'
  createdAt: string;
}

export interface AppSetting {
  key: string;
  value: string | number | boolean;
}

export type BudgetStatusLevel = 'safe' | 'warning' | 'danger';

export interface CategoryBudgetStatus {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: BudgetStatusLevel;
}

export interface MonthSummary {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // Persentase 0 - 100
  topExpenseCategory?: {
    categoryId: string;
    name: string;
    amount: number;
    percentage: number;
  };
}

export interface ExportBackupPayload {
  version: number;
  exportedAt: string;
  appName: 'Jaga Cuan';
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  recurring: RecurringRule[];
  goals: SavingsGoal[];
  settings: Record<string, string | number | boolean>;
}
