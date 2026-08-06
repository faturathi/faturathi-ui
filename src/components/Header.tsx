import React, { useState } from 'react';
import { FaturathiLogo, NetbueLogo } from './Logos';
import { Bell, HelpCircle, RefreshCw, X, AlertTriangle, Clock, FileText, ShieldCheck, LogOut, User, Key, ShieldAlert } from 'lucide-react';
import { AuthUser } from './LoginPage';
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
}

export const Header: React.FC<HeaderProps> = ({
  selectedEntity,
  onSelectEntity,
  showDocs,
  onToggleDocs,
  onResetDb,
  isResetting,
  currentUser,
  onLogout,
  onOpenCertModal,
  certVerified = false,
  entities,
  companyGroups,
  selectedGroup,
  onSelectGroup
}) => {
  const [showBellPanel, setShowBellPanel] = useState(false);

  return (
    <header className="bg-gradient-to-r from-[#082f54] via-[#0d4f8b] to-[#0b7a63] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Left: Logos & Platform Identity */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
          <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 transition-colors px-2.5 py-1 rounded-xl border border-white/20 shadow-2xs">
            <FaturathiLogo className="h-7 w-auto shrink-0" iconOnly={true} />
            <div className="h-6 w-px bg-white/20"></div>
            <div className="flex flex-col justify-center">
              <div className="text-sm font-black tracking-tight leading-none text-white flex items-center gap-1.5">
                <span>faturathi</span>
                <span className="text-emerald-300 font-bold text-[9px] uppercase tracking-wider bg-emerald-950/90 px-1.5 py-0.2 rounded border border-emerald-400/40">
                  ENTERPRISE
                </span>
              </div>
              <div className="text-[10px] text-white/80 font-medium leading-tight mt-0.5 flex items-center gap-1.5">
                <span className="text-slate-200">by NETBUE</span>
                <span className="text-white/40">•</span>
                <span className="text-emerald-200">OTA Accredited</span>
                <span className="text-white/40">•</span>
                <span className="font-arabic text-emerald-100">فوترتك.. أصبحت أسهل</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Context Header + PKI Status + User + Controls */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 text-xs w-full lg:w-auto">
          {/* Certificate Warning Trigger Badge */}
          {onOpenCertModal && (
            <button
              onClick={onOpenCertModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                certVerified
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-red-950/90 text-red-300 border-red-500/50 hover:bg-red-900 animate-pulse'
              }`}
              title="Click to check Faturathi Peppol PKI Certificate"
            >
              <ShieldAlert className={`h-4 w-4 ${certVerified ? 'text-emerald-400' : 'text-red-400'}`} />
              <span>{certVerified ? 'PKI Handshake Active' : 'Cert Checker Warning'}</span>
            </button>
          )}

          {/* Active User Badge & Logout Button */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-400/30 px-3 py-1.5 rounded-xl shadow-2xs">
              <div className={`h-7 w-7 rounded-lg ${currentUser.avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                {currentUser.n.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs leading-none">{currentUser.n}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-400/30">
                    {currentUser.roleBadge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 block font-mono mt-0.5">{currentUser.e}</span>
              </div>

              <div className="h-5 w-px bg-white/20 mx-0.5"></div>

              <button
                onClick={onLogout}
                className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-white rounded-lg border border-red-400/30 transition-all cursor-pointer flex items-center gap-1 font-semibold text-xs"
                title="Log out of session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          )}

          {/* Context Block */}
          <div className="hidden sm:flex items-center gap-3 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/60 block font-semibold">
                Client / Supplier VAT Group
              </span>
              {companyGroups.length > 1 ? (
                <select value={selectedGroup} onChange={(e) => onSelectGroup(e.target.value)}
                  className="bg-slate-900/80 text-white font-semibold text-xs rounded border border-white/30 px-2 py-0.5 outline-none">
                  {companyGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              ) : <span className="font-bold text-white text-xs">{companyGroups[0]?.name || 'No business group assigned'}</span>}
              <span className="text-[10px] text-emerald-300 block">VAT Group {companyGroups.find((g) => g.id === selectedGroup)?.group_vatin || companyGroups[0]?.group_vatin || '—'}</span>
            </div>

            <div className="h-6 w-px bg-white/20"></div>

            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/60 block font-semibold">
                Working as Supplier
              </span>
              <select
                value={selectedEntity}
                onChange={(e) => onSelectEntity(e.target.value)}
                className="bg-slate-900/80 text-white font-semibold text-xs rounded border border-white/30 px-2 py-0.5 outline-none cursor-pointer hover:border-white transition-colors"
              >
                <option value="group">Whole group — {entities.length} Supplier {entities.length === 1 ? 'Company' : 'Companies'}</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>{entity.name} · {entity.vatin}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Setup Guide Button */}
          <button
            onClick={onToggleDocs}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
              showDocs
                ? 'bg-white/20 border-white text-white'
                : 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{showDocs ? 'Hide Setup' : 'Setup Guide'}</span>
          </button>

          {/* Reset Seeds Button */}
          <button
            onClick={onResetDb}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white rounded-xl font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset Seeds'}</span>
          </button>

          {/* Bell Panel Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowBellPanel(!showBellPanel)}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer transition-all"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow">
                4
              </span>
            </button>

            {/* Notification Bell Panel Dropdown */}
            {showBellPanel && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 text-left antialiased">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#0d4f8b]" />
                    <h4 className="font-bold text-sm text-[#0d4f8b]">Outstanding Action Items</h4>
                  </div>
                  <button
                    onClick={() => setShowBellPanel(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2 p-2 bg-red-50 rounded-xl border border-red-100 text-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <b className="font-semibold block text-red-950">1 Rejected Invoice Awaiting Correction</b>
                      <span className="text-[11px]">INV-2026-07-0231 rejected by buyer AP — ibr-003-om seller VAT ID format.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 p-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-900">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <b className="font-semibold block text-amber-950">3 B2C Batches Approaching 24h Window</b>
                      <span className="text-[11px]">From POS MCT-04 — submission window closes in less than 6 hours.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 p-2 bg-blue-50 rounded-xl border border-blue-100 text-blue-900">
                    <FileText className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <b className="font-semibold block text-blue-950">1 Credit Note Draft Pending Approval</b>
                      <span className="text-[11px]">Source cancellation ref 2026/0731 requires manager sign-off.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <b className="font-semibold block text-emerald-950">PINT OM v1.0.1 Active</b>
                      <span className="text-[11px]">UUIDv5 deterministic derivation &amp; Baisa-gap tolerance active in force.</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
