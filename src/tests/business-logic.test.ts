import { describe, it, expect } from 'vitest';
import {
  calculateAccountBalances,
  calculateTotalBalance,
  calculateBudgetStatus,
  getMonthDateRange,
  filterTransactionsByPeriod,
  calculate503020Rule,
} from '../lib/calculations';
import { formatRupiah, parseRupiah } from '../lib/format';
import { processRecurringRules } from '../lib/recurring';
import { validateBackupJson } from '../lib/backup';
import type { Account, RecurringRule, Transaction } from '../types';

describe('Jaga Cuan - Logika Bisnis & Keuangan', () => {
  // 1. Uji Perhitungan Saldo Dompet
  describe('1. Perhitungan Saldo Dompet (Wallet Balance)', () => {
    const dummyAccounts: Account[] = [
      {
        id: 'acc-tunai',
        name: 'Dompet Tunai',
        type: 'cash',
        initialBalance: 100_000,
        icon: 'Banknote',
        color: '#10b981',
        createdAt: '2026-10-01',
      },
      {
        id: 'acc-bca',
        name: 'BCA',
        type: 'bank',
        initialBalance: 5_000_000,
        icon: 'Building2',
        color: '#3b82f6',
        createdAt: '2026-10-01',
      },
    ];

    it('menghitung saldo awal tanpa transaksi', () => {
      const balances = calculateAccountBalances(dummyAccounts, []);
      expect(balances['acc-tunai']).toBe(100_000);
      expect(balances['acc-bca']).toBe(5_000_000);
      expect(calculateTotalBalance(dummyAccounts, [])).toBe(5_100_000);
    });

    it('menambah saldo saat ada pemasukan dan mengurangi saat ada pengeluaran', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          type: 'income',
          amount: 2_000_000,
          accountId: 'acc-bca',
          date: '2026-10-02',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'tx-2',
          type: 'expense',
          amount: 50_000,
          accountId: 'acc-tunai',
          categoryId: 'cat-food',
          date: '2026-10-02',
          createdAt: '',
          updatedAt: '',
        },
      ];

      const balances = calculateAccountBalances(dummyAccounts, transactions);
      expect(balances['acc-bca']).toBe(7_000_000); // 5jt + 2jt
      expect(balances['acc-tunai']).toBe(50_000); // 100rb - 50rb
      expect(calculateTotalBalance(dummyAccounts, transactions)).toBe(7_050_000);
    });

    it('memindahkan saldo dengan akurat saat transfer antar dompet', () => {
      const transferTx: Transaction[] = [
        {
          id: 'tx-trf-1',
          type: 'transfer',
          amount: 500_000,
          accountId: 'acc-bca', // Asal
          toAccountId: 'acc-tunai', // Tujuan
          date: '2026-10-03',
          createdAt: '',
          updatedAt: '',
        },
      ];

      const balances = calculateAccountBalances(dummyAccounts, transferTx);
      expect(balances['acc-bca']).toBe(4_500_000); // 5.000.000 - 500.000
      expect(balances['acc-tunai']).toBe(600_000); // 100.000 + 500.000
      // Total gabungan saldo tetap sama
      expect(calculateTotalBalance(dummyAccounts, transferTx)).toBe(5_100_000);
    });
  });

  // 2. Uji Status Anggaran (Envelope Budgeting)
  describe('2. Status Anggaran (Safe / Warning / Danger)', () => {
    it('mengembalikan status safe jika pengeluaran < 80%', () => {
      const result = calculateBudgetStatus(1_000_000, 600_000);
      expect(result.percentage).toBe(60);
      expect(result.remainingAmount).toBe(400_000);
      expect(result.status).toBe('safe');
    });

    it('mengembalikan status warning jika pengeluaran antara 80% hingga 99%', () => {
      const result = calculateBudgetStatus(1_000_000, 850_000);
      expect(result.percentage).toBe(85);
      expect(result.remainingAmount).toBe(150_000);
      expect(result.status).toBe('warning');
    });

    it('mengembalikan status danger jika pengeluaran >= 100%', () => {
      const resultExact = calculateBudgetStatus(1_000_000, 1_000_000);
      expect(resultExact.percentage).toBe(100);
      expect(resultExact.remainingAmount).toBe(0);
      expect(resultExact.status).toBe('danger');

      const resultOver = calculateBudgetStatus(1_000_000, 1_250_000);
      expect(resultOver.percentage).toBe(125);
      expect(resultOver.remainingAmount).toBe(-250_000);
      expect(resultOver.status).toBe('danger');
    });
  });

  // 3. Uji Generator Transaksi Berulang (Idempotent)
  describe('3. Generator Transaksi Berulang Idempoten', () => {
    it('menghasilkan transaksi jika tanggal eksekusi telah tiba dan memajukan nextDate', () => {
      const rules: RecurringRule[] = [
        {
          id: 'rule-langganan',
          templateTransaction: {
            type: 'expense',
            amount: 150_000,
            accountId: 'acc-bca',
            categoryId: 'cat-bills',
            notes: 'Langganan Netflix',
          },
          frequency: 'monthly',
          nextDate: '2026-10-01',
          active: true,
          createdAt: '2026-09-01',
        },
      ];

      const simDate = new Date(2026, 9, 2); // 2 Oktober 2026 (lewat dari 1 Okt)
      const { newTransactions, updatedRules } = processRecurringRules(rules, simDate);

      expect(newTransactions).toHaveLength(1);
      expect(newTransactions[0].amount).toBe(150_000);
      expect(newTransactions[0].date).toBe('2026-10-01');
      expect(updatedRules[0].nextDate).toBe('2026-11-01');

      // Jalankan ulang dengan aturan yang telah diperbarui (idempoten)
      const secondRun = processRecurringRules(updatedRules, simDate);
      expect(secondRun.newTransactions).toHaveLength(0); // Tidak membuat duplikasi
    });
  });

  // 4. Uji Pergantian Bulan & Cutoff Gaji (startDayOfMonth)
  describe('4. Siklus Pergantian Bulan & Cutoff Hari Awal', () => {
    it('menghitung rentang kalender normal jika startDayOfMonth = 1', () => {
      const { startDate, endDate } = getMonthDateRange('2026-10', 1);
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getMonth()).toBe(9); // 0-indexed, Oktober = 9
      expect(endDate.getDate()).toBe(31);
      expect(endDate.getMonth()).toBe(9);
    });

    it('menghitung rentang siklus gaji jika startDayOfMonth = 25', () => {
      const { startDate, endDate } = getMonthDateRange('2026-10', 25);
      // Siklus Oktober dimulai dari 25 September s/d 24 Oktober
      expect(startDate.getDate()).toBe(25);
      expect(startDate.getMonth()).toBe(8); // September = 8
      expect(endDate.getDate()).toBe(24);
      expect(endDate.getMonth()).toBe(9); // Oktober = 9
    });

    it('memfilter transaksi yang berada dalam rentang siklus', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'expense', amount: 100, accountId: 'a', date: '2026-09-26', createdAt: '', updatedAt: '' },
        { id: '2', type: 'expense', amount: 200, accountId: 'a', date: '2026-10-10', createdAt: '', updatedAt: '' },
        { id: '3', type: 'expense', amount: 300, accountId: 'a', date: '2026-10-28', createdAt: '', updatedAt: '' },
      ];

      // Siklus 25 Sep - 24 Okt
      const filtered = filterTransactionsByPeriod(txs, '2026-10', 25);
      expect(filtered.map((t) => t.id)).toEqual(['1', '2']);
      expect(filtered.find((t) => t.id === '3')).toBeUndefined();
    });
  });

  // 5. Uji Parsing dan Formatting Nominal Rupiah
  describe('5. Parsing dan Formatting Nominal Rupiah', () => {
    it('memformat angka ke Rupiah standar', () => {
      expect(formatRupiah(15000)).toBe('Rp 15.000');
      expect(formatRupiah(2500000)).toBe('Rp 2.500.000');
      expect(formatRupiah(0)).toBe('Rp 0');
    });

    it('mem-parsing string angka "15.000" dan "15000" menjadi integer 15000', () => {
      expect(parseRupiah('15.000')).toBe(15000);
      expect(parseRupiah('15000')).toBe(15000);
      expect(parseRupiah('Rp 2.500.000')).toBe(2500000);
      expect(parseRupiah('2,500,000')).toBe(2500000);
    });

    it('menolak nilai negatif dan membatasi pada batas wajar', () => {
      expect(parseRupiah(-5000)).toBe(0);
      expect(parseRupiah('abc')).toBe(0);
      // Nilai ekstrem di atas 1 Triliun dibatasi maksimal 1 Triliun
      expect(parseRupiah(2_000_000_000_000)).toBe(1_000_000_000_000);
    });
  });

  // 6. Uji Aturan 50/30/20
  describe('6. Template Anggaran 50/30/20', () => {
    it('membagi pemasukan 50% Kebutuhan, 30% Keinginan, 20% Tabungan', () => {
      const budget503020 = calculate503020Rule(10_000_000);
      expect(budget503020.needs).toBe(5_000_000);
      expect(budget503020.wants).toBe(3_000_000);
      expect(budget503020.savings).toBe(2_000_000);
    });
  });

  // 7. Uji Validasi Backup JSON
  describe('7. Validasi Payload Backup', () => {
    it('menerima backup valid dan menolak payload rusak', () => {
      const validPayload = JSON.stringify({
        version: 1,
        appName: 'Jaga Cuan',
        accounts: [],
        categories: [],
        budgets: [],
        transactions: [],
        recurring: [],
        goals: [],
        settings: {},
      });

      const validResult = validateBackupJson(validPayload);
      expect(validResult.success).toBe(true);
      expect(validResult.data?.appName).toBe('Jaga Cuan');

      const invalidPayload = JSON.stringify({
        appName: 'Wrong App',
      });
      const invalidResult = validateBackupJson(invalidPayload);
      expect(invalidResult.success).toBe(false);
    });
  });
});
