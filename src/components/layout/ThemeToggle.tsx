import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Moon, Sun, Laptop } from 'lucide-react';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    // Terapkan tema saat awal muat
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 text-indigo-400" />;
    if (theme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    return <Laptop className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
  };

  const getLabel = () => {
    if (theme === 'dark') return 'Mode Gelap';
    if (theme === 'light') return 'Mode Terang';
    return 'Sistem';
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Tema: ${getLabel()} (Klik untuk ubah)`}
      aria-label="Ubah tema tampilan"
      className={`flex items-center gap-2 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
        compact ? 'min-h-[44px] min-w-[44px] justify-center' : 'w-full px-3'
      }`}
    >
      {getIcon()}
      {!compact && <span className="text-xs font-medium">{getLabel()}</span>}
    </button>
  );
};
