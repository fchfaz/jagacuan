import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 md:top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/90 text-white px-3.5 py-1.5 text-xs font-semibold shadow-lg border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Mode Offline — Data tersimpan aman di perangkat</span>
    </div>
  );
};
