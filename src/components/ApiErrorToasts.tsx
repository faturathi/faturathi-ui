import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ApiError, formatApiErrors, setApiErrorListener } from '../lib/api';

interface ToastEntry {
  id: number;
  message: string;
  status: number;
}

/**
 * Mounted once near the app root. Subscribes to apiFetch's error listener (lib/api.ts) so any
 * failed API call — anywhere in the app — surfaces a visible, human-readable toast instead of
 * silently disappearing into console.warn (item 19: never fail silently / never white-screen).
 * 401s are skipped: those are expected during normal session-expiry redirects, not failures
 * worth interrupting the user for.
 */
export const ApiErrorToasts: React.FC = () => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    setApiErrorListener((error: ApiError) => {
      if (error.status === 401) return;
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message: formatApiErrors(error).join(' '), status: error.status }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 8000);
    });
    return () => setApiErrorListener(null);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-2 bg-white border border-red-200 shadow-lg rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2"
        >
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900">Request failed</p>
            <p className="text-xs text-slate-600 break-words">{toast.message}</p>
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
