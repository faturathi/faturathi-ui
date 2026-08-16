import React, { useEffect, useState } from 'react';
import { CompanyBranch, User, RoleMode } from '../types';
import { 
  Shield, UserPlus, Users, Settings, Lock, AlertTriangle, CheckCircle2, 
  Building2, Server, Sliders, ShieldCheck, Search, Filter, Download, 
  Plus, Edit3, Trash2, Key, Globe, Database, FileText, Check, Copy, RefreshCw, Eye, EyeOff,
  Calendar, Clock, RotateCcw
} from 'lucide-react';
import { apiFetch, getApiFieldErrors, unwrapList, type ApiFieldErrors } from '../lib/api';
import { useConfirmation } from './ConfirmationDialog';

interface AdministrationViewProps {
  roleMode: RoleMode;
  onChangeRoleMode: (mode: RoleMode) => void;
  maskAmounts: boolean;
  onToggleMaskAmounts: () => void;
  users: User[];
  onAddUser: (user: Partial<User>) => Promise<{ temporaryPassword?: string } | void>;
  onToggleUserStatus: (id: string) => Promise<void>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onEntitiesChanged?: () => Promise<void>;
  isPlatformAdmin?: boolean;
}

export const AdministrationView: React.FC<AdministrationViewProps> = ({
  roleMode,
  onChangeRoleMode,
  maskAmounts,
  onToggleMaskAmounts,
  users,
  onAddUser,
  onToggleUserStatus,
  activeTab = 'adm',
  onTabChange,
  onEntitiesChanged,
  isPlatformAdmin = false
}) => {
  const [confirmAction, confirmationDialog] = useConfirmation();
  // Local active subtab fallback if not controlled externally
  const [internalTab, setInternalTab] = useState<string>(activeTab);
  const currentTab = activeTab || internalTab;

  const handleTabSwitch = (tab: string) => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // ---------------- SETUP COMPANY STATE ----------------
  // Default to standalone: most entities file independently, and a group VATIN is meaningless
  // until the user deliberately opts into a multi-entity group structure (option 2 below).
  const [setupMode, setSetupMode] = useState<'single' | 'group'>('single');
  const [groupVatin, setGroupVatin] = useState('');
  const [groupName, setGroupName] = useState('');
  const [vatGroupError, setVatGroupError] = useState('');
  const [groupSaveError, setGroupSaveError] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [companyGroups, setCompanyGroups] = useState<any[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showInlineGroupCreate, setShowInlineGroupCreate] = useState(false);
  const [selectedCompanyGroup, setSelectedCompanyGroup] = useState('');

  const [entities, setEntities] = useState<any[]>([]);
  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [branchCompanyId, setBranchCompanyId] = useState('');
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('Muscat');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchInvoicePrefix, setBranchInvoicePrefix] = useState('INV-');
  const [branchInvoiceSuffix, setBranchInvoiceSuffix] = useState('/OM');
  const [branchCreditPrefix, setBranchCreditPrefix] = useState('CN-');
  const [branchCreditSuffix, setBranchCreditSuffix] = useState('/CN');
  const [branchError, setBranchError] = useState('');
  const [isSavingBranch, setIsSavingBranch] = useState(false);
  // Form State for Adding/Updating Sub-Company
  const [subName, setSubName] = useState('');
  const [subNameAr, setSubNameAr] = useState('');
  const [subCr, setSubCr] = useState('');
  const [subVat, setSubVat] = useState('');
  const [subBranch, setSubBranch] = useState('0000');
  const [subAddress, setSubAddress] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subContact, setSubContact] = useState('');
  const [subIsic, setSubIsic] = useState('6201 - Software Development');
  const [subType, setSubType] = useState<'Parent Entity' | 'Subsidiary' | 'Branch Entity' | 'Joint Venture'>('Subsidiary');
  
  // Entity Invoice Prefix & Suffix state
  const [subInvPrefix, setSubInvPrefix] = useState('INV-E1-');
  const [subInvSuffix, setSubInvSuffix] = useState('/OM');
  const [subCnPrefix, setSubCnPrefix] = useState('CN-E1-');
  const [subCnSuffix, setSubCnSuffix] = useState('/CN');

  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [entityErrors, setEntityErrors] = useState<ApiFieldErrors>({});
  const [isSavingEntity, setIsSavingEntity] = useState(false);

  const handleGroupVatinChange = (val: string) => {
    setGroupVatin(val);
    if (val.startsWith('OM11')) {
      setVatGroupError('ERROR: OM11... is an individual entity VATIN! Group VATINs must start with OM12...');
    } else {
      setVatGroupError('');
    }
  };

  const loadEntities = async () => {
    const [entityPayload, groupPayload, branchPayload] = await Promise.all([
      apiFetch<any[] | { results?: any[] }>('/api/entities?page_size=100'),
      apiFetch<any[] | { results?: any[] }>('/api/company-groups?page_size=100'),
      apiFetch<CompanyBranch[] | { results?: CompanyBranch[] }>('/api/branches?page_size=100'),
    ]);
    const loadedEntities = unwrapList(entityPayload);
    setEntities(loadedEntities);
    setCompanyGroups(unwrapList(groupPayload));
    setBranches(unwrapList(branchPayload));
    setBranchCompanyId((current) => loadedEntities.some((entity) => entity.id === current)
      ? current : loadedEntities.find((entity) => !entity.company_group)?.id || loadedEntities[0]?.id || '');
  };

  const resetBranchForm = () => {
    setEditingBranchId(null);
    setBranchCode('');
    setBranchName('');
    setBranchCity('Muscat');
    setBranchAddress('');
    setBranchInvoicePrefix('INV-');
    setBranchInvoiceSuffix('/OM');
    setBranchCreditPrefix('CN-');
    setBranchCreditSuffix('/CN');
    setBranchError('');
  };

  const handleSaveBranch = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedCompany = entities.find((entity) => entity.id === branchCompanyId);
    if (!selectedCompany) {
      setBranchError('Select the legal company that owns this operational branch.');
      return;
    }
    if (!editingBranchId && !await confirmAction({
      title: 'Create operational branch?',
      description: `${branchCode.toUpperCase()} — ${branchName}`,
      detail: `This branch will use ${selectedCompany.name}'s existing VATIN ${selectedCompany.vatin}. It will not create another legal entity or tenant.`,
      confirmLabel: 'Create branch', kind: 'create',
    })) return;
    setIsSavingBranch(true);
    setBranchError('');
    try {
      await apiFetch(editingBranchId ? `/api/branches/${editingBranchId}` : '/api/branches', {
        method: editingBranchId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          company: branchCompanyId, code: branchCode.toUpperCase(), name: branchName,
          city: branchCity, address: branchAddress, invoice_prefix: branchInvoicePrefix,
          invoice_suffix: branchInvoiceSuffix, credit_note_prefix: branchCreditPrefix,
          credit_note_suffix: branchCreditSuffix,
        }),
      });
      await loadEntities();
      resetBranchForm();
    } catch (error) {
      const fields = getApiFieldErrors(error);
      setBranchError(Object.entries(fields).flatMap(([field, messages]) =>
        messages.map((message) => `${field}: ${message}`)).join(' ') ||
        (error instanceof Error ? error.message : 'Branch could not be saved.'));
    } finally {
      setIsSavingBranch(false);
    }
  };

  const handleEditBranch = (branch: CompanyBranch) => {
    setEditingBranchId(branch.id);
    setBranchCompanyId(branch.company);
    setBranchCode(branch.code);
    setBranchName(branch.name);
    setBranchCity(branch.city || 'Muscat');
    setBranchAddress(branch.address || '');
    setBranchInvoicePrefix(branch.invoice_prefix);
    setBranchInvoiceSuffix(branch.invoice_suffix);
    setBranchCreditPrefix(branch.credit_note_prefix);
    setBranchCreditSuffix(branch.credit_note_suffix);
    setBranchError('');
  };

  const handleDeleteBranch = async (branch: CompanyBranch) => {
    if (!await confirmAction({
      title: 'Delete unused branch?', description: `${branch.code} — ${branch.name}`,
      detail: 'A branch with assigned documents cannot be deleted because historical branch-wise reports must remain intact.',
      confirmLabel: 'Delete branch', kind: 'danger',
    })) return;
    try {
      await apiFetch(`/api/branches/${branch.id}`, { method: 'DELETE' });
      await loadEntities();
      if (editingBranchId === branch.id) resetBranchForm();
    } catch (error) {
      const fields = getApiFieldErrors(error);
      setBranchError(Object.values(fields).flat().join(' ') ||
        (error instanceof Error ? error.message : 'Branch could not be deleted.'));
    }
  };

  const resetGroupForm = () => {
    setEditingGroupId(null);
    setGroupName('');
    setGroupVatin('');
    setVatGroupError('');
    setGroupSaveError('');
  };

  const handleSaveGroup = async () => {
    const editing = Boolean(editingGroupId);
    if (!await confirmAction({ title: 'Create VAT group?', description: `${groupName.trim()} · ${groupVatin.trim().toUpperCase()}`, detail: 'This establishes a new tenant boundary. Verify the registered VAT group name and OM12 VATIN before continuing.', confirmLabel: 'Create VAT group', kind: 'create' })) return;
    setGroupSaveError('');
    setIsSavingGroup(true);
    try {
      const saved = await apiFetch<{ id: string }>(
        editingGroupId ? `/api/company-groups/${editingGroupId}` : '/api/company-groups', {
        method: editingGroupId ? 'PATCH' : 'POST', body: JSON.stringify({ name: groupName.trim(), group_vatin: groupVatin.trim().toUpperCase() })
      });
      await loadEntities();
      await onEntitiesChanged?.();
      resetGroupForm();
      if (!editing) {
        // Just created (not edited) a group from the inline "Subsidiary/Branch" panel — select
        // it immediately instead of leaving the user to find it in the dropdown themselves.
        setSelectedCompanyGroup(saved.id);
        setShowInlineGroupCreate(false);
      }
    } catch (error) {
      const fields = getApiFieldErrors(error);
      setGroupSaveError(Object.entries(fields).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`)).join(' ') || (error instanceof Error ? error.message : 'VAT group creation failed.'));
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (group: any) => {
    if (!await confirmAction({ title: 'Delete empty VAT group?', description: `${group.name} / ${group.group_vatin}`, detail: 'Deletion is allowed only when no active companies belong to this group.', confirmLabel: 'Delete VAT group', kind: 'danger' })) return;
    setGroupSaveError('');
    try {
      await apiFetch(`/api/company-groups/${group.id}`, { method: 'DELETE' });
      await loadEntities();
      await onEntitiesChanged?.();
      if (editingGroupId === group.id) resetGroupForm();
    } catch (error) {
      const fields = getApiFieldErrors(error);
      setGroupSaveError(Object.values(fields).flat().join(' ') || (error instanceof Error ? error.message : 'VAT group deletion failed.'));
    }
  };

  useEffect(() => {
    void loadEntities().catch((error) => console.warn('Entity loading failed:', error));
  }, []);

  const handleAddOrUpdateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subVat) return;
    if (setupMode === 'group' && !selectedCompanyGroup) {
      setEntityErrors({ company_group: ['Select the existing business group for this subsidiary or branch.'] });
      return;
    }
    if (!editingEntityId && !await confirmAction({ title: 'Create legal company?', description: `${subName} · ${subVat}`, detail: 'This creates a legal-entity tenant and Peppol participant configuration. Confirm the CR and OM11 VATIN are correct.', confirmLabel: 'Create company', kind: 'create' })) return;
    const body = {
      name: subName, nameAr: subNameAr, crNum: subCr, vatin: subVat,
      pid: `0248:${subVat}`, branchId: subBranch, address: subAddress, email: subEmail,
      phone: subPhone, entity_type: subType === 'Branch Entity' ? 'BRANCH' : subType === 'Subsidiary' ? 'SUBSIDIARY' : 'HQ',
      invoicePrefix: subInvPrefix, invoiceSuffix: subInvSuffix, creditNoteSuffix: subCnSuffix,
      prefixes: [subInvPrefix], short_code: editingEntityId ? undefined : `E${entities.length + 1}`,
      standalone: setupMode === 'single',
      company_group: setupMode === 'group' ? selectedCompanyGroup : null,
    };
    setEntityErrors({});
    setIsSavingEntity(true);
    try {
      await apiFetch(editingEntityId ? `/api/entities/${editingEntityId}` : '/api/entities', {
        method: editingEntityId ? 'PATCH' : 'POST', body: JSON.stringify(body)
      });
      await loadEntities();
      await onEntitiesChanged?.();
      setEditingEntityId(null);
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      setEntityErrors(Object.keys(fieldErrors).length ? fieldErrors : { non_field_errors: [error instanceof Error ? error.message : 'Company save failed.'] });
      return;
    } finally {
      setIsSavingEntity(false);
    }

    // Reset Form
    setSubName('');
    setSubNameAr('');
    setSubCr('');
    setSubVat('');
    setSubBranch('0000');
    setSubAddress('');
    setSubEmail('');
    setSubPhone('');
    setSubContact('');
    setSubInvPrefix('INV-E1-');
    setSubInvSuffix('/OM');
    setSubCnPrefix('CN-E1-');
    setSubCnSuffix('/CN');
    setSelectedCompanyGroup('');
  };

  const handleEditEntityClick = (ent: typeof entities[0]) => {
    setEditingEntityId(ent.id);
    setSubName(ent.name);
    setSubNameAr(ent.nameAr);
    setSubCr(ent.crNum);
    setSubVat(ent.vatin);
    setSubBranch(ent.branchId);
    setSubAddress(ent.address);
    setSubEmail(ent.email);
    setSubPhone(ent.phone);
    setSubContact(ent.contactPerson);
    setSubInvPrefix(ent.invoicePrefix || 'INV-E1-');
    setSubInvSuffix(ent.invoiceSuffix || '/OM');
    setSubCnPrefix(ent.creditNotePrefix || 'CN-E1-');
    setSubCnSuffix(ent.creditNoteSuffix || '/CN');
    setSubIsic(ent.isic);
    setSubType(ent.entity_type === 'BRANCH' ? 'Branch Entity' : ent.entity_type === 'SUBSIDIARY' ? 'Subsidiary' : 'Parent Entity');
    setSetupMode(ent.company_group ? 'group' : 'single');
    setSelectedCompanyGroup(ent.company_group || '');
  };

  // ---------------- USER MANAGEMENT STATE ----------------
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Finance Manager' | 'Invoice Clerk' | 'Operations Viewer' | 'Auditor'>('Finance Manager');
  const [newEnt, setNewEnt] = useState('All Entities');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [credentialEmail, setCredentialEmail] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [userCreateError, setUserCreateError] = useState('');

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    if (!newEnt || newEnt === 'All Entities') {
      setUserCreateError('Select the user’s primary company. Group-wide access is derived from that company’s VAT group.');
      return;
    }
    if (!await confirmAction({ title: 'Create user account?', description: `${newEmail} · ${newRole}`, detail: 'The account becomes active immediately with access to the selected company scope. A temporary password will be generated.', confirmLabel: 'Create user', kind: 'create' })) return;
    setUserCreateError('');
    setTemporaryPassword('');
    setShowTemporaryPassword(false);
    setPasswordCopied(false);
    try {
      const registeredEmail = newEmail;
      const result = await onAddUser({ e: newEmail, n: newName, r: newRole, ent: newEnt, st: 'Active', ll: 'Just now' });
      setTemporaryPassword(result && 'temporaryPassword' in result ? result.temporaryPassword || '' : '');
      setCredentialEmail(registeredEmail);
      setNewEmail('');
      setNewName('');
    } catch (error) {
      setUserCreateError(error instanceof Error ? error.message : 'User creation failed.');
    }
  };

  // Helper function to format timestamp as DD_MM_YY : HH:MM
  const formatLogTimestamp = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanStr = dateStr.replace(' ', 'T');
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    return `${dd}_${mm}_${yy} : ${hh}:${min}`;
  };

  // ---------------- SYSTEM LOGS STATE ----------------
  const [logCategory, setLogCategory] = useState<'all' | 'user' | 'ota_peppol' | 'server' | 'errors'>('all');
  const [logSearch, setLogSearch] = useState('');
  const [logLevel, setLogLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'AS4' | 'AUDIT'>('ALL');
  const [fromDateTime, setFromDateTime] = useState('');
  const [toDateTime, setToDateTime] = useState('');

  const [systemLogs, setSystemLogs] = useState<any[]>([
    {
      id: 'LOG-9945',
      timestamp: '2026-08-02 00:35:10',
      category: 'server',
      level: 'INFO',
      entity: 'E1',
      user: 'REST-API',
      message: 'System audit log export initiated by superadmin@faturathi.netbue.om',
      details: 'IP: 192.168.1.102 · Session ID: sess_998811'
    },
    {
      id: 'LOG-9944',
      timestamp: '2026-08-01 19:10:00',
      category: 'ota_peppol',
      level: 'AS4',
      entity: 'E3',
      user: 'AS4-Daemon',
      message: 'Outbound AP Credit Note CN-2026-0041 transmitted to Peppol C3 Access Point',
      details: 'Payload UUID: c9d8e7f6-a5b4-1234-8901-abcdef123456 · Latency: 110ms'
    },
    {
      id: 'LOG-9943',
      timestamp: '2026-07-30 08:15:20',
      category: 'user',
      level: 'AUDIT',
      entity: 'E2',
      user: 'salim@faturathi.netbue.om',
      message: 'Updated general company tax parameters & VAT Group OM1200001234',
      details: 'User Role: Vendor Technical Staff'
    },
    {
      id: 'LOG-9942',
      timestamp: '2026-07-29 16:45:12',
      category: 'ota_peppol',
      level: 'AS4',
      entity: 'E1',
      user: 'AS4-Daemon',
      message: 'Peppol AS4 transmission outbound to Tax Authority Gateway (0248:OM1100654321)',
      details: 'Payload UUID: e1f2a3b4-c5d6-7890-e1f2-a3b4c5d67890 · Latency: 130ms'
    },
    {
      id: 'LOG-9941',
      timestamp: '2026-07-29 14:22:10',
      category: 'ota_peppol',
      level: 'AS4',
      entity: 'E1',
      user: 'AS4-Daemon',
      message: 'Peppol AS4 transmission outbound to C3 Gateway (0248:OM1100654321) — Receipt MDN 200 OK',
      details: 'Payload UUID: a1b2c3d4-e5f6-5789-a1b2-c3d4e5f67890 · Latency: 140ms'
    },
    {
      id: 'LOG-9940',
      timestamp: '2026-07-29 14:10:05',
      category: 'user',
      level: 'AUDIT',
      entity: 'E1',
      user: 'admin@iis-oman.om',
      message: 'User created new legal entity subsidiary E3 (Salalah Port Branch)',
      details: 'CR-1088421 · VATIN OM1100334455'
    },
    {
      id: 'LOG-9939',
      timestamp: '2026-07-29 13:45:00',
      category: 'server',
      level: 'INFO',
      entity: 'E2',
      user: 'REST-API',
      message: 'POST /api/v1/invoices/validate — 73-Field PINT OM Schematron evaluation passed',
      details: 'Invoice: AAE-2026-07-0108 · 0 Errors'
    },
    {
      id: 'LOG-9938',
      timestamp: '2026-07-29 12:30:15',
      category: 'errors',
      level: 'WARN',
      entity: 'E1',
      user: 'SFTP-Watcher',
      message: 'Schematron Math Warning: Gross Total IBT-112 rounded off by 0.001 OMR',
      details: 'Rule IBT-112 check auto-corrected'
    },
    {
      id: 'LOG-9937',
      timestamp: '2026-07-29 11:15:22',
      category: 'ota_peppol',
      level: 'INFO',
      entity: 'E1',
      user: 'SMP-Sync',
      message: 'SMP Participant Lookup: 0248:OM1100223344 resolved active C3 Access Point endpoint',
      details: 'https://as4.peppol.faturathi.om/as4'
    },
    {
      id: 'LOG-9936',
      timestamp: '2026-07-29 10:02:44',
      category: 'user',
      level: 'AUDIT',
      entity: 'E2',
      user: 'fatma@alibri.om',
      message: 'Inbound AP Invoice PINV-2026-07-0099 approved and posted to SAP S/4HANA',
      details: 'Amount: 3,400.000 OMR'
    },
    {
      id: 'LOG-9935',
      timestamp: '2026-07-29 09:12:00',
      category: 'server',
      level: 'ERROR',
      entity: 'E1',
      user: 'System-Kernel',
      message: 'PKI Certificate Handshake retry required: TLS Client Cert auto-refreshed',
      details: 'CA: Oman National Root Authority CA-2'
    },
    {
      id: 'LOG-9934',
      timestamp: '2026-07-28 22:00:00',
      category: 'server',
      level: 'INFO',
      entity: 'E1',
      user: 'System-Kernel',
      message: 'Nightly SAF-T tax audit log database compression and archiving finished',
      details: 'Archive File: saft_audit_2026_07_28.zip (1.2 MB)'
    },
    {
      id: 'LOG-9933',
      timestamp: '2026-07-28 16:20:10',
      category: 'user',
      level: 'AUDIT',
      entity: 'E2',
      user: 'fatma@alibri.om',
      message: 'User permission updated to Finance Manager with posting rights',
      details: 'Granted by admin@iis-oman.om'
    }
  ]);

  useEffect(() => {
    void apiFetch<any[] | { results?: any[] }>('/api/config/logs?page_size=100').then((payload) => setSystemLogs(unwrapList(payload).map((log) => ({
      id: log.id,
      timestamp: log.created_at,
      category: log.entity === 'Transmission' ? 'ota_peppol' : log.action?.includes('ERROR') ? 'errors' : 'user',
      level: log.entity === 'Transmission' ? 'AS4' : log.action?.includes('ERROR') ? 'ERROR' : 'AUDIT',
      entity: log.entity,
      user: log.user_email || 'System',
      message: `${log.action}${log.entity_id ? ` — ${log.entity_id}` : ''}`,
      details: JSON.stringify(log.detail || {}),
    })))).catch((error) => console.warn('System log loading failed:', error));
  }, []);

  const filteredLogs = systemLogs.filter(log => {
    const matchesCategory = logCategory === 'all' || log.category === logCategory;
    const matchesLevel = logLevel === 'ALL' || log.level === logLevel;

    // Date & Time Period Filter
    let matchesDateTime = true;
    const logMs = new Date(log.timestamp.replace(' ', 'T')).getTime();

    if (fromDateTime) {
      const fromMs = new Date(fromDateTime).getTime();
      if (!isNaN(fromMs) && logMs < fromMs) {
        matchesDateTime = false;
      }
    }

    if (toDateTime) {
      const toMs = new Date(toDateTime).getTime();
      if (!isNaN(toMs) && logMs > toMs) {
        matchesDateTime = false;
      }
    }

    const formattedTs = formatLogTimestamp(log.timestamp);
    const matchesSearch =
      log.id.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.user.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      formattedTs.toLowerCase().includes(logSearch.toLowerCase());

    return matchesCategory && matchesLevel && matchesDateTime && matchesSearch;
  });

  const handleExportLogsCSV = () => {
    const headers = [
      'Log ID',
      'Timestamp (DD_MM_YY : HH:MM)',
      'Raw Timestamp',
      'Category',
      'Level',
      'Entity',
      'User',
      'Log Event Message',
      'Trace Details'
    ];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${formatLogTimestamp(l.timestamp)}"`,
      `"${l.timestamp}"`,
      l.category,
      l.level,
      l.entity,
      `"${l.user}"`,
      `"${l.message.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fromStr = fromDateTime ? formatLogTimestamp(fromDateTime).replace(/ : /g, '_').replace(/_/g, '') : 'all';
    const toStr = toDateTime ? formatLogTimestamp(toDateTime).replace(/ : /g, '_').replace(/_/g, '') : 'all';
    link.setAttribute('download', `system_logs_${fromStr}_to_${toStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------------- GENERAL CONFIGS STATE ----------------
  const [genCountry, setGenCountry] = useState('OM');
  const [genTimeZone, setGenTimeZone] = useState('Asia/Muscat');
  const [genCurrency, setGenCurrency] = useState('OMR');
  const [genFxRate, setGenFxRate] = useState('0.385');
  const [genLanguage, setGenLanguage] = useState('en-ar');
  const [enableMfa, setEnableMfa] = useState(true);
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [enableAdminAlerts, setEnableAdminAlerts] = useState(true);
  const [adminAlertContact, setAdminAlertContact] = useState('tax-admin@iis-oman.om | +968 9988 7766');
  const [notificationEmails, setNotificationEmails] = useState('tax-admin@iis-oman.om');
  const [allowLogin, setAllowLogin] = useState(true);
  const [enableAutoBackups, setEnableAutoBackups] = useState(true);
  const [backupRetention, setBackupRetention] = useState('7_years');
  const [downtimeSchedule, setDowntimeSchedule] = useState('Sun 02:00 - 04:00 GST');
  const [webhookUrl, setWebhookUrl] = useState('https://api.faturathi.om/v1/webhooks/inbound');
  const [apiKey, setApiKey] = useState('fat_live_9988223344556677889900aabbcc');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    void apiFetch<any>('/api/config').then((config) => {
      setGenCountry(config.country);
      setGenTimeZone(config.timezone);
      setGenCurrency(config.base_currency);
      setGenFxRate(String(config.fx_rate_usd));
      setGenLanguage(config.language_mode === 'EN_AR_BILINGUAL' ? 'en-ar' : config.language_mode.toLowerCase());
      setEnableMfa(config.mfa_enforced);
      setEnableAlerts(config.security_alerts);
      setEnableAdminAlerts(config.admin_alerts);
      setAllowLogin(config.allow_user_logins);
      setEnableAutoBackups(config.enable_auto_backups);
      setBackupRetention(`${config.backup_retention_years}_years`);
      setDowntimeSchedule(config.maintenance_window);
      setWebhookUrl(config.webhook_url);
      setAdminAlertContact(config.admin_alert_contact);
      setNotificationEmails((config.notification_emails || []).join(', '));
      setApiKey(config.master_api_key || 'Not configured');
    }).catch((error) => console.warn('Configuration loading failed:', error));
  }, []);

  const saveGeneralConfig = async () => {
    try {
      await apiFetch('/api/config', { method: 'PATCH', body: JSON.stringify({
        country: genCountry, timezone: genTimeZone, base_currency: genCurrency,
        fx_rate_usd: genFxRate, language_mode: genLanguage === 'en-ar' ? 'EN_AR_BILINGUAL' : genLanguage.toUpperCase(),
        mfa_enforced: enableMfa, security_alerts: enableAlerts, admin_alerts: enableAdminAlerts,
        allow_user_logins: allowLogin, backup_retention_years: Number.parseInt(backupRetention) || 7,
        enable_auto_backups: enableAutoBackups,
        maintenance_window: downtimeSchedule, webhook_url: webhookUrl, admin_alert_contact: adminAlertContact,
        notification_emails: notificationEmails.split(/[;,\n]/).map((email) => email.trim()).filter(Boolean),
      }) });
      alert('General configurations saved.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Configuration save failed.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {confirmationDialog}
      {/* Top Section Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="bg-[#0d4f8b] text-white text-xs px-2.5 py-1 rounded-md font-mono">
              E.{currentTab === 'adm' ? '1' : currentTab === 'onb' ? '2' : currentTab === 'sys_setup' ? '3' : currentTab === 'sys_logs' ? '4' : '5'}
            </span>
            <span>
              {currentTab === 'adm' && 'User & Roles Management (RBAC)'}
              {currentTab === 'onb' && 'Onboarding & Peppol SMP/SML Status'}
              {currentTab === 'sys_setup' && 'Company Setup & Legal Entities Register'}
              {currentTab === 'sys_logs' && 'System & Communication Logs Engine'}
              {currentTab === 'gen_cfg' && 'General System & Technical Configurations'}
            </span>
            <span className="text-sm font-normal text-slate-500 font-arabic">الإدارة وإعدادات النظام</span>
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage corporate entities, role-based access controls, Peppol SMP bindings, system execution traces, and numbering rules.
        </p>
      </div>

      {/* Administration Internal Tab Bar Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs flex flex-wrap gap-1">
        {[
          { id: 'adm', label: '1.) User & Roles Management', icon: <Users className="h-4 w-4 text-blue-600" /> },
          { id: 'onb', label: '2.) Onboarding & SMP', icon: <ShieldCheck className="h-4 w-4 text-emerald-600" /> },
          { id: 'sys_setup', label: '3.) Setup Company', icon: <Building2 className="h-4 w-4 text-indigo-600" /> },
          { id: 'sys_logs', label: '4.) View System Logs', icon: <Server className="h-4 w-4 text-slate-700" /> },
          { id: 'gen_cfg', label: '5.) General Configurations', icon: <Sliders className="h-4 w-4 text-purple-600" /> }
        ].map((tab) => {
          const isSelected = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`flex-1 min-w-[180px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isSelected
                  ? 'bg-[#0d4f8b] text-white shadow-xs'
                  : 'bg-transparent text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Role Preview Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[#0d4f8b]" />
            <span>Active Role Simulation Mode</span>
          </h3>

          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={maskAmounts}
              onChange={onToggleMaskAmounts}
              className="rounded text-[#0d4f8b] focus:ring-0"
            />
            <span className="font-semibold text-slate-700">
              Mask confidential financial amounts (<code className="font-mono text-[11px]">•••••</code>)
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'admin', label: 'Super Admin', desc: 'Full technical configuration, Peppol endpoints & REST API logs' },
            { id: 'admin', label: 'Manager', desc: 'Add/remove users & entity access control' },
            { id: 'finmgr', label: 'Finance Manager', desc: 'Financial approvals, SAF-T exports & VAT reconciliation' },
            { id: 'maker', label: 'App User / Clerk', desc: 'Monitor, create & correct invoices' }
          ].map((r, idx) => (
            <button
              key={idx}
              onClick={() => onChangeRoleMode(r.id as RoleMode)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                roleMode === r.id
                  ? 'bg-[#0d4f8b] text-white border-[#0d4f8b] shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: USER AND ROLES MANAGEMENT */}
      {currentTab === 'adm' && (
        <div className="space-y-6">
          {/* User Accounts List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0d4f8b]" />
                  <span>Authorized User Directory &amp; RBAC Access</span>
                </h3>
                <p className="text-xs text-slate-500">Manage operational users, entity scopes, and status.</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3">User / Email</th>
                    <th className="py-3 px-3">Full Name</th>
                    <th className="py-3 px-3">System Role</th>
                    <th className="py-3 px-3">Assigned Entity Scope</th>
                    <th className="py-3 px-3">Last Active</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <b className="font-bold text-slate-900 font-mono block">{u.e}</b>
                        <span className="text-[10px] text-slate-400">ID: {u.id}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{u.n}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-[#0d4f8b] font-bold rounded-lg border border-blue-200">
                          {u.r}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{u.ent}</td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{u.ll}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.st === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {u.st}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={async () => {
                            const enabling = u.st !== 'Active';
                            if (!await confirmAction({
                              title: enabling ? 'Enable this user?' : 'Disable this user?',
                              description: `${u.n} / ${u.e}`,
                              detail: enabling ? 'The user will regain portal access immediately.' : 'Existing tokens may remain valid briefly, but new logins will be blocked.',
                              confirmLabel: enabling ? 'Enable user' : 'Disable user',
                              kind: enabling ? 'create' : 'danger',
                            })) return;
                            await onToggleUserStatus(u.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#0d4f8b] hover:bg-blue-50 rounded-lg transition-all cursor-pointer border border-slate-200"
                        >
                          {u.st === 'Active' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add User Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#0d4f8b]" />
              <span>Provision New User Account</span>
            </h3>

            <form onSubmit={handleCreateUserSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {(temporaryPassword || userCreateError) && <div className={`sm:col-span-2 lg:col-span-4 rounded-2xl border-2 p-4 ${temporaryPassword ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-red-50 border-red-300 text-red-900'}`}>
                {temporaryPassword ? <div className="space-y-3">
                  <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /><div><b className="block text-sm">User account created successfully</b><p className="text-xs mt-0.5">Login credentials were sent to <mark className="bg-yellow-200 text-emerald-950 px-1.5 py-0.5 rounded font-bold">{credentialEmail}</mark> (simulated email — no message was actually sent).</p></div></div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-white border border-emerald-200 p-3">
                    <div className="flex-1"><span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500">One-time temporary password</span><code className="font-mono text-sm font-bold tracking-wider select-all">{showTemporaryPassword ? temporaryPassword : '••••••••••••••••'}</code></div>
                    <button type="button" onClick={() => setShowTemporaryPassword((visible) => !visible)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-700">{showTemporaryPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{showTemporaryPassword ? 'Hide password' : 'View password'}</button>
                    <button type="button" onClick={() => { void navigator.clipboard.writeText(temporaryPassword); setPasswordCopied(true); setTimeout(() => setPasswordCopied(false), 1800); }} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs">{passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{passwordCopied ? 'Copied' : 'Copy password'}</button>
                  </div>
                  <p className="text-[11px] text-emerald-800">For this MVP, email delivery is simulated. In production, send an expiring account-activation link instead of the password.</p>
                </div> : userCreateError}
              </div>}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@iis-oman.om"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Al-Harthy"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 font-bold"
                >
                  <option value="Admin">Admin / Technical Manager</option>
                  <option value="Finance Manager">Finance Manager / Accountant</option>
                  <option value="Invoice Clerk">Invoice Clerk</option>
                  <option value="Operations Viewer">Operations Viewer</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Entity Access Scope</label>
                <select
                  value={newEnt}
                  onChange={(e) => setNewEnt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 font-bold"
                >
                  <option value="All Entities">Select a primary company...</option>
                  {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.short_code || entity.id} — {entity.name}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0d4f8b] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create User Account</span>
                </button>
              </div>
            </form>
          </div>

          {/* RBAC Permission Matrix */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#0d4f8b]" />
              <span>Role-Based Access Control (RBAC) Privilege Matrix</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">System Permission</th>
                    <th className="py-2.5 px-3 text-center">Super Admin</th>
                    <th className="py-2.5 px-3 text-center">Finance Mgr</th>
                    <th className="py-2.5 px-3 text-center">Invoice Clerk</th>
                    <th className="py-2.5 px-3 text-center">Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {[
                    { perm: 'Create Outbound AR / Credit Notes', sa: true, fm: true, ic: true, au: false },
                    { perm: 'Approve Inbound AP & ERP Posting', sa: true, fm: true, ic: false, au: false },
                    { perm: 'Run PINT-OM 73-Field Schematron Checks', sa: true, fm: true, ic: true, au: true },
                    { perm: 'Manage Sub-Companies & VAT Group', sa: true, fm: false, ic: false, au: false },
                    { perm: 'Export SAF-T & Tax Audit Files', sa: true, fm: true, ic: false, au: true },
                    { perm: 'Access AS4 Communication & System Logs', sa: true, fm: false, ic: false, au: true }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{row.perm}</td>
                      <td className="py-2.5 px-3 text-center">{row.sa ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : '—'}</td>
                      <td className="py-2.5 px-3 text-center">{row.fm ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : '—'}</td>
                      <td className="py-2.5 px-3 text-center">{row.ic ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : '—'}</td>
                      <td className="py-2.5 px-3 text-center">{row.au ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ONBOARDING AND SMP */}
      {currentTab === 'onb' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Peppol Service Metadata Publisher (SMP) &amp; Participant Directory</span>
            </h3>
            <p className="text-xs text-slate-500">
              Check live participant registration, OASIS Service Metadata Locator (SML) bindings, and active Access Point (C2/C3) routing.
            </p>

            {/* Participant Lookup Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <b className="text-xs font-bold text-slate-800 block">Query Participant Metadata (Scheme 0248 - Oman VATIN):</b>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue="0248:OM1100123456"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs outline-none text-slate-800 font-bold"
                />
                <button
                  onClick={() => alert('SMP Query: Active participant 0248:OM1100123456 bound to Faturathi C2/C3 Gateway (200 OK)')}
                  className="px-4 py-2 bg-[#0d4f8b] hover:bg-blue-900 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Lookup SMP
                </button>
              </div>
            </div>

            {/* Endpoint Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">OASIS SML Status</span>
                <b className="text-sm font-bold text-emerald-950 block mt-0.5">edelivery.tech.ec.europa.eu</b>
                <span className="text-[11px] text-emerald-800 font-mono mt-1 block">DNS CNAME Resolved ✓</span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">C2/C3 AS4 Gateway</span>
                <b className="text-sm font-bold text-emerald-950 block mt-0.5">as4.peppol.faturathi.om</b>
                <span className="text-[11px] text-emerald-800 font-mono mt-1 block">TLS 1.3 Active · Cert Valid</span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] text-blue-700 font-bold block uppercase">PKI Handshake Binding</span>
                <b className="text-sm font-bold text-blue-950 block mt-0.5">Oman Tax CA-2</b>
                <span className="text-[11px] text-blue-800 font-mono mt-1 block">Expiration: 2028-12-31</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETUP COMPANY & LEGAL ENTITIES */}
      {currentTab === 'sys_setup' && (
        <div className="space-y-6">
          {/* Tax Registration Mode Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <span>Tax Registration Structure &amp; Group VAT Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label
                onClick={() => { setSetupMode('single'); setSubType('Parent Entity'); setSelectedCompanyGroup(''); }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  setupMode === 'single'
                    ? 'border-[#0d4f8b] bg-blue-50/50 ring-2 ring-blue-200'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="tax_mode"
                  checked={setupMode === 'single'}
                  onChange={() => { setSetupMode('single'); setSubType('Parent Entity'); setSelectedCompanyGroup(''); }}
                  className="mr-2 text-[#0d4f8b]"
                />
                <b className="font-bold text-slate-900 text-sm">1.) Standalone / Single Legal Entity</b>
                <p className="text-slate-600 mt-1">
                  Each company entity files independently using its own individual <code className="font-mono text-[11px]">OM11...</code> VATIN.
                </p>
              </label>

              <label
                onClick={() => { setSetupMode('group'); if (subType === 'Parent Entity') setSubType('Subsidiary'); }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  setupMode === 'group'
                    ? 'border-[#0d4f8b] bg-blue-50/50 ring-2 ring-blue-200'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="tax_mode"
                  checked={setupMode === 'group'}
                  onChange={() => { setSetupMode('group'); if (subType === 'Parent Entity') setSubType('Subsidiary'); }}
                  className="mr-2 text-[#0d4f8b]"
                />
                <b className="font-bold text-slate-900 text-sm">2.) Subsidiary / Branch Company</b>
                <p className="text-slate-600 mt-1">
                  Assign this company to an existing business group. Create and maintain groups separately below.
                </p>
              </label>
            </div>

            {setupMode === 'group' && (
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-indigo-950">Assign Existing Business Group *</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select required value={selectedCompanyGroup} onChange={(e) => setSelectedCompanyGroup(e.target.value)}
                    className="w-full max-w-xl bg-white border border-indigo-300 rounded-xl px-3 py-2.5 text-xs font-bold text-indigo-900 outline-none">
                    <option value="">Select a VAT group...</option>
                    {companyGroups.map((group) => <option key={group.id} value={group.id}>{group.name} · {group.group_vatin}</option>)}
                  </select>
                  <button type="button" onClick={() => { resetGroupForm(); setShowInlineGroupCreate((v) => !v); }}
                    className="whitespace-nowrap px-3 py-2.5 rounded-xl border border-indigo-300 bg-white text-xs font-bold text-indigo-700 hover:bg-indigo-50">
                    {showInlineGroupCreate ? 'Cancel' : '+ Create new group'}
                  </button>
                </div>
                {!companyGroups.length && !showInlineGroupCreate && <p className="text-xs font-semibold text-amber-700">No group is available yet — use "+ Create new group" above.</p>}

                {showInlineGroupCreate && (
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end pt-2 border-t border-indigo-200">
                    <div>
                      <label className="block text-[11px] font-bold text-indigo-950 mb-1">New Group Name</label>
                      <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. VASS Business Group"
                        className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-xs font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-indigo-950 mb-1">Group VATIN (OM12 + 8 digits)</label>
                      <input value={groupVatin} onChange={(e) => handleGroupVatinChange(e.target.value.toUpperCase())} placeholder="OM1200001234"
                        className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 font-mono text-xs font-bold" />
                      {vatGroupError && <p className="mt-1 text-[11px] font-bold text-red-600">{vatGroupError}</p>}
                    </div>
                    <button type="button" onClick={handleSaveGroup}
                      disabled={isSavingGroup || !groupName.trim() || !groupVatin.trim() || Boolean(vatGroupError)}
                      className="px-4 py-2.5 bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold whitespace-nowrap">
                      {isSavingGroup ? 'Creating...' : 'Create Group'}
                    </button>
                    {groupSaveError && <p className="sm:col-span-3 text-[11px] font-bold text-red-600">{groupSaveError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {isPlatformAdmin && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600" /> VAT Group Management</h3>
                <p className="text-xs text-slate-500">Technical administrators can add, view, edit and delete empty groups. Groups containing companies are protected.</p>
              </div>
              {groupSaveError && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-800">{groupSaveError}</div>}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                <div><label className="block text-xs font-bold text-indigo-950 mb-1">VAT Group Name</label><input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. VASS Business Group" className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2.5 text-xs font-bold" /></div>
                <div><label className="block text-xs font-bold text-indigo-950 mb-1">Group VATIN (OM12 + 8 digits)</label><input value={groupVatin} onChange={(e) => handleGroupVatinChange(e.target.value.toUpperCase())} placeholder="OM1200001234" className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2.5 font-mono text-xs font-bold" />{vatGroupError && <p className="mt-1 text-[11px] font-bold text-red-600">{vatGroupError}</p>}</div>
                <div className="flex gap-2"><button type="button" onClick={handleSaveGroup} disabled={isSavingGroup || !groupName.trim() || !groupVatin.trim() || Boolean(vatGroupError)} className="px-4 py-2.5 bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold whitespace-nowrap">{isSavingGroup ? 'Saving...' : editingGroupId ? 'Update Group' : 'Add Group'}</button>{editingGroupId && <button type="button" onClick={resetGroupForm} className="px-3 py-2.5 border border-slate-300 bg-white rounded-xl text-xs font-bold">Cancel</button>}</div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-xs"><thead className="bg-slate-50 text-left text-[10px] uppercase text-slate-500"><tr><th className="p-3">Group</th><th className="p-3">VATIN</th><th className="p-3">Companies</th><th className="p-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{companyGroups.map((group) => <tr key={group.id}><td className="p-3 font-bold text-slate-900">{group.name}</td><td className="p-3 font-mono font-bold text-emerald-800">{group.group_vatin}</td><td className="p-3">{group.company_count ?? 0}</td><td className="p-3 text-right"><button type="button" onClick={() => { setEditingGroupId(group.id); setGroupName(group.name); setGroupVatin(group.group_vatin); setGroupSaveError(''); }} className="mr-2 rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-blue-700"><Edit3 className="inline h-3.5 w-3.5 mr-1" />Edit</button><button type="button" onClick={() => handleDeleteGroup(group)} disabled={Boolean(group.company_count)} title={group.company_count ? 'Move or remove all companies before deleting this group' : 'Delete group'} className="rounded-lg border border-red-200 px-2.5 py-1.5 font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="inline h-3.5 w-3.5 mr-1" />Delete</button></td></tr>)}</tbody></table></div>
            </div>
          )}

          {/* Legal Entities Directory */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0d4f8b]" />
                  <span>Configured Legal Entities &amp; Sub-Companies ({entities.length})</span>
                </h3>
                <p className="text-xs text-slate-500">Commercial Registration (CR), VATIN, Branches &amp; Contact Information.</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Entity ID</th>
                    <th className="py-3 px-3">Company Name (EN / AR)</th>
                    <th className="py-3 px-3">CR &amp; TAX Number</th>
                    <th className="py-3 px-3">Branch ID</th>
                    <th className="py-3 px-3">Entity Series (Prefix &amp; Suffix)</th>
                    <th className="py-3 px-3">Address &amp; Contact</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {entities.map((ent) => (
                    <tr key={ent.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-[#0d4f8b]">{ent.id}</td>
                      <td className="py-3 px-3">
                        <b className="font-bold text-slate-900 block">{ent.name}</b>
                        <span className="text-[10px] text-slate-500 font-arabic block">{ent.nameAr}</span>
                        <span className="text-[10px] text-purple-700 font-semibold">{ent.type}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-700 font-bold">{ent.crNum}</div>
                        <div className="font-mono text-emerald-800 font-bold text-[11px]">{ent.vatin}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{ent.branchId}</td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0d4f8b] px-2 py-0.5 rounded border border-blue-200 font-mono text-[10px] font-bold">
                            INV: {ent.invoicePrefix || 'INV-'}...{ent.invoiceSuffix || '/OM'}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200 font-mono text-[10px] font-bold block">
                            CN: {ent.creditNotePrefix || 'CN-'}...{ent.creditNoteSuffix || '/CN'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-600 max-w-[200px]">
                        <div>{ent.address}</div>
                        <div className="text-[10px] text-slate-400">{ent.email} · {ent.phone}</div>
                        <div className="text-[10px] text-[#0d4f8b]">Contact: {ent.contactPerson}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleEditEntityClick(ent)}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#0d4f8b] hover:bg-blue-50 rounded-lg transition-all cursor-pointer border border-slate-200"
                        >
                          Edit Entity
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Branch Directory — multiple outlets under one legal VATIN */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-700" />
                Operational Branches / Outlets (Same Legal Entity &amp; VATIN)
              </h3>
              <p className="text-xs text-slate-500">
                Use this for a standalone business such as one coffee-shop company with several locations. A branch is a reporting and numbering dimension only — it is not a subsidiary, VAT group member, tenant, or Peppol participant.
              </p>
            </div>

            {branchError ? <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-800">{branchError}</div> : null}

            <form onSubmit={handleSaveBranch} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block mb-1 font-bold text-emerald-950">Legal Company / VAT Registration *</label>
                  <select value={branchCompanyId} onChange={(event) => setBranchCompanyId(event.target.value)} required disabled={Boolean(editingBranchId)}
                    className="w-full rounded-xl border border-emerald-200 bg-white p-2.5 font-bold text-slate-800 disabled:bg-slate-100">
                    <option value="">Select company</option>
                    {entities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} · {entity.vatin}{entity.company_group ? ' (group company)' : ' (standalone)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div><label className="block mb-1 font-bold text-emerald-950">Branch Code *</label><input required value={branchCode} onChange={(event) => setBranchCode(event.target.value.toUpperCase())} placeholder="MCT-01" className="w-full rounded-xl border border-emerald-200 bg-white p-2.5 font-mono font-bold" /></div>
                <div><label className="block mb-1 font-bold text-emerald-950">Branch Name *</label><input required value={branchName} onChange={(event) => setBranchName(event.target.value)} placeholder="Muscat Main Coffee Shop" className="w-full rounded-xl border border-emerald-200 bg-white p-2.5 font-bold" /></div>
                <div><label className="block mb-1 font-bold text-slate-700">City</label><input value={branchCity} onChange={(event) => setBranchCity(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5" /></div>
                <div className="md:col-span-2"><label className="block mb-1 font-bold text-slate-700">Branch Address</label><input value={branchAddress} onChange={(event) => setBranchAddress(event.target.value)} placeholder="Mall / street / outlet address" className="w-full rounded-xl border border-slate-200 bg-white p-2.5" /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-blue-200 bg-white p-3 text-xs">
                <div><label className="block mb-1 font-bold text-blue-900">Invoice Prefix *</label><input required value={branchInvoicePrefix} onChange={(event) => setBranchInvoicePrefix(event.target.value)} placeholder="MCT-INV-" className="w-full rounded-lg border border-blue-200 p-2 font-mono font-bold" /></div>
                <div><label className="block mb-1 font-bold text-blue-900">Invoice Suffix</label><input value={branchInvoiceSuffix} onChange={(event) => setBranchInvoiceSuffix(event.target.value)} placeholder="/OM" className="w-full rounded-lg border border-blue-200 p-2 font-mono font-bold" /></div>
                <div><label className="block mb-1 font-bold text-purple-900">Credit Note Prefix *</label><input required value={branchCreditPrefix} onChange={(event) => setBranchCreditPrefix(event.target.value)} placeholder="MCT-CN-" className="w-full rounded-lg border border-purple-200 p-2 font-mono font-bold" /></div>
                <div><label className="block mb-1 font-bold text-purple-900">Credit Note Suffix</label><input value={branchCreditSuffix} onChange={(event) => setBranchCreditSuffix(event.target.value)} placeholder="/CN" className="w-full rounded-lg border border-purple-200 p-2 font-mono font-bold" /></div>
              </div>

              <div className="flex justify-end gap-2">
                {editingBranchId ? <button type="button" onClick={resetBranchForm} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold">Cancel</button> : null}
                <button type="submit" disabled={isSavingBranch} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                  {isSavingBranch ? 'Saving branch…' : editingBranchId ? 'Update Branch' : 'Add Branch'}
                </button>
              </div>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Company / VATIN</th><th className="p-3">Branch</th><th className="p-3">Location</th><th className="p-3">Numbering Series</th><th className="p-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-slate-400">No operational branches configured. Add the first outlet above.</td></tr> : branches.map((branch) => (
                    <tr key={branch.id}>
                      <td className="p-3"><b className="block text-slate-900">{branch.company_name}</b><span className="font-mono text-[10px] text-emerald-700">{branch.company_vatin}</span></td>
                      <td className="p-3"><b className="font-mono text-[#0d4f8b]">{branch.code}</b><span className="block font-bold text-slate-800">{branch.name}</span></td>
                      <td className="p-3 text-slate-600">{branch.city}<span className="block max-w-[220px] text-[10px] text-slate-400">{branch.address}</span></td>
                      <td className="p-3"><span className="block font-mono text-[10px] text-blue-800">INV: {branch.invoice_prefix}####{branch.invoice_suffix}</span><span className="block font-mono text-[10px] text-purple-800">CN: {branch.credit_note_prefix}####{branch.credit_note_suffix}</span></td>
                      <td className="p-3 text-right"><button type="button" onClick={() => handleEditBranch(branch)} className="mr-2 rounded-lg border border-blue-200 px-2.5 py-1.5 font-bold text-blue-700"><Edit3 className="mr-1 inline h-3.5 w-3.5" />Edit</button><button type="button" onClick={() => handleDeleteBranch(branch)} className="rounded-lg border border-red-200 px-2.5 py-1.5 font-bold text-red-700"><Trash2 className="mr-1 inline h-3.5 w-3.5" />Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add / Edit Entity Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#0d4f8b]" />
              <span>{editingEntityId ? `Update Legal Entity (${editingEntityId}) & Invoice Numbering Series` : 'Create New Legal Entity / Sub-Company'}</span>
            </h3>

            <form onSubmit={handleAddOrUpdateEntity} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {Object.keys(entityErrors).length > 0 ? (
                <div role="alert" className="sm:col-span-2 lg:col-span-3 rounded-xl border border-red-300 bg-red-50 p-3 text-red-900">
                  <b className="block text-sm">Company could not be saved</b>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {(Object.entries(entityErrors) as Array<[string, string[]]>).flatMap(([field, messages]) => messages.map((message) => (
                      <li key={`${field}-${message}`}><span className="font-mono font-bold">{field}</span>: {message}</li>
                    )))}
                  </ul>
                </div>
              ) : null}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Company Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhofar Logistics SAOC"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Company Name (Arabic)</label>
                <input
                  type="text"
                  placeholder="مثال: شركة ظفار للخدمات اللوجستية"
                  value={subNameAr}
                  onChange={(e) => setSubNameAr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-arabic text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Entity Classification Type</label>
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800"
                >
                  <option value="Parent Entity">Parent Entity (HQ)</option>
                  <option value="Subsidiary">Subsidiary</option>
                  <option value="Branch Entity">Branch Entity</option>
                  <option value="Joint Venture">Joint Venture</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">CR Number (Commercial Registration) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CR-1094821"
                  value={subCr}
                  onChange={(e) => setSubCr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">TAX / VAT Number (12-digit VATIN) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OM1100556677"
                  value={subVat}
                  onChange={(e) => { setSubVat(e.target.value.toUpperCase()); setEntityErrors((current) => ({ ...current, vatin: [] })); }}
                  aria-invalid={Boolean(entityErrors.vatin?.length)}
                  aria-describedby={entityErrors.vatin?.length ? 'company-vatin-error' : undefined}
                  className={`w-full bg-slate-50 border rounded-xl p-2.5 outline-none font-mono font-bold text-slate-800 ${entityErrors.vatin?.length ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200'}`}
                />
                {entityErrors.vatin?.length ? <p id="company-vatin-error" className="mt-1 text-[11px] font-semibold text-red-700">{entityErrors.vatin.join(' ')}</p> : null}
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Branch ID Code</label>
                <input
                  type="text"
                  placeholder="0000"
                  value={subBranch}
                  onChange={(e) => setSubBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-mono text-slate-800"
                />
              </div>

              {/* Entity Level Invoice Prefix & Suffix Configuration */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-[#0d4f8b] font-bold mb-1">Invoice Prefix (Entity Level)</label>
                  <input
                    type="text"
                    placeholder="INV-E1-"
                    value={subInvPrefix}
                    onChange={(e) => setSubInvPrefix(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-lg p-2 font-mono text-xs font-bold text-[#0d4f8b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#0d4f8b] font-bold mb-1">Invoice Suffix (Entity Level)</label>
                  <input
                    type="text"
                    placeholder="/OM"
                    value={subInvSuffix}
                    onChange={(e) => setSubInvSuffix(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-lg p-2 font-mono text-xs font-bold text-[#0d4f8b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-purple-900 font-bold mb-1">Credit Note Prefix</label>
                  <input
                    type="text"
                    placeholder="CN-E1-"
                    value={subCnPrefix}
                    onChange={(e) => setSubCnPrefix(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-lg p-2 font-mono text-xs font-bold text-purple-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-purple-900 font-bold mb-1">Credit Note Suffix</label>
                  <input
                    type="text"
                    placeholder="/CN"
                    value={subCnSuffix}
                    onChange={(e) => setSubCnSuffix(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-lg p-2 font-mono text-xs font-bold text-purple-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Contact Email Address</label>
                <input
                  type="email"
                  placeholder="tax@dhofar-logistics.om"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="+968 2300 1122"
                  value={subPhone}
                  onChange={(e) => setSubPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Authorized Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Salim Al-Kharusi"
                  value={subContact}
                  onChange={(e) => setSubContact(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-slate-600 font-bold mb-1">Registered Street Address</label>
                <input
                  type="text"
                  placeholder="Building 12, Way 2040, Raysut Industrial Zone, Salalah"
                  value={subAddress}
                  onChange={(e) => setSubAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
                {editingEntityId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntityId(null);
                      setSubName('');
                      setSubVat('');
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSavingEntity}
                  className="px-5 py-2.5 bg-[#0d4f8b] hover:bg-blue-900 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  {isSavingEntity ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>{isSavingEntity ? 'Saving…' : editingEntityId ? 'Save Entity Updates' : 'Add Legal Entity'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: VIEW SYSTEM LOGS */}
      {currentTab === 'sys_logs' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Server className="h-4 w-4 text-[#0d4f8b]" />
                  <span>System Execution, User Activity &amp; Transmission Logs</span>
                </h3>
                <p className="text-xs text-slate-500">Live execution traces, AS4 receipts, webhooks, and security audit trail.</p>
              </div>

              <button
                onClick={handleExportLogsCSV}
                className="px-3.5 py-2 bg-[#0d4f8b] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Export System Logs (CSV)</span>
              </button>
            </div>

            {/* Filter & Search Panel with Date & Time (From - To) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Calendar className="h-4 w-4 text-[#0d4f8b]" />
                  <span>Date &amp; Time Period Filter (From — To)</span>
                </div>

                {/* Quick Period Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Period:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFromDateTime('2026-07-29T00:00');
                      setToDateTime('2026-07-29T23:59');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-all shadow-2xs"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFromDateTime('2026-07-28T12:00');
                      setToDateTime('2026-07-29T23:59');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-all shadow-2xs"
                  >
                    Last 24h
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFromDateTime('2026-07-23T00:00');
                      setToDateTime('2026-07-29T23:59');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-all shadow-2xs"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFromDateTime('');
                      setToDateTime('');
                    }}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Clear Filter
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* From Date & Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#0d4f8b]" />
                    <span>From (Date &amp; Time)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={fromDateTime}
                    onChange={(e) => setFromDateTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0d4f8b]"
                  />
                </div>

                {/* To Date & Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#0d4f8b]" />
                    <span>To (Date &amp; Time)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={toDateTime}
                    onChange={(e) => setToDateTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0d4f8b]"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-[#0d4f8b]"
                  >
                    <option value="all">All Categories</option>
                    <option value="user">User Activities</option>
                    <option value="ota_peppol">OTA / Peppol AS4 Details</option>
                    <option value="server">Server &amp; REST Endpoints</option>
                    <option value="errors">Warnings &amp; Error Messages</option>
                  </select>
                </div>

                {/* Level Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Level</label>
                  <select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-[#0d4f8b]"
                  >
                    <option value="ALL">ALL Levels</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                    <option value="AS4">AS4 Transmission</option>
                    <option value="AUDIT">AUDIT</option>
                  </select>
                </div>
              </div>

              {/* Search Box & Active Period Status */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
                <div className="flex-1 max-w-md relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search log messages, users, trace details, or DD_MM_YY..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0d4f8b]"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-blue-100 text-[#0d4f8b] font-bold px-3 py-1 rounded-xl border border-blue-200">
                    {filteredLogs.length} Log Records Found
                  </span>
                  {fromDateTime || toDateTime ? (
                    <span className="font-mono text-slate-600 text-[11px] bg-slate-200/70 px-2.5 py-1 rounded-lg">
                      Period: {fromDateTime ? formatLogTimestamp(fromDateTime) : 'Start'} → {toDateTime ? formatLogTimestamp(toDateTime) : 'Now'}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Log ID</th>
                    <th className="py-2.5 px-3">Timestamp (DD_MM_YY : HH:MM)</th>
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Entity · User</th>
                    <th className="py-2.5 px-3">Log Event Message</th>
                    <th className="py-2.5 px-3">Trace Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-all">
                      <td className="py-2.5 px-3 font-bold text-[#0d4f8b]">{log.id}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#0d4f8b] shrink-0" />
                          <span className="bg-slate-100 text-[#0d4f8b] px-2 py-0.5 rounded-lg border border-slate-200 font-bold">
                            {formatLogTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono pl-5 mt-0.5">{log.timestamp}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.level === 'ERROR'
                              ? 'bg-red-100 text-red-800'
                              : log.level === 'WARN'
                              ? 'bg-amber-100 text-amber-800'
                              : log.level === 'AS4'
                              ? 'bg-blue-100 text-blue-900'
                              : log.level === 'AUDIT'
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <b className="font-bold text-slate-900 block">{log.user}</b>
                        <span className="text-[10px] text-slate-400">Entity: {log.entity}</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 max-w-[280px]">
                        {log.message}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-[220px] truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GENERAL CONFIGURATIONS */}
      {currentTab === 'gen_cfg' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-purple-600" />
                  <span>General System Configurations &amp; Technical Parameters</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure regional localization, security policies, administrative notification alerts, automated backup retention, and system maintenance windows.
                </p>
              </div>
              <span className="text-[11px] font-mono bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-full font-bold">
                Platform Admin v2.5.0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Box 1: Regional & Localization Setup */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <b className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#0d4f8b]" />
                  <span>1. Regional &amp; Localization Setup</span>
                </b>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Default Operating Country:</label>
                  <select
                    value={genCountry}
                    onChange={(e) => setGenCountry(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-none"
                  >
                    <option value="OM">🇴🇲 Sultanate of Oman (OM) — Primary</option>
                    <option value="AE">🇦🇪 United Arab Emirates (AE)</option>
                    <option value="SA">🇸🇦 Kingdom of Saudi Arabia (SA)</option>
                    <option value="QA">🇶🇦 State of Qatar (QA)</option>
                    <option value="KW">🇰🇼 State of Kuwait (KW)</option>
                    <option value="BH">🇧🇭 Kingdom of Bahrain (BH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">System Time Zone:</label>
                  <select
                    value={genTimeZone}
                    onChange={(e) => setGenTimeZone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-none font-mono"
                  >
                    <option value="Asia/Muscat">Asia/Muscat (UTC+04:00 GST)</option>
                    <option value="Asia/Riyadh">Asia/Riyadh (UTC+03:00 AST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (UTC+04:00 GST)</option>
                    <option value="UTC">UTC / GMT (Coordinated Universal Time)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Base Currency:</label>
                    <select
                      value={genCurrency}
                      onChange={(e) => setGenCurrency(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-800 outline-none"
                    >
                      <option value="OMR">OMR (ر.ع.)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="SAR">SAR (ر.س)</option>
                      <option value="AED">AED (د.إ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">FX Rate (1 USD =):</label>
                    <input
                      type="text"
                      value={genFxRate}
                      onChange={(e) => setGenFxRate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Language Setup &amp; Interface Mode:</label>
                  <select
                    value={genLanguage}
                    onChange={(e) => setGenLanguage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-none"
                  >
                    <option value="en-ar">Bilingual Dual Mode: English (EN) &amp; Arabic (العربية)</option>
                    <option value="en">English Only (EN Standard)</option>
                    <option value="ar">Arabic Only (اللغة العربية فقط)</option>
                  </select>
                </div>
              </div>

              {/* Box 2: MFA, Alerts & Security Controls */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <b className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>2. MFA, Security Alerts &amp; User Access</span>
                </b>

                <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <b className="text-slate-800 block">Enforce Multi-Factor Auth (MFA):</b>
                      <span className="text-[10px] text-slate-500">Require TOTP Authenticator app for all users</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableMfa}
                      onChange={(e) => setEnableMfa(e.target.checked)}
                      className="h-4 w-4 accent-[#0d4f8b] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <div>
                      <b className="text-slate-800 block">Enable Security Alerts:</b>
                      <span className="text-[10px] text-slate-500">Real-time alerts for unauthorized log attempts</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableAlerts}
                      onChange={(e) => setEnableAlerts(e.target.checked)}
                      className="h-4 w-4 accent-[#0d4f8b] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <div>
                      <b className="text-slate-800 block">Enable Alerts to Admin:</b>
                      <span className="text-[10px] text-slate-500">Dispatch SMS &amp; Email alerts on error/failure</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableAdminAlerts}
                      onChange={(e) => setEnableAdminAlerts(e.target.checked)}
                      className="h-4 w-4 accent-[#0d4f8b] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <div>
                      <b className="text-slate-800 block">Allow User Logins:</b>
                      <span className="text-[10px] text-slate-500">Global switch to enable/disable user portal login</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowLogin}
                      onChange={(e) => setAllowLogin(e.target.checked)}
                      className="h-4 w-4 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Admin Alert Notification Address / Phone:</label>
                  <input
                    type="text"
                    value={adminAlertContact}
                    onChange={(e) => setAdminAlertContact(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Notification Email Recipients:</label>
                  <textarea value={notificationEmails} onChange={(e) => setNotificationEmails(e.target.value)} rows={3}
                    placeholder="finance@company.om, tax@company.om, admin@company.om"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-800 outline-none" />
                  <p className="mt-1 text-[10px] text-slate-500">Separate multiple registered recipients with commas, semicolons, or new lines.</p>
                </div>
              </div>

              {/* Box 3: System Maintenance, Auto Backup & API */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <b className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-600" />
                  <span>3. Backups, Maintenance &amp; API Integration</span>
                </b>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <b className="text-slate-800 block">Enable Auto Backups:</b>
                      <span className="text-[10px] text-slate-500">Daily automated snapshot of Firestore &amp; XML logs</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableAutoBackups}
                      onChange={(e) => setEnableAutoBackups(e.target.checked)}
                      className="h-4 w-4 accent-purple-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Backup Retention Compliance</label>
                    <select
                      value={backupRetention}
                      onChange={(e) => setBackupRetention(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="7_years">7 Years (Oman Tax Law Executive Reg. Compliant)</option>
                      <option value="10_years">10 Years (Extended Corporate Audit Retention)</option>
                      <option value="indefinite">Indefinite (Permanent Cloud Archive)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">System Downtime / Maintenance Schedule:</label>
                  <input
                    type="text"
                    value={downtimeSchedule}
                    onChange={(e) => setDowntimeSchedule(e.target.value)}
                    placeholder="e.g. Sundays 02:00 - 04:00 GST"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-900 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Inbound Webhook Callback URL:</label>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button & Master API Key Row */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 w-full sm:w-auto">
                <Key className="h-4 w-4 text-slate-500" />
                <span className="font-bold text-slate-700">Master REST API Key:</span>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="bg-transparent font-mono text-xs text-slate-700 outline-none w-48 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <button
                onClick={saveGeneralConfig}
                className="w-full sm:w-auto px-6 py-3 bg-[#0d4f8b] hover:bg-blue-900 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Sliders className="h-4 w-4" />
                <span>Save All General Configurations</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
