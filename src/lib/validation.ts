import { z } from 'zod';
import { parseRupiah } from './format';

const MAX_RUPIAH_LIMIT = 1_000_000_000_000; // 1 Triliun

/**
 * Validasi skema transaksi
 */
export const transactionFormSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z
      .union([z.number(), z.string()])
      .transform((val) => parseRupiah(val))
      .refine((val) => val > 0, {
        message: 'Nominal harus lebih besar dari Rp 0',
      })
      .refine((val) => val <= MAX_RUPIAH_LIMIT, {
        message: 'Nominal melebihi batas wajar (maks. 1 Triliun)',
      }),
    accountId: z.string().min(1, { message: 'Pilih dompet' }),
    toAccountId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    date: z.string().min(1, { message: 'Tanggal wajib diisi' }).refine((dateStr) => {
      const d = new Date(dateStr);
      return !isNaN(d.getTime());
    }, { message: 'Tanggal tidak valid' }),
    notes: z.string().max(200, { message: 'Catatan maksimal 200 karakter' }).optional(),
  })
  .superRefine((data, ctx) => {
    // Validasi transfer
    if (data.type === 'transfer') {
      if (!data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toAccountId'],
          message: 'Pilih dompet tujuan transfer',
        });
      } else if (data.accountId === data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toAccountId'],
          message: 'Dompet tujuan tidak boleh sama dengan dompet asal',
        });
      }
    } else {
      // Validasi income/expense wajib memiliki kategori
      if (!data.categoryId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categoryId'],
          message: 'Pilih kategori',
        });
      }
    }
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

/**
 * Validasi skema anggaran
 */
export const budgetFormSchema = z.object({
  categoryId: z.string().min(1, { message: 'Pilih kategori anggaran' }),
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: 'Format bulan harus YYYY-MM' }),
  limitAmount: z
    .union([z.number(), z.string()])
    .transform((val) => parseRupiah(val))
    .refine((val) => val > 0, {
      message: 'Batas anggaran harus lebih besar dari Rp 0',
    })
    .refine((val) => val <= MAX_RUPIAH_LIMIT, {
      message: 'Anggaran melebihi batas wajar',
    }),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

/**
 * Validasi skema dompet / akun
 */
export const accountFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama dompet wajib diisi' }).max(50, { message: 'Maks. 50 karakter' }),
  type: z.enum(['cash', 'bank', 'ewallet', 'other']),
  initialBalance: z
    .union([z.number(), z.string()])
    .transform((val) => parseRupiah(val))
    .refine((val) => val >= 0, {
      message: 'Saldo awal tidak boleh negatif',
    }),
  icon: z.string().default('Wallet'),
  color: z.string().default('#3b82f6'),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

/**
 * Validasi skema target tabungan
 */
export const goalFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama target wajib diisi' }),
  targetAmount: z
    .union([z.number(), z.string()])
    .transform((val) => parseRupiah(val))
    .refine((val) => val > 0, {
      message: 'Target nominal harus lebih dari Rp 0',
    }),
  savedAmount: z
    .union([z.number(), z.string()])
    .transform((val) => parseRupiah(val))
    .default(0),
  deadline: z.string().optional(),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;

/**
 * Validasi skema file backup JSON saat diimpor
 */
export const backupFileSchema = z.object({
  version: z.number().optional().default(1),
  appName: z.literal('Jaga Cuan'),
  accounts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['cash', 'bank', 'ewallet', 'other']),
      initialBalance: z.number(),
      icon: z.string(),
      color: z.string(),
      createdAt: z.string(),
    })
  ),
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['income', 'expense']),
      icon: z.string(),
      color: z.string(),
      isDefault: z.boolean().optional(),
      createdAt: z.string(),
    })
  ),
  budgets: z.array(
    z.object({
      id: z.string(),
      categoryId: z.string(),
      month: z.string(),
      limitAmount: z.number(),
    })
  ),
  transactions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['income', 'expense', 'transfer']),
      amount: z.number(),
      accountId: z.string(),
      toAccountId: z.string().optional().nullable(),
      categoryId: z.string().optional().nullable(),
      date: z.string(),
      notes: z.string().optional(),
      recurringId: z.string().optional().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
  recurring: z.array(z.any()).optional().default([]),
  goals: z.array(z.any()).optional().default([]),
  settings: z.record(z.string(), z.any()).optional().default({}),
});
