import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-0 left-0 md:left-auto md:right-6 z-50 flex flex-col items-center md:items-end gap-2 px-4 pointer-events-none"
    >
      {toasts.map((toast) => {
        const icons = {
          default: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
        };

        const icon = icons[toast.type || 'default'];

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between w-full max-w-sm gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl transition-all animate-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              {icon}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {toast.title}
                </span>
                {toast.description && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {toast.description}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismissToast(toast.id);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900 transition-colors"
                >
                  {toast.action.label}
                </button>
              )}

              <button
                type="button"
                aria-label="Tutup notifikasi"
                onClick={() => dismissToast(toast.id)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
