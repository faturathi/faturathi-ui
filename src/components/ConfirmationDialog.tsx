import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Building2, FileCheck2, ShieldAlert, UserPlus, X } from 'lucide-react';

export interface ConfirmationOptions {
  title: string;
  description: string;
  detail?: string;
  confirmLabel: string;
  kind?: 'create' | 'submit' | 'danger';
}

export function useConfirmation(): [(options: ConfirmationOptions) => Promise<boolean>, React.ReactNode] {
  const [request, setRequest] = useState<(ConfirmationOptions & { resolve: (answer: boolean) => void }) | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  const confirm = (options: ConfirmationOptions) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve }));
  const close = (answer: boolean) => {
    if (!request) return;
    request.resolve(answer);
    setRequest(null);
  };

  useEffect(() => {
    if (!request) return;
    const listener = (event: KeyboardEvent) => { if (event.key === 'Escape') close(false); };
    document.addEventListener('keydown', listener);
    cancelButton.current?.focus();
    return () => document.removeEventListener('keydown', listener);
  }, [request]);

  const dialog = request && createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) close(false); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="critical-confirm-title" className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl animate-fadeIn">
        <div className={`flex items-start justify-between gap-4 p-5 text-white ${request.kind === 'danger' ? 'bg-gradient-to-r from-amber-700 to-red-700' : 'bg-gradient-to-r from-[#0d4f8b] to-[#0b7a63]'}`}>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/25 bg-white/15 p-2.5">{request.kind === 'danger' ? <ShieldAlert className="h-6 w-6" /> : request.kind === 'submit' ? <FileCheck2 className="h-6 w-6" /> : request.title.toLowerCase().includes('user') ? <UserPlus className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}</div>
            <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">{request.kind === 'danger' ? 'Critical action confirmation' : request.kind === 'submit' ? 'Document submission confirmation' : 'Setup confirmation'}</span><h2 id="critical-confirm-title" className="mt-1 text-lg font-black">{request.title}</h2></div>
          </div>
          <button type="button" onClick={() => close(false)} aria-label="Close confirmation" className="rounded-xl p-2 text-white/80 hover:bg-white/15 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm leading-6 text-slate-700">{request.description}</p>
          {request.detail && <div className={`flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs leading-5 ${request.kind === 'danger' ? 'border-red-200 bg-red-50 text-red-900' : request.kind === 'submit' ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-blue-200 bg-blue-50 text-blue-950'}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{request.detail}</span></div>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button ref={cancelButton} type="button" onClick={() => close(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-blue-400">Cancel — go back</button>
            <button type="button" onClick={() => close(true)} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md ${request.kind === 'danger' ? 'bg-red-700 hover:bg-red-800' : request.kind === 'submit' ? 'bg-gradient-to-r from-emerald-600 to-[#0d4f8b] hover:from-emerald-700 hover:to-[#0b3d6b]' : 'bg-[#0d4f8b] hover:bg-blue-900'}`}><FileCheck2 className="h-4 w-4" />{request.confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>, document.body);

  return [confirm, dialog];
}
