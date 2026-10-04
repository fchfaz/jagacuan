/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useAppStore } from './store/useAppStore';
import { initDatabaseDefaults, seedSampleData, db } from './db/db';
import { processRecurringRules } from './lib/recurring';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ReportsPage } from './pages/ReportsPage';
import { WalletsPage } from './pages/WalletsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Sheet } from './components/ui/Sheet';
import { TransactionForm } from './components/forms/TransactionForm';
import { OnboardingModal } from './components/onboarding/OnboardingModal';

export default function App() {
  const {
    activeTab,
    isTransactionModalOpen,
    editingTransactionId,
    closeTransactionModal,
    showToast,
  } = useAppStore();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        await initDatabaseDefaults();

        // 1. Cek status onboarding
        const onboardingSetting = await db.settings.get('onboardingCompleted');
        const txCount = await db.transactions.count();

        // Jika belum pernah onboarding dan belum ada transaksi sama sekali, buka onboarding
        if (!onboardingSetting?.value && txCount === 0) {
          setIsOnboardingOpen(true);
        } else if (txCount === 0) {
          // Jika db kosong, siapkan seed data
          await seedSampleData();
        }

        // 2. Jalankan Generator Transaksi Berulang yang Idempoten
        const recurringRules = await db.recurring.where('active').equals(1).toArray();
        if (recurringRules.length > 0) {
          const { newTransactions, updatedRules } = processRecurringRules(recurringRules, new Date());

          if (newTransactions.length > 0) {
            await db.transactions.bulkAdd(newTransactions);
            for (const r of updatedRules) {
              await db.recurring.update(r.id, { nextDate: r.nextDate });
            }

            showToast({
              title: 'Transaksi Rutin Terjadwal',
              description: `${newTransactions.length} transaksi berulang berhasil dicatat otomatis.`,
              type: 'success',
            });
          }
        }
      } catch (err) {
        console.error('Inisialisasi aplikasi gagal:', err);
      }
    }

    initializeApp();
  }, [showToast]);

  return (
    <AppLayout>
      {/* Tab View Routing */}
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'transactions' && <TransactionsPage />}
      {activeTab === 'budgets' && <BudgetsPage />}
      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'wallets' && <WalletsPage />}
      {activeTab === 'settings' && <SettingsPage />}

      {/* Form Tambah & Ubah Transaksi (Bottom Sheet di HP, Modal di Desktop) */}
      <Sheet
        isOpen={isTransactionModalOpen}
        onClose={closeTransactionModal}
        title={editingTransactionId ? 'Ubah Transaksi' : 'Catat Transaksi Cepat'}
        description={
          editingTransactionId
            ? 'Perbarui detail transaksi yang dipilih'
            : 'Ketik nominal, pilih kategori, dan simpan dalam sekejap'
        }
        maxWidth="md"
      >
        <TransactionForm />
      </Sheet>

      {/* Onboarding Singkat 3 Layar untuk Pengguna Pertama */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />
    </AppLayout>
  );
}
