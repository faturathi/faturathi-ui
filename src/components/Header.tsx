import React, { useState } from 'react';
import { AlertTriangle, Bell, Clock, FileText, HelpCircle, LogOut, Phone, RefreshCw, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { AuthUser } from './LoginPage';
import { FaturathiLogo } from './Logos';
import { CompanyGroup, Entity } from '../types';

interface HeaderProps {
  selectedEntity: string;
  onSelectEntity: (entityId: string) => void;
  showDocs: boolean;
  onToggleDocs: () => void;
  onResetDb: () => void;
  isResetting: boolean;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenCertModal?: () => void;
  certVerified?: boolean;
  entities: Entity[];
  companyGroups: CompanyGroup[];
  selectedGroup: string;
  onSelectGroup: (groupId: string) => void;
  onOpenAbout?: () => void;
}

const notifications = [
  { icon: AlertTriangle, tone: 'border-red-100 bg-red-50 text-red-900', iconTone: 'text-red-600', title: 'Rejected invoice awaiting correction', detail: 'Review the OTA validation response and correct the highlighted fields.' },
  { icon: Clock, tone: 'border-amber-100 bg-amber-50 text-amber-900', iconTone: 'text-amber-600', title: 'B2C batches approaching SLA', detail: 'Three batches are approaching the configured submission window.' },
  { icon: FileText, tone: 'border-blue-100 bg-blue-50 text-blue-900', iconTone: 'text-blue-600', title: 'Credit note pending approval', detail: 'A draft credit note requires manager sign-off.' },
  { icon: ShieldCheck, tone: 'border-emerald-100 bg-emerald-50 text-emerald-900', iconTone: 'text-emerald-600', title: 'PINT-OM profile active', detail: 'The current validation and UUID profile is active.' },
];

export const Header: React.FC<HeaderProps> = ({
  selectedEntity, onSelectEntity, showDocs, onToggleDocs, onResetDb, isResetting,
  currentUser, onLogout, onOpenCertModal, certVerified = false, entities,
  companyGroups, selectedGroup, onSelectGroup, onOpenAbout,
}) => {
  const [showBellPanel, setShowBellPanel] = useState(false);
  const selectedGroupData = companyGroups.find((group) => group.id === selectedGroup) || companyGroups[0];

  return (
    <header className="bg-gradient-to-r from-[#082f54] via-[#0d4f8b] to-[#0b7a63] text-white shadow-md">
      <div className="mx-auto flex w-full max-w-[1900px] flex-wrap items-center gap-2 px-3 py-2 sm:px-4 lg:min-h-14 lg:flex-nowrap lg:px-5">
        <div className="order-1 flex shrink-0 items-center">
          <div className="flex h-10 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/95 shadow-sm">
            <FaturathiLogo className="h-8 w-auto" showSlogan={false} iconOnly />
          </div>
        </div>

        <div className="order-3 flex w-full min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs sm:px-3 lg:order-2 lg:w-[430px] lg:flex-none xl:w-[500px]">
          <div className="hidden w-36 min-w-0 shrink-0 border-r border-white/20 pr-2 sm:block">
            <span className="block text-[9px] font-semibold uppercase tracking-wide text-white/60">VAT Group</span>
            {companyGroups.length > 1 ? (
              <select aria-label="VAT group" value={selectedGroup} onChange={(event) => onSelectGroup(event.target.value)} className="w-full truncate rounded border border-white/25 bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white outline-none focus:border-emerald-300">
                {companyGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            ) : <span className="block truncate text-[11px] font-bold">{selectedGroupData?.name || 'No group'}</span>}
            <span className="block truncate text-[9px] text-emerald-300">{selectedGroupData?.group_vatin || '—'}</span>
          </div>
          <label className="min-w-0 flex-1">
            <span className="block text-[9px] font-semibold uppercase tracking-wide text-white/60">Supplier company</span>
            <select value={selectedEntity} onChange={(event) => onSelectEntity(event.target.value)} className="w-full cursor-pointer truncate rounded-md border border-white/30 bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-white outline-none transition-colors hover:border-white focus:border-emerald-300">
              <option value="group">Whole group — {entities.length} supplier {entities.length === 1 ? 'company' : 'companies'}</option>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name} · {entity.vatin}</option>)}
            </select>
          </label>
        </div>

        <div className="order-2 ml-auto flex min-w-0 items-center justify-end gap-1.5 lg:order-3 lg:flex-1">
          {onOpenCertModal && (
            <button onClick={onOpenCertModal} title="Check Peppol PKI certificate" aria-label="Check Peppol PKI certificate"
              className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 text-[11px] font-bold shadow-sm transition-colors ${certVerified ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300' : 'border-red-500/50 bg-red-950/90 text-red-300'}`}>
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden 2xl:inline">{certVerified ? 'PKI Handshake Active' : 'Certificate Warning'}</span>
            </button>
          )}

          {currentUser && (
            <div className="flex h-9 min-w-0 items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-slate-900/90 px-1.5 shadow-sm">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${currentUser.avatarColor}`}>{currentUser.n.charAt(0)}</div>
              <div className="hidden min-w-0 text-left md:block">
                <span className="block max-w-28 truncate text-[11px] font-bold xl:max-w-36">{currentUser.n}</span>
                <span className="hidden max-w-36 truncate font-mono text-[9px] text-slate-300 xl:block">{currentUser.e}</span>
              </div>
              <span className="hidden h-6 w-px bg-white/20 sm:block" />
              <button onClick={onLogout} title="Log out" aria-label="Log out" className="rounded-md border border-red-400/30 bg-red-500/20 p-1.5 text-red-100 transition-colors hover:bg-red-500/40">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {onOpenAbout && (
            <button onClick={onOpenAbout} title="About us and contact" aria-label="About us and contact" className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white/10 px-2 text-[11px] font-semibold transition-colors hover:bg-white/20">
              <Phone className="h-3.5 w-3.5" /><span className="hidden xl:inline">About / Contact</span>
            </button>
          )}

          <div className="relative">
            <button onClick={() => setShowBellPanel((visible) => !visible)} title="Notifications" aria-label="Notifications" aria-expanded={showBellPanel}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 transition-colors hover:bg-white/20">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-900 shadow">4</span>
            </button>
            {showBellPanel && (
              <div className="fixed left-3 right-3 top-16 z-50 rounded-2xl border border-slate-200 bg-white p-4 text-left text-slate-800 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[#0d4f8b]"><Bell className="h-4 w-4" /> Outstanding Action Items</h4>
                  <button onClick={() => setShowBellPanel(false)} aria-label="Close notifications" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                </div>
                <ul className="space-y-2 text-xs">
                  {notifications.map(({ icon: Icon, tone, iconTone, title, detail }) => (
                    <li key={title} className={`flex items-start gap-2 rounded-xl border p-2.5 ${tone}`}>
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconTone}`} />
                      <div><b className="block font-semibold">{title}</b><span className="text-[11px] opacity-80">{detail}</span></div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button onClick={onToggleDocs} title={showDocs ? 'Hide setup guide' : 'Open setup guide'} aria-label={showDocs ? 'Hide setup guide' : 'Open setup guide'} className={`flex h-9 items-center gap-1 whitespace-nowrap rounded-lg border px-2 text-[11px] font-semibold transition-colors ${showDocs ? 'border-white bg-white/20' : 'border-white/20 bg-white/10 hover:bg-white/20'}`}>
            <HelpCircle className="h-3.5 w-3.5" /><span className="hidden 2xl:inline">{showDocs ? 'Hide Setup' : 'Setup Guide'}</span>
          </button>
          <button onClick={onResetDb} disabled={isResetting} title="Reset demo seed data" aria-label="Reset demo seed data" className="flex h-9 items-center gap-1 whitespace-nowrap rounded-lg border border-white/20 bg-white/10 px-2 text-[11px] font-semibold transition-colors hover:bg-white/20 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} /><span className="hidden 2xl:inline">{isResetting ? 'Resetting...' : 'Reset Seeds'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
