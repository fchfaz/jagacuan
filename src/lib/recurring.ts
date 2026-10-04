import { addMonths, addWeeks, format, isBefore, isSameDay, parseISO } from 'date-fns';
import type { RecurringRule, Transaction } from '../types';

/**
 * Generator transaksi berulang yang idempoten.
 * Memeriksa apakah ada jadwal transaksi berulang yang tanggalnya sudah tiba atau terlewati,
 * menghasilkan transaksi baru, dan memperbarui tanggal eksekusi berikutnya (nextDate).
 */
export function processRecurringRules(
  rules: RecurringRule[],
  currentDate: Date = new Date()
): {
  newTransactions: Transaction[];
  updatedRules: RecurringRule[];
} {
  const newTransactions: Transaction[] = [];
  const updatedRules: RecurringRule[] = [];
  const todayStr = format(currentDate, 'yyyy-MM-dd');
  const todayDate = parseISO(todayStr);

  for (const rule of rules) {
    if (!rule.active) {
      continue;
    }

    let nextDateObj = parseISO(rule.nextDate);
    let ruleModified = false;
    let iterations = 0;
    // Pengaman perulangan tak terhingga (maks. 52 kali per aturan)
    const MAX_ITERATIONS = 52;

    while (
      (isBefore(nextDateObj, todayDate) || isSameDay(nextDateObj, todayDate)) &&
      iterations < MAX_ITERATIONS
    ) {
      iterations++;
      ruleModified = true;
      const executionDateStr = format(nextDateObj, 'yyyy-MM-dd');

      // Buat transaksi otomatis baru
      const tx: Transaction = {
        id: `rec-tx-${rule.id}-${executionDateStr}`,
        type: rule.templateTransaction.type,
        amount: rule.templateTransaction.amount,
        accountId: rule.templateTransaction.accountId,
        toAccountId: rule.templateTransaction.toAccountId || null,
        categoryId: rule.templateTransaction.categoryId || null,
        date: executionDateStr,
        notes: rule.templateTransaction.notes
          ? `${rule.templateTransaction.notes} (Berulang)`
          : 'Transaksi Berulang Otomatis',
        recurringId: rule.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newTransactions.push(tx);

      // Hitung jadwal berikutnya
      if (rule.frequency === 'weekly') {
        nextDateObj = addWeeks(nextDateObj, 1);
      } else if (rule.frequency === 'monthly') {
        nextDateObj = addMonths(nextDateObj, 1);
      } else {
        break;
      }
    }

    if (ruleModified) {
      updatedRules.push({
        ...rule,
        nextDate: format(nextDateObj, 'yyyy-MM-dd'),
      });
    }
  }

  return { newTransactions, updatedRules };
}
