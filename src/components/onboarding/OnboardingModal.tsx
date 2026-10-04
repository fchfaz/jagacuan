import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Logo } from '../ui/Logo';
import { formatRupiah, parseRupiah } from '../../lib/format';
import { calculate503020Rule } from '../../lib/calculations';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import {
  Wallet,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { showToast, currentMonth } = useAppStore();
  const [step, setStep] = useState(1);

  // State Step 2 (Dompet Pertama)
  const [walletName, setWalletName] = useState('Dompet Utama');
  const [walletType, setWalletType] = useState<'cash' | 'bank' | 'ewallet'>('bank');
  const [initialBalance, setInitialBalance] = useState('1.500.000');

  // State Step 3 (Template Anggaran)
  const [monthlyIncomeEst, setMonthlyIncomeEst] = useState('5.000.000');
  const [useTemplate, setUseTemplate] = useState(true);

  if (!isOpen) return null;

  const handleFinish = async () => {
    try {
      // 1. Simpan/update dompet pertama
      const balanceNum = parseRupiah(initialBalance);
      await db.accounts.put({
        id: 'acc-primary',
        name: walletName.trim() || 'Dompet Utama',
        type: walletType,
        initialBalance: balanceNum,
        icon: walletType === 'bank' ? 'Building2' : walletType === 'cash' ? 'Banknote' : 'Smartphone',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
      });

      // 2. Terapkan template 50/30/20 jika dipilih
      if (useTemplate) {
        const estIncome = parseRupiah(monthlyIncomeEst);
        if (estIncome > 0) {
          const breakdown = calculate503020Rule(estIncome);
          const defaultCats = await db.categories.toArray();

          const newBudgets = [
            { id: `bgt-cat-food-${currentMonth}`, categoryId: 'cat-food', month: currentMonth, limitAmount: Math.round(breakdown.needs * 0.5) },
            { id: `bgt-cat-bills-${currentMonth}`, categoryId: 'cat-bills', month: currentMonth, limitAmount: Math.round(breakdown.needs * 0.3) },
            { id: `bgt-cat-transport-${currentMonth}`, categoryId: 'cat-transport', month: currentMonth, limitAmount: Math.round(breakdown.needs * 0.2) },
            { id: `bgt-cat-shopping-${currentMonth}`, categoryId: 'cat-shopping', month: currentMonth, limitAmount: Math.round(breakdown.wants * 0.6) },
            { id: `bgt-cat-entertainment-${currentMonth}`, categoryId: 'cat-entertainment', month: currentMonth, limitAmount: Math.round(breakdown.wants * 0.4) },
            { id: `bgt-cat-emergency-${currentMonth}`, categoryId: 'cat-emergency', month: currentMonth, limitAmount: breakdown.savings },
          ];

          for (const b of newBudgets) {
            if (defaultCats.some((c) => c.id === b.categoryId)) {
              await db.budgets.put(b);
            }
          }
        }
      }

      // 3. Tandai onboarding selesai di settings
      await db.settings.put({ key: 'onboardingCompleted', value: true });

      showToast({
        title: 'Selamat Datang di Jaga Cuan!',
        description: 'Aplikasi siap digunakan. Catat cuan pertamamu!',
        type: 'success',
      });

      onComplete();
    } catch (err) {
      console.error(err);
      onComplete();
    }
  };

  const handleSkip = async () => {
    await db.settings.put({ key: 'onboardingCompleted', value: true });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#111A2E] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col space-y-6">
        {/* Progress Dots */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-indigo-600 dark:bg-indigo-500'
                    : s < step
                    ? 'w-3 bg-emerald-500'
                    : 'w-3 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            Lewati
          </button>
        </div>

        {/* STEP 1: Selamat Datang */}
        {step === 1 && (
          <div className="space-y-4 text-center py-2 animate-in fade-in">
            <div className="flex justify-center mb-2">
              <Logo size="lg" showTagline={false} />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Catat. Atur. Jaga Cuanmu.
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              Aplikasi keuangan pribadi yang simpel, super cepat, dan 100% offline. Tanpa akun, tanpa cloud, privasi data aman di perangkatmu.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-4">
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 text-center">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">
                  &lt; 5 Detik
                </span>
                <span className="text-[10px] text-slate-500">Catat transaksi</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 text-center">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                  Envelope
                </span>
                <span className="text-[10px] text-slate-500">Batas anggaran</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 text-center">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">
                  Offline
                </span>
                <span className="text-[10px] text-slate-500">100% Aman</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(2)}
                className="w-full gap-2"
              >
                <span>Mulai Atur Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Dompet Pertama */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Siapkan Dompet Pertamamu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bisa rekening bank utama, dompet tunai, atau e-wallet harian.
              </p>
            </div>

            <Input
              label="Nama Dompet"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              placeholder="Misal: BCA, Tunai, Mandiri"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tipe Dompet
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bank', label: 'Rekening Bank' },
                  { id: 'cash', label: 'Uang Tunai' },
                  { id: 'ewallet', label: 'E-Wallet' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setWalletType(t.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      walletType === t.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Saldo Awal Saat Ini"
              value={initialBalance}
              onChange={(e) => {
                const n = parseRupiah(e.target.value);
                setInitialBalance(n > 0 ? formatRupiah(n, false) : '');
              }}
              leftIcon={<span className="text-xs font-bold">Rp</span>}
              helperText="Tenang, kamu bisa menambahkan dompet lain nanti."
            />

            <div className="pt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(3)}
                className="flex-1 gap-1.5"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Template Anggaran */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Gunakan Template Anggaran?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aturan 50/30/20 membagi gaji menjadi Kebutuhan (50%), Keinginan (30%), dan Tabungan (20%).
              </p>
            </div>

            {/* Toggle opsi template */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUseTemplate(true)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  useTemplate
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Template 50/30/20</span>
                  {useTemplate && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Alokasi otomatis batas makan, belanja, bills, dll.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUseTemplate(false)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  !useTemplate
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Mulai Bersih</span>
                  {!useTemplate && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Atur sendiri limit anggaran secara manual nanti.
                </span>
              </button>
            </div>

            {useTemplate && (
              <Input
                label="Perkiraan Gaji / Pemasukan Bulanan"
                value={monthlyIncomeEst}
                onChange={(e) => {
                  const n = parseRupiah(e.target.value);
                  setMonthlyIncomeEst(n > 0 ? formatRupiah(n, false) : '');
                }}
                leftIcon={<span className="text-xs font-bold">Rp</span>}
                helperText="Dipakai sebagai basis pembagian nominal amplop anggaran."
              />
            )}

            <div className="pt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleFinish}
                className="flex-1 gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mulai Catat Cuan</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
