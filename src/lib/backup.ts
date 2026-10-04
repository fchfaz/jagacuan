import { backupFileSchema } from './validation';
import type { ExportBackupPayload, Transaction, Account, Category } from '../types';

/**
 * Buat payload JSON backup lengkap
 */
export function createBackupPayload(data: Omit<ExportBackupPayload, 'version' | 'exportedAt' | 'appName'>): ExportBackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'Jaga Cuan',
    ...data,
  };
}

/**
 * Validasi dan parse data JSON cadangan (backup)
 */
export function validateBackupJson(jsonString: string): {
  success: boolean;
  data?: ExportBackupPayload;
  error?: string;
} {
  try {
    const rawData = JSON.parse(jsonString);
    const parsed = backupFileSchema.safeParse(rawData);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join('.');
      return {
        success: false,
        error: `Format cadangan tidak valid: ${field ? `${field} - ` : ''}${issue.message}`,
      };
    }

    return {
      success: true,
      data: parsed.data as ExportBackupPayload,
    };
  } catch {
    return {
      success: false,
      error: 'File bukan format JSON yang valid.',
    };
  }
}

/**
 * Konversi daftar transaksi menjadi format CSV
 */
export function exportTransactionsToCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = [
    'ID',
    'Tanggal',
    'Tipe',
    'Nominal (Rp)',
    'Dompet Asal',
    'Dompet Tujuan',
    'Kategori',
    'Catatan',
  ];

  const rows = transactions.map((tx) => {
    const typeLabel =
      tx.type === 'income'
        ? 'Pemasukan'
        : tx.type === 'expense'
        ? 'Pengeluaran'
        : 'Transfer';

    const accountName = accountMap.get(tx.accountId) || tx.accountId;
    const toAccountName = tx.toAccountId ? accountMap.get(tx.toAccountId) || tx.toAccountId : '';
    const categoryName = tx.categoryId ? categoryMap.get(tx.categoryId) || tx.categoryId : '';
    const safeNotes = (tx.notes || '').replace(/"/g, '""');

    return [
      `"${tx.id}"`,
      `"${tx.date}"`,
      `"${typeLabel}"`,
      tx.amount,
      `"${accountName}"`,
      `"${toAccountName}"`,
      `"${categoryName}"`,
      `"${safeNotes}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Trigger download file di browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
