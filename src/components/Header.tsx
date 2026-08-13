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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#082f54] via-[#0d4f8b] to-[#0b7a63] text-white shadow-md">
      <div className="mx-auto grid w-full max-w-[1900px] grid-cols-1 gap-2 px-3 py-1.5 sm:px-5 xl:grid-cols-[96px_minmax(0,1fr)] xl:items-center xl:gap-3 xl:px-6">
        <div className="flex items-center justify-center xl:justify-start">
          <div className="rounded-xl border border-white/20 bg-white/95 px-2 py-0.5 shadow-sm">
            <FaturathiLogo className="h-9 w-auto sm:h-10" showSlogan={false} />
          </div>
        </div>

        <div className="min-w-0 space-y-1.5 text-xs 2xl:flex 2xl:flex-row-reverse 2xl:items-center 2xl:justify-end 2xl:gap-2 2xl:space-y-0">
          {/* Primary utilities remain on one row at desktop widths. */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 xl:justify-end 2xl:flex-nowrap">
            {onOpenCertModal && (
              <button onClick={onOpenCertModal} title="Check Peppol PKI certificate"
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-bold shadow-sm transition-colors ${certVerified ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300' : 'border-red-500/50 bg-red-950/90 text-red-300'}`}>
                <ShieldAlert className="h-4 w-4" />
                <span className="hidden sm:inline">{certVerified ? 'PKI Handshake Active' : 'Certificate Warning'}</span>
              </button>
            )}

            {currentUser && (
              <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-slate-900/90 px-2 py-1 shadow-sm">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${currentUser.avatarColor}`}>{currentUser.n.charAt(0)}</div>
                <div className="hidden min-w-0 text-left sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="max-w-32 truncate text-[11px] font-bold xl:max-w-40">{currentUser.n}</span>
                    <span className="hidden rounded border border-emerald-400/30 bg-emerald-500/20 px-1.5 text-[9px] font-bold text-emerald-300 2xl:inline">{currentUser.roleBadge}</span>
                  </div>
                  <span className="hidden max-w-40 truncate font-mono text-[9px] text-slate-300 lg:block">{currentUser.e}</span>
                </div>
                <span className="h-6 w-px bg-white/20" />
                <button onClick={onLogout} title="Log out" className="flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/20 p-1.5 text-red-100 transition-colors hover:bg-red-500/40">
                  <LogOut className="h-3.5 w-3.5" /><span className="hidden 2xl:inline">Logout</span>
                </button>
              </div>
            )}

            {onOpenAbout && (
              <button onClick={onOpenAbout} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-white/20">
                <Phone className="h-3.5 w-3.5" /><span className="hidden sm:inline">About us / Contact us</span>
              </button>
            )}

            <div className="relative">
              <button onClick={() => setShowBellPanel((visible) => !visible)} title="Notifications" aria-expanded={showBellPanel}
                className="relative rounded-lg border border-white/20 bg-white/10 p-2 transition-colors hover:bg-white/20">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-900 shadow">4</span>
              </button>
              {showBellPanel && (
                <div className="fixed left-3 right-3 top-20 z-50 rounded-2xl border border-slate-200 bg-white p-4 text-left text-slate-800 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
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
          </div>

          {/* Tenant context and secondary utilities share a compact responsive row. */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 xl:justify-end 2xl:flex-nowrap">
            <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 sm:flex xl:max-w-[620px] 2xl:w-[430px] 2xl:flex-none">
              <div className="min-w-0 shrink-0">
                <span className="block text-[8px] font-semibold uppercase tracking-wide text-white/60">VAT Group</span>
                {companyGroups.length > 1 ? (
                  <select value={selectedGroup} onChange={(event) => onSelectGroup(event.target.value)} className="max-w-32 rounded border border-white/30 bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white outline-none">
                    {companyGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </select>
                ) : <span className="block max-w-32 truncate text-[10px] font-bold">{selectedGroupData?.name || 'No group'}</span>}
                <span className="block max-w-32 truncate text-[8px] text-emerald-300">{selectedGroupData?.group_vatin || '—'}</span>
              </div>
              <span className="h-8 w-px shrink-0 bg-white/20" />
              <label className="min-w-0 flex-1">
                <span className="block text-[8px] font-semibold uppercase tracking-wide text-white/60">Supplier company</span>
                <select value={selectedEntity} onChange={(event) => onSelectEntity(event.target.value)} className="w-full min-w-36 cursor-pointer rounded border border-white/30 bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white outline-none hover:border-white">
                  <option value="group">Whole group — {entities.length} supplier {entities.length === 1 ? 'company' : 'companies'}</option>
                  {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name} · {entity.vatin}</option>)}
                </select>
              </label>
            </div>

            <button onClick={onToggleDocs} className={`flex items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${showDocs ? 'border-white bg-white/20' : 'border-white/20 bg-white/10 hover:bg-white/20'}`}>
              <HelpCircle className="h-3.5 w-3.5" /><span className="hidden sm:inline">{showDocs ? 'Hide Setup' : 'Setup Guide'}</span>
            </button>
            <button onClick={onResetDb} disabled={isResetting} className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-white/20 disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset Seeds'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
