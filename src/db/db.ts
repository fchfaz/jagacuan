import Dexie, { type Table } from 'dexie';
import type {
  Account,
  Category,
  Budget,
  Transaction,
  RecurringRule,
  SavingsGoal,
  AppSetting,
} from '../types';

/**
 * Database IndexedDB Jaga Cuan menggunakan Dexie.js
 * Nama DB: JagaCuanDB
 */
export class JagaCuanDatabase extends Dexie {
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;
  transactions!: Table<Transaction, string>;
  recurring!: Table<RecurringRule, string>;
  goals!: Table<SavingsGoal, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('JagaCuanDB');

    // Skema Versi 1
    this.version(1).stores({
      accounts: 'id, type, createdAt',
      categories: 'id, type, isDefault, createdAt',
      budgets: 'id, [categoryId+month], month, categoryId',
      transactions: 'id, date, accountId, categoryId, [type+date], recurringId, createdAt',
      recurring: 'id, frequency, nextDate, active',
      goals: 'id, deadline',
      settings: 'key',
    });

    // Contoh migrasi untuk skema masa depan jika bertambah versi (misal versi 2)
    this.version(2).upgrade(async (tx) => {
      // Migrasi placeholder idempoten untuk kompatibilitas masa depan
      const existingSettings = tx.table('settings');
      const versionRecord = await existingSettings.get('db_schema_version');
      if (!versionRecord) {
        await existingSettings.put({ key: 'db_schema_version', value: 2 });
      }
    });
  }
}

export const db = new JagaCuanDatabase();

/**
 * Kategori bawaan standar keuangan pribadi
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // Pengeluaran (Expense)
  {
    id: 'cat-food',
    name: 'Makanan & Minuman',
    type: 'expense',
    icon: 'Utensils',
    color: '#f97316', // Orange
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-transport',
    name: 'Transportasi',
    type: 'expense',
    icon: 'Car',
    color: '#3b82f6', // Blue
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-bills',
    name: 'Tagihan & Utilitas',
    type: 'expense',
    icon: 'Receipt',
    color: '#ef4444', // Red
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-shopping',
    name: 'Belanja',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#ec4899', // Pink
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-entertainment',
    name: 'Hiburan',
    type: 'expense',
    icon: 'Film',
    color: '#8b5cf6', // Purple
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-health',
    name: 'Kesehatan',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#10b981', // Emerald
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-education',
    name: 'Pendidikan',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#06b6d4', // Cyan
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-emergency',
    name: 'Darurat',
    type: 'expense',
    icon: 'ShieldAlert',
    color: '#f43f5e', // Rose
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-expense-other',
    name: 'Lainnya',
    type: 'expense',
    icon: 'MoreHorizontal',
    color: '#64748b', // Slate
    isDefault: true,
    createdAt: new Date().toISOString(),
  },

  // Pemasukan (Income)
  {
    id: 'cat-salary',
    name: 'Gaji',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981', // Emerald
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-freelance',
    name: 'Freelance',
    type: 'income',
    icon: 'Laptop',
    color: '#06b6d4', // Cyan
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-investment',
    name: 'Investasi',
    type: 'income',
    icon: 'TrendingUp',
    color: '#6366f1', // Indigo
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-gift',
    name: 'Hadiah',
    type: 'income',
    icon: 'Gift',
    color: '#f59e0b', // Amber
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-income-other',
    name: 'Lainnya',
    type: 'income',
    icon: 'CircleDollarSign',
    color: '#64748b', // Slate
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Dompet bawaan awal
 */
export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-cash',
    name: 'Dompet Tunai',
    type: 'cash',
    initialBalance: 0,
    icon: 'Banknote',
    color: '#10b981',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-bank',
    name: 'Rekening Bank',
    type: 'bank',
    initialBalance: 0,
    icon: 'Building2',
    color: '#3b82f6',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-ewallet',
    name: 'E-Wallet',
    type: 'ewallet',
    initialBalance: 0,
    icon: 'Smartphone',
    color: '#8b5cf6',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Pengaturan bawaan sistem
 */
export const DEFAULT_SETTINGS: AppSetting[] = [
  { key: 'currency', value: 'IDR' },
  { key: 'startDayOfMonth', value: 1 },
  { key: 'theme', value: 'system' },
  { key: 'onboardingCompleted', value: false },
  { key: 'hasSeededSampleData', value: false },
];

/**
 * Inisialisasi database jika masih kosong
 */
export async function initDatabaseDefaults(): Promise<void> {
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }

  const accountCount = await db.accounts.count();
  if (accountCount === 0) {
    await db.accounts.bulkAdd(DEFAULT_ACCOUNTS);
  }

  for (const setting of DEFAULT_SETTINGS) {
    const existing = await db.settings.get(setting.key);
    if (!existing) {
      await db.settings.put(setting);
    }
  }
}

/**
 * Seed data contoh untuk demonstrasi / eksplorasi aplikasi
 */
export async function seedSampleData(): Promise<void> {
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Format tanggal bantu
  const makeDate = (dayOffset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    return d.toISOString().split('T')[0];
  };

  // Reset tabel transaksi & anggaran jika seeder dijalankan
  await db.transactions.clear();
  await db.budgets.clear();
  await db.goals.clear();

  // Set saldo awal akun
  await db.accounts.update('acc-cash', { initialBalance: 500000 });
  await db.accounts.update('acc-bank', { initialBalance: 8500000 });
  await db.accounts.update('acc-ewallet', { initialBalance: 750000 });

  // Tambah transaksi contoh
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 8500000,
      accountId: 'acc-bank',
      categoryId: 'cat-salary',
      date: makeDate(10),
      notes: 'Gaji Bulanan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      type: 'income',
      amount: 1200000,
      accountId: 'acc-bank',
      categoryId: 'cat-freelance',
      date: makeDate(4),
      notes: 'Proyek UI/UX Design',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 45000,
      accountId: 'acc-cash',
      categoryId: 'cat-food',
      date: makeDate(0), // Hari ini
      notes: 'Makan siang coto Makassar',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 150000,
      accountId: 'acc-ewallet',
      categoryId: 'cat-transport',
      date: makeDate(1), // Kemarin
      notes: 'Bensin & Tol',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 420000,
      accountId: 'acc-bank',
      categoryId: 'cat-bills',
      date: makeDate(3),
      notes: 'Listrik PLN & WiFi Indihome',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 350000,
      accountId: 'acc-ewallet',
      categoryId: 'cat-shopping',
      date: makeDate(5),
      notes: 'Belanja perlengkapan rumah',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 1800000,
      accountId: 'acc-bank',
      categoryId: 'cat-food',
      date: makeDate(7),
      notes: 'Restok bahan makanan supermarket',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-8',
      type: 'transfer',
      amount: 500000,
      accountId: 'acc-bank',
      toAccountId: 'acc-ewallet',
      date: makeDate(8),
      notes: 'Top-up E-Wallet',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await db.transactions.bulkAdd(sampleTransactions);

  // Anggaran bulanan contoh
  const sampleBudgets: Budget[] = [
    {
      id: `bgt-food-${currentYearMonth}`,
      categoryId: 'cat-food',
      month: currentYearMonth,
      limitAmount: 2500000,
    },
    {
      id: `bgt-transport-${currentYearMonth}`,
      categoryId: 'cat-transport',
      month: currentYearMonth,
      limitAmount: 600000,
    },
    {
      id: `bgt-bills-${currentYearMonth}`,
      categoryId: 'cat-bills',
      month: currentYearMonth,
      limitAmount: 800000,
    },
    {
      id: `bgt-shopping-${currentYearMonth}`,
      categoryId: 'cat-shopping',
      month: currentYearMonth,
      limitAmount: 1000000,
    },
    {
      id: `bgt-entertainment-${currentYearMonth}`,
      categoryId: 'cat-entertainment',
      month: currentYearMonth,
      limitAmount: 500000,
    },
  ];

  await db.budgets.bulkAdd(sampleBudgets);

  // Target Tabungan contoh
  await db.goals.add({
    id: 'goal-emergency-fund',
    name: 'Dana Darurat 6 Bulan',
    targetAmount: 30000000,
    savedAmount: 12500000,
    deadline: `${now.getFullYear() + 1}-12-31`,
    createdAt: new Date().toISOString(),
  });

  await db.settings.put({ key: 'hasSeededSampleData', value: true });
}

/**
 * Aturan penghapusan kategori:
 * Jika kategori telah memiliki transaksi, transaksi dipindahkan ke kategori 'Lainnya'
 * atau tolak penghapusan dengan pesan error jelas.
 */
export async function safelyDeleteCategory(
  categoryId: string,
  actionIfHasTransactions: 'move_to_other' | 'block' = 'move_to_other'
): Promise<{ success: boolean; message: string }> {
  const category = await db.categories.get(categoryId);
  if (!category) {
    return { success: false, message: 'Kategori tidak ditemukan.' };
  }

  if (category.isDefault && (categoryId === 'cat-expense-other' || categoryId === 'cat-income-other')) {
    return { success: false, message: 'Kategori utama "Lainnya" tidak dapat dihapus.' };
  }

  const transactionCount = await db.transactions.where('categoryId').equals(categoryId).count();

  if (transactionCount > 0) {
    if (actionIfHasTransactions === 'block') {
      return {
        success: false,
        message: `Kategori ini masih memiliki ${transactionCount} transaksi aktif. Pindahkan transaksi terlebih dahulu sebelum menghapus.`,
      };
    }

    // Pindahkan transaksi ke kategori "Lainnya" yang sesuai tipe
    const fallbackId = category.type === 'expense' ? 'cat-expense-other' : 'cat-income-other';
    await db.transactions
      .where('categoryId')
      .equals(categoryId)
      .modify({ categoryId: fallbackId });
  }

  // Hapus anggaran terkait kategori ini
  await db.budgets.where('categoryId').equals(categoryId).delete();
  // Hapus kategori
  await db.categories.delete(categoryId);

  return {
    success: true,
    message: transactionCount > 0
      ? `Kategori dihapus. ${transactionCount} transaksi telah dipindahkan ke "Lainnya".`
      : 'Kategori berhasil dihapus.',
  };
}
