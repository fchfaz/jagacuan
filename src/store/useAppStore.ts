import { create } from 'zustand';
import { format, subMonths, addMonths } from 'date-fns';

export type AppTab = 'dashboard' | 'transactions' | 'budgets' | 'reports' | 'wallets' | 'settings';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface AppState {
  activeTab: AppTab;
  currentMonth: string; // 'YYYY-MM'
  theme: 'light' | 'dark' | 'system';
  isTransactionModalOpen: boolean;
  editingTransactionId: string | null;
  lastUsedAccountId: string | null;
  toasts: ToastMessage[];

  // Actions
  setActiveTab: (tab: AppTab) => void;
  setCurrentMonth: (month: string) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openAddTransaction: () => void;
  openEditTransaction: (id: string) => void;
  closeTransactionModal: () => void;
  setLastUsedAccountId: (id: string) => void;
  showToast: (toast: Omit<ToastMessage, 'id'>) => string;
  dismissToast: (id: string) => void;
}

const getCurrentYearMonth = () => format(new Date(), 'yyyy-MM');

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'dashboard',
  currentMonth: getCurrentYearMonth(),
  theme: (localStorage.getItem('jaga-cuan-theme') as 'light' | 'dark' | 'system') || 'system',
  isTransactionModalOpen: false,
  editingTransactionId: null,
  lastUsedAccountId: localStorage.getItem('jaga-cuan-last-account') || null,
  toasts: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

  setCurrentMonth: (month) => set({ currentMonth: month }),

  goToPrevMonth: () => {
    const [year, month] = get().currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const prev = subMonths(date, 1);
    set({ currentMonth: format(prev, 'yyyy-MM') });
  },

  goToNextMonth: () => {
    const [year, month] = get().currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const next = addMonths(date, 1);
    set({ currentMonth: format(next, 'yyyy-MM') });
  },

  goToCurrentMonth: () => {
    set({ currentMonth: getCurrentYearMonth() });
  },

  setTheme: (theme) => {
    localStorage.setItem('jaga-cuan-theme', theme);
    set({ theme });

    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },

  openAddTransaction: () =>
    set({ isTransactionModalOpen: true, editingTransactionId: null }),

  openEditTransaction: (id) =>
    set({ isTransactionModalOpen: true, editingTransactionId: id }),

  closeTransactionModal: () =>
    set({ isTransactionModalOpen: false, editingTransactionId: null }),

  setLastUsedAccountId: (id) => {
    localStorage.setItem('jaga-cuan-last-account', id);
    set({ lastUsedAccountId: id });
  },

  showToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastMessage = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, duration);
    }

    return id;
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
