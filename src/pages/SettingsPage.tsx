import React, { useState } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { CategoryModal } from '../components/forms/CategoryModal';
import { RecurringModal } from '../components/forms/RecurringModal';
import { exportTransactionsToCsv, downloadFile, createBackupPayload, validateBackupJson } from '../lib/backup';
import { formatRupiah, formatDateIndo } from '../lib/format';
import { db, seedSampleData, safelyDeleteCategory } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Category, RecurringRule } from '../types';
import {
  Settings,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Moon,
  Sun,
  Laptop,
  Repeat,
  Tag,
  AlertTriangle,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

export const SettingsPage: React.FC = () => {
  const {
    accounts,
    categories,
    budgets,
    allTransactions,
  } = useFinanceData();

  const { theme, setTheme, showToast, currentMonth } = useAppStore();

  const recurringRules = useLiveQuery(() => db.recurring.toArray(), []) || [];
  const settingsList = useLiveQuery(() => db.settings.toArray(), []) || [];
  const settingsMap = Object.fromEntries(settingsList.map((s) => [s.key, s.value]));

  const [startDayOfMonth, setStartDayOfMonth] = useState<number>(
    Number(settingsMap.startDayOfMonth) || 1
  );

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Simpan perubahan tanggal gajian (startDayOfMonth)
  const handleSaveStartDay = async (day: number) => {
    setStartDayOfMonth(day);
    await db.settings.put({ key: 'startDayOfMonth', value: day });
    showToast({
      title: 'Hari Awal Bulan Disimpan',
      description: `Siklus anggaran bulanan kini dihitung mulai tanggal ${day}.`,
      type: 'success',
    });
  };

  // Ekspor Transaksi ke CSV
  const handleExportCsv = () => {
    try {
      const csv = exportTransactionsToCsv(allTransactions, accounts, categories);
      downloadFile(
        csv,
        `jaga-cuan-transaksi-${format(new Date(), 'yyyy-MM-dd')}.csv`,
        'text/csv;charset=utf-8;'
      );
      showToast({
        title: 'Ekspor CSV Berhasil',
        description: `${allTransactions.length} transaksi diekspor.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Gagal mengekspor CSV',
        type: 'error',
      });
    }
  };

  // Cadangkan Data ke JSON
  const handleBackupJson = async () => {
    try {
      const goals = await db.goals.toArray();
      const backupData = createBackupPayload({
        accounts,
        categories,
        budgets,
        transactions: allTransactions,
        recurring: recurringRules,
        goals,
        settings: settingsMap,
      });

      const jsonStr = JSON.stringify(backupData, null, 2);
      downloadFile(
        jsonStr,
        `jaga-cuan-backup-${format(new Date(), 'yyyy-MM-dd')}.json`,
        'application/json'
      );

      showToast({
        title: 'Cadangan JSON Disimpan',
        description: 'File cadangan lengkap siap diamankan.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Gagal membuat cadangan JSON',
        type: 'error',
      });
    }
  };

  // Pulihkan Data dari JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupJson(content);

      if (!validation.success || !validation.data) {
        showToast({
          title: 'File Cadangan Tidak Valid',
          description: validation.error || 'Format JSON tidak cocok.',
          type: 'error',
          duration: 5000,
        });
        return;
      }

      try {
        const payload = validation.data;

        // Bersihkan dan masukkan ulang tabel
        await db.transaction('rw', [db.accounts, db.categories, db.budgets, db.transactions, db.recurring, db.goals], async () => {
          await db.accounts.clear();
          await db.categories.clear();
          await db.budgets.clear();
          await db.transactions.clear();
          await db.recurring.clear();
          await db.goals.clear();

          if (payload.accounts.length) await db.accounts.bulkAdd(payload.accounts);
          if (payload.categories.length) await db.categories.bulkAdd(payload.categories);
          if (payload.budgets.length) await db.budgets.bulkAdd(payload.budgets);
          if (payload.transactions.length) await db.transactions.bulkAdd(payload.transactions);
          if (payload.recurring && payload.recurring.length) await db.recurring.bulkAdd(payload.recurring);
          if (payload.goals && payload.goals.length) await db.goals.bulkAdd(payload.goals);
        });

        showToast({
          title: 'Data Berhasil Dipulihkan!',
          description: `${payload.transactions.length} transaksi dan ${payload.accounts.length} dompet telah dimuat.`,
          type: 'success',
        });
      } catch (err) {
        console.error(err);
        showToast({
          title: 'Gagal memulihkan database',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Muat Data Contoh
  const handleSeed = async () => {
    try {
      await seedSampleData();
      showToast({
        title: 'Data Contoh Dimuat',
        description: 'Dompet, transaksi, dan anggaran contoh siap dilihat.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Hapus Seluruh Data (Reset)
  const handleResetAllData = async () => {
    try {
      await db.transactions.clear();
      await db.budgets.clear();
      await db.recurring.clear();
      await db.goals.clear();
      for (const acc of accounts) {
        await db.accounts.update(acc.id, { initialBalance: 0 });
      }

      setIsResetConfirmOpen(false);
      showToast({
        title: 'Data Berhasil Direset',
        description: 'Semua transaksi, anggaran, dan target telah dibersihkan.',
        type: 'default',
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Hapus Kategori dengan safe delete
  const handleDeleteCategory = async (cat: Category) => {
    const res = await safelyDeleteCategory(cat.id, 'move_to_other');
    showToast({
      title: res.success ? 'Kategori Dihapus' : 'Gagal Menghapus',
      description: res.message,
      type: res.success ? 'success' : 'warning',
    });
  };

  // Toggle Transaksi Berulang Aktif / Nonaktif
  const handleToggleRecurring = async (rule: RecurringRule) => {
    await db.recurring.update(rule.id, { active: !rule.active });
    showToast({
      title: !rule.active ? 'Jadwal Rutin Diaktifkan' : 'Jadwal Rutin Dijeda',
      type: 'default',
    });
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-150">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Pengaturan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola preferensi tanggal gajian, tema, cadangan data, dan transaksi berulang
        </p>
      </div>

      {/* 2. Preferensi Waktu & Tampilan */}
      <Card>
        <CardHeader>
          <CardTitle>Preferensi Sistem & Siklus Anggaran</CardTitle>
          <CardDescription>Sesuaikan tampilan dan cut-off hari gajian</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Hari Awal Bulan (Tanggal Gajian) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Hari Awal Bulan / Tanggal Gajian
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                Default tanggal 1. Jika diisi 25, anggaran dihitung dari tanggal 25 s/d 24 bulan berikutnya.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={startDayOfMonth}
                onChange={(e) => handleSaveStartDay(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none"
              >
                {[1, 20, 25, 27, 28].map((day) => (
                  <option key={day} value={day}>
                    Tanggal {day} {day === 1 ? '(Normal)' : '(Gajian)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tema Tampilan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Tema Tampilan
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                Pilih antara mode terang, gelap, atau mengikuti tema sistem
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Terang</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Gelap</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  theme === 'system'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Sistem</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Transaksi Berulang (Recurring / Langganan & Gaji) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-500" />
              <CardTitle>Transaksi Berulang (Rutin)</CardTitle>
            </div>
            <CardDescription>
              Gaji bulanan atau langganan otomatis dicatat saat tanggal tiba
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingRule(null);
              setIsRecurringModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Jadwal</span>
          </Button>
        </CardHeader>
        <CardContent>
          {recurringRules.length > 0 ? (
            <div className="space-y-2">
              {recurringRules.map((rule) => {
                const acc = accounts.find((a) => a.id === rule.templateTransaction.accountId);
                const cat = categories.find((c) => c.id === rule.templateTransaction.categoryId);

                return (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${
                          rule.templateTransaction.type === 'income'
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                      >
                        <Repeat className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {rule.templateTransaction.notes || cat?.name || 'Rutin'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                            {rule.frequency === 'monthly' ? 'Bulanan' : 'Mingguan'}
                          </span>
                        </div>
                        <span className="text-slate-400 block text-[11px] mt-0.5">
                          Jadwal berikut: <strong>{rule.nextDate}</strong> • {acc?.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-bold tabular-nums ${
                          rule.templateTransaction.type === 'income'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {formatRupiah(rule.templateTransaction.amount)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleRecurring(rule)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          rule.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {rule.active ? 'Aktif' : 'Jeda'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await db.recurring.delete(rule.id);
                          showToast({ title: 'Jadwal Rutin Dihapus' });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">
              Belum ada transaksi berulang. Buat jadwal untuk gaji atau langganan rutinmu.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 4. Kelola Kategori Kustom */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              <CardTitle>Kelola Kategori Kustom</CardTitle>
            </div>
            <CardDescription>
              Tambah atau sesuaikan ikon & warna kategori pengeluaran dan pemasukan
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kategori</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CategoryIcon name={cat.icon} color={cat.color} size="xs" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {cat.name}
                  </span>
                </div>

                {!cat.isDefault && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5. Ekspor, Impor, & Cadangan Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" />
            <CardTitle>Ekspor, Impor, & Cadangan (Backup)</CardTitle>
          </div>
          <CardDescription>
            Pindahkan atau amankan data keuanganmu kapan saja tanpa perantara pihak ketiga
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Ekspor CSV */}
            <Button
              variant="outline"
              size="md"
              onClick={handleExportCsv}
              className="gap-2 justify-start h-auto p-4 flex-col items-start text-left"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-white">
                  Ekspor CSV Transaksi
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Buka di Excel atau Google Sheets
                </span>
              </div>
            </Button>

            {/* Cadangkan JSON */}
            <Button
              variant="outline"
              size="md"
              onClick={handleBackupJson}
              className="gap-2 justify-start h-auto p-4 flex-col items-start text-left"
            >
              <Download className="w-5 h-5 text-indigo-600" />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-white">
                  Cadangkan Lengkap (JSON)
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Semua transaksi, dompet & anggaran
                </span>
              </div>
            </Button>

            {/* Pulihkan JSON */}
            <label className="flex flex-col items-start justify-start p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors">
              <Upload className="w-5 h-5 text-amber-500 mb-2" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Pulihkan Cadangan (JSON)
              </span>
              <span className="text-[11px] text-slate-400">
                Pilih file backup .json dari perangkat
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 6. Zona Data Contoh & Reset */}
      <Card className="border-rose-100 dark:border-rose-950/40">
        <CardHeader>
          <CardTitle className="text-rose-600 dark:text-rose-400">
            Pemeliharaan & Zona Bahaya
          </CardTitle>
          <CardDescription>
            Muat data simulasi atau bersihkan basis data lokal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Muat Ulang Data Contoh
              </span>
              <span className="text-[11px] text-slate-500">
                Isi kembali database dengan transaksi dan dompet simulasi jika ingin melihat grafik.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSeed}
              className="gap-1.5 shrink-0 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Muat Data Contoh</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
            <div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">
                Reset Seluruh Data Transaksi
              </span>
              <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                Menghapus semua riwayat transaksi, anggaran, dan target tabungan. Tindakan ini tidak dapat dibatalkan.
              </span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              className="shrink-0 text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        editingCategory={editingCategory}
        onSaved={() => {}}
      />

      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        accounts={accounts}
        categories={categories}
        editingRule={editingRule}
        onSaved={() => {}}
      />

      {/* Dialog Konfirmasi Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#111A2E] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Reset Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apakah kamu yakin ingin mengosongkan semua transaksi dan anggaran? Pastikan kamu telah membuat cadangan file JSON jika diperlukan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleResetAllData}
                className="flex-1"
              >
                Ya, Bersihkan Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
