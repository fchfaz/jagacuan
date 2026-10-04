import React, { useState } from 'react';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatRupiah } from '../../lib/format';
import type { Account, Category, Transaction } from '../../types';
import {
  ArrowRightLeft,
  Pencil,
  Trash2,
  Wallet,
} from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  accounts,
  categories,
  onEdit,
  onDelete,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const account = accounts.find((a) => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId
    ? accounts.find((a) => a.id === transaction.toAccountId)
    : null;
  const category = transaction.categoryId
    ? categories.find((c) => c.id === transaction.categoryId)
    : null;

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  // Penentuan teks judul
  const title = isTransfer
    ? `Transfer ke ${toAccount?.name || 'Dompet'}`
    : category?.name || (isIncome ? 'Pemasukan' : 'Pengeluaran');

  return (
    <div className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-100 dark:border-slate-800/80 shadow-xs hover:border-slate-200 dark:hover:border-slate-700/80 transition-all duration-150">
      {/* Icon + Information */}
      <div className="flex items-center gap-3 min-w-0">
        {isTransfer ? (
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-5 h-5" strokeWidth={2.2} />
          </div>
        ) : (
          <CategoryIcon
            name={category?.icon}
            color={category?.color || (isIncome ? '#10b981' : '#f43f5e')}
            size="md"
          />
        )}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </span>
            {transaction.recurringId && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shrink-0">
                Rutin
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="flex items-center gap-1 shrink-0">
              <Wallet className="w-3 h-3 text-slate-400" />
              <span>{account?.name || 'Dompet'}</span>
            </span>

            {transaction.notes && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="truncate italic text-slate-500 dark:text-slate-400 max-w-[140px] sm:max-w-xs">
                  {transaction.notes}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount + Action Buttons */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="text-right">
          <div
            className={`text-sm sm:text-base font-bold tabular-nums ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : isExpense
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {isIncome ? '+' : isExpense ? '-' : ''} {formatRupiah(transaction.amount)}
          </div>
        </div>

        {/* Hover / Quick Actions */}
        <div className="flex items-center gap-1">
          {showConfirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/80 p-1 rounded-xl border border-rose-200 dark:border-rose-900 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  onDelete(transaction.id);
                  setShowConfirmDelete(false);
                }}
                className="px-2 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-1.5 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                aria-label="Edit transaksi"
                onClick={() => onEdit(transaction.id)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Hapus transaksi"
                onClick={() => setShowConfirmDelete(true)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
