import React from 'react';
import { useAppStore, type AppTab } from '../../store/useAppStore';
import { Logo } from '../ui/Logo';
import { MonthPicker } from './MonthPicker';
import { ThemeToggle } from './ThemeToggle';
import { ToastContainer } from '../ui/Toast';
import { PWAInstallButton } from '../ui/PWAInstallButton';
import { OfflineIndicator } from '../ui/OfflineIndicator';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  BarChart3,
  Wallet,
  Settings,
  Plus,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { activeTab, setActiveTab, openAddTransaction } = useAppStore();

  const navItems = [
    { id: 'dashboard' as AppTab, label: 'Beranda', icon: LayoutDashboard },
    { id: 'transactions' as AppTab, label: 'Transaksi', icon: ReceiptText },
    { id: 'budgets' as AppTab, label: 'Anggaran', icon: PieChart },
    { id: 'reports' as AppTab, label: 'Laporan', icon: BarChart3 },
  ];

  const secondaryNavItems = [
    { id: 'wallets' as AppTab, label: 'Dompet & Akun', icon: Wallet },
    { id: 'settings' as AppTab, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-[#0B1220] text-slate-800 dark:text-slate-100 antialiased">
      {/* SIDEBAR FOR DESKTOP / TABLET (>= 768px) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-[#111A2E] border-r border-slate-200/80 dark:border-slate-800/80 p-5 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="pb-6 pt-1">
          <Logo size="md" showTagline={true} />
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={openAddTransaction}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span>Catat Transaksi</span>
          </button>
        </div>

        {/* Month Selector Widget */}
        <div className="mb-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-2">
            Periode Aktif
          </div>
          <MonthPicker compact={true} />
        </div>

        {/* Primary Navigation */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-1">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mt-5 mb-1">
            Lainnya
          </div>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* In-App PWA Install Widget in Sidebar */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <PWAInstallButton variant="sidebar" />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <ThemeToggle />
        </div>
      </aside>

      {/* MOBILE TOP BAR (< 768px) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#111A2E]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <Logo size="sm" />
        <div className="flex items-center gap-1.5">
          <PWAInstallButton />
          <MonthPicker compact={true} />
          <button
            type="button"
            aria-label="Pengaturan"
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              activeTab === 'settings' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : ''
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 pb-28 md:pb-12 pt-4 md:pt-8 px-4 sm:px-6 lg:px-10 max-w-[1120px] mx-auto w-full">
        {children}
      </main>

      {/* MOBILE FLOATING ACTION BUTTON (+) */}
      <div className="md:hidden fixed bottom-20 right-5 z-40">
        <button
          type="button"
          aria-label="Tambah Transaksi Baru"
          onClick={openAddTransaction}
          className="w-14 h-14 rounded-full bg-indigo-600 active:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px) */}
      <nav
        aria-label="Navigasi Bawah"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#111A2E]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 pb-safe"
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors select-none ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Offline Connectivity Notification */}
      <OfflineIndicator />

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};
