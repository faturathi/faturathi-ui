import React, { useState, useRef, useEffect } from 'react';
import { RoleMode } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  Radio, 
  PlusCircle, 
  Upload, 
  Database, 
  Activity, 
  Scale, 
  BarChart3, 
  ShieldCheck, 
  Lock, 
  Settings, 
  HelpCircle,
  ChevronDown,
  FileSpreadsheet,
  History,
  Server,
  Building2,
  Users,
  Sliders,
  Phone
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  roleMode: RoleMode;
}

export interface NavSubItem {
  id: string;
  code: string;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
}

export interface NavGroup {
  id: string;
  code: string;
  label: string;
  ar: string;
  primaryTab: string;
  icon: React.ReactNode;
  subItems?: NavSubItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'grp_dash',
    code: 'A',
    label: 'Dashboard',
    ar: 'لوحة المعلومات',
    primaryTab: 'dash',
    icon: <LayoutDashboard className="h-4 w-4 text-[#0d4f8b]" />
  },
  {
    id: 'grp_inv',
    code: 'B',
    label: 'Invoice',
    ar: 'الفواتير',
    primaryTab: 'inv',
    icon: <FileText className="h-4 w-4 text-[#0d4f8b]" />,
    subItems: [
      { id: 'inv', code: 'B.1', label: 'Invoices (AR)', desc: 'Outbound sales invoice register & status', icon: <FileText className="h-4 w-4 text-[#0d4f8b]" /> },
      { id: 'ap_inv', code: 'B.2', label: 'AP Invoices', desc: 'Inbound supplier bill action hub', icon: <Radio className="h-4 w-4 text-emerald-600" /> },
      { id: 'new', code: 'B.3', label: 'Create Invoice', desc: 'Quick Invoice & PINT-OM 73-Field Engine', icon: <PlusCircle className="h-4 w-4 text-blue-600" /> }
    ]
  },
  {
    id: 'grp_data',
    code: 'C',
    label: 'Data Source',
    ar: 'مصادر البيانات',
    primaryTab: 'connectors',
    icon: <Database className="h-4 w-4 text-blue-600" />,
    subItems: [
      { id: 'up', code: 'C.1', label: 'Upload Individual', desc: 'Single file Excel / XML / JSON import', icon: <Upload className="h-4 w-4 text-blue-600" /> },
      { id: 'up_batch', code: 'C.2', label: 'Upload Batch', desc: 'ZIP & Folder bulk ingestion pipeline', icon: <FileSpreadsheet className="h-4 w-4 text-[#0d4f8b]" /> },
      { id: 'connectors', code: 'C.3', label: 'Connectors (FTP/SMTP/REST API/S3 etc.)', desc: 'Enterprise ERP & Cloud Integration Endpoints', icon: <Database className="h-4 w-4 text-purple-600" /> }
    ]
  },
  {
    id: 'grp_reports',
    code: 'D',
    label: 'Status & Reports',
    ar: 'الحالة والتقارير',
    primaryTab: 'tdd',
    icon: <Activity className="h-4 w-4 text-amber-600" />,
    subItems: [
      { id: 'tdd', code: 'D.1', label: 'TDD & MLS', desc: 'Tax Data Delivery & Clearance status', icon: <Activity className="h-4 w-4 text-amber-600" /> },
      { id: 'rep', code: 'D.2', label: 'Reports & Archive', desc: 'SAF-T exports & 10-year compliance archive', icon: <BarChart3 className="h-4 w-4 text-[#0d4f8b]" /> },
      { id: 'audit_logs', code: 'D.3', label: 'Audit Logs', desc: 'Immutable security & compliance audit logs', icon: <History className="h-4 w-4 text-slate-600" /> }
    ]
  },
  {
    id: 'grp_admin',
    code: 'E',
    label: 'Administration',
    ar: 'الإدارة',
    primaryTab: 'adm',
    icon: <Settings className="h-4 w-4 text-slate-700" />,
    subItems: [
      { id: 'adm', code: 'E.1', label: 'User & Roles Management', desc: 'Users, groups, roles & RBAC matrix', icon: <Users className="h-4 w-4 text-[#0d4f8b]" /> },
      { id: 'onb', code: 'E.2', label: 'Onboarding & SMP', desc: 'SMP/SML status & Peppol participant registration', icon: <ShieldCheck className="h-4 w-4 text-emerald-600" /> },
      { id: 'sys_setup', code: 'E.3', label: 'Setup Company', desc: 'Company, legal entities, CR/TAX/VAT, contacts', icon: <Building2 className="h-4 w-4 text-indigo-600" /> },
      { id: 'sys_logs', code: 'E.4', label: 'View System Logs', desc: 'User activities, OTA/Peppol details, server logs, errors', icon: <Server className="h-4 w-4 text-slate-600" /> },
      { id: 'gen_cfg', code: 'E.5', label: 'General Configurations', desc: 'System setup, numbering series & API configs', icon: <Sliders className="h-4 w-4 text-purple-600" /> }
    ]
  },
  {
    id: 'grp_rec',
    code: 'F',
    label: 'Reconciliation',
    ar: 'المطابقة',
    primaryTab: 'rec',
    icon: <Scale className="h-4 w-4 text-[#0d4f8b]" />
  },
  {
    id: 'grp_sec',
    code: 'G',
    label: 'Security',
    ar: 'الأمان',
    primaryTab: 'sec',
    icon: <Lock className="h-4 w-4 text-red-600" />
  },
  {
    id: 'grp_cmp',
    code: 'H',
    label: 'Why FatuRathi',
    ar: 'لماذا فوترتي',
    primaryTab: 'cmp',
    icon: <HelpCircle className="h-4 w-4 text-emerald-600" />
  },
  {
    id: 'grp_about',
    code: 'I',
    label: 'About / Contact',
    ar: 'من نحن / اتصل بنا',
    primaryTab: 'about',
    icon: <Phone className="h-4 w-4 text-[#0d4f8b]" />
  }
];

const HIDDEN_TABS_BY_ROLE: Record<RoleMode, string[]> = {
  admin: [],
  finmgr: ['adm'],
  maker: ['rec', 'rep', 'adm', 'sec'],
  ops: ['new', 'up', 'up_batch', 'rec', 'rep', 'adm', 'onb', 'sec', 'cmp'],
  audit: ['new', 'up', 'up_batch', 'adm']
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, roleMode }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const hiddenTabs = HIDDEN_TABS_BY_ROLE[roleMode] || [];
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGroupActive = (group: NavGroup) => {
    if (activeTab === group.primaryTab) return true;
    if (group.subItems) {
      return group.subItems.some(sub => sub.id === activeTab);
    }
    return false;
  };

  return (
    <nav ref={navRef} className="bg-white border-b border-slate-300 sticky top-0 sm:top-[58px] z-50 shadow-xs">
      <div className="max-w-[1600px] w-full mx-auto px-2 sm:px-6">
        <ul className="flex items-center flex-wrap sm:flex-nowrap gap-0 py-0 overflow-visible relative">
          {NAV_GROUPS.map((group) => {
            if (hiddenTabs.includes(group.primaryTab)) return null;

            const active = isGroupActive(group);
            const hasSub = group.subItems && group.subItems.length > 0;
            const isOpen = activeDropdown === group.id;

            return (
              <li
                key={group.id}
                className="relative group shrink-0"
                onMouseEnter={() => hasSub && setActiveDropdown(group.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {/* Main Tab Link */}
                <button
                  onClick={() => {
                    if (hasSub) {
                      setActiveDropdown(isOpen ? null : group.id);
                      // Navigate to primary tab if clicked directly
                      onTabChange(group.primaryTab);
                    } else {
                      onTabChange(group.primaryTab);
                      setActiveDropdown(null);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 text-[14px] font-semibold transition-all duration-150 cursor-pointer border-b-[3px] -mb-[1px] whitespace-nowrap ${
                    active
                      ? 'text-[#0056b3] border-[#0056b3] bg-blue-50/50 font-bold'
                      : 'text-[#1f3d5b] border-transparent hover:text-[#0056b3] hover:bg-slate-50'
                  }`}
                >
                  <span className="shrink-0">{group.icon}</span>
                  <span>{group.label}</span>
                  {hasSub && (
                    <ChevronDown className={`h-3.5 w-3.5 opacity-75 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#0056b3]' : ''}`} />
                  )}
                </button>

                {/* Submenu Cascade Dropdown */}
                {hasSub && isOpen && (
                  <ul className="absolute left-0 top-full min-w-[280px] bg-white border border-slate-300 shadow-[0_12px_28px_rgba(0,0,0,0.18)] rounded-b-xl z-[9999] py-1.5 animate-fadeIn">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-[#0056b3] uppercase tracking-wider bg-slate-50/80 flex items-center justify-between">
                      <span>{group.code}.) {group.label} Submenu</span>
                      <span className="text-slate-400 font-arabic font-normal">{group.ar}</span>
                    </div>

                    {group.subItems?.map((sub) => {
                      if (hiddenTabs.includes(sub.id)) return null;
                      const isSubActive = activeTab === sub.id;

                      return (
                        <li key={sub.id}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTabChange(sub.id);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer flex items-start gap-2.5 ${
                              isSubActive
                                ? 'bg-[#f2f6fb] text-[#0056b3] font-bold border-l-4 border-[#0056b3]'
                                : 'text-slate-700 hover:bg-[#f2f6fb] hover:text-[#0056b3]'
                            }`}
                          >
                            <span className="bg-[#0056b3] text-white text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 font-bold mt-0.5 shadow-2xs">
                              {sub.code}
                            </span>
                            <span className="shrink-0 mt-0.5">{sub.icon}</span>
                            <div className="flex-1">
                              <div className="leading-tight">{sub.label}</div>
                              {sub.desc && (
                                <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                                  {sub.desc}
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};


