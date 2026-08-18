import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Code2, Copy, Edit3, KeyRound, Plus, Server, Trash2 } from 'lucide-react';
import { apiFetch, formatApiErrors, unwrapList } from '../lib/api';
import { CompanyBranch, Entity, ErpDeliveryConfig } from '../types';
import { useConfirmation } from './ConfirmationDialog';

interface ErpDeliveryConfigPanelProps {
  companyId: string;
  selectedGroup: string;
  entities: Entity[];
  branches: CompanyBranch[];
  canManage: boolean;
}

const DEFAULT_HEADERS = '{\n  "X-Client-System": "Faturathi"\n}';
const DEFAULT_PAYLOAD = '{\n  "invoiceNumber": "{{invoice_number}}",\n  "supplierName": "{{supplier_name}}",\n  "supplierVATIN": "{{supplier_vatin}}",\n  "issueDate": "{{issue_date}}",\n  "currency": "{{currency}}",\n  "netAmount": "{{net_amount}}",\n  "vatAmount": "{{vat_amount}}",\n  "grossAmount": "{{gross_amount}}",\n  "lines": "{{lines}}"\n}';

export const ErpDeliveryConfigPanel: React.FC<ErpDeliveryConfigPanelProps> = ({
  companyId,
  selectedGroup,
  entities,
  branches,
  canManage,
}) => {
  const [confirmAction, confirmationDialog] = useConfirmation();
  const [configs, setConfigs] = useState<ErpDeliveryConfig[]>([]);
  const [editingId, setEditingId] = useState('');
  const [scope, setScope] = useState<'COMPANY' | 'BRANCH'>('COMPANY');
  const [branchId, setBranchId] = useState('');
  const [name, setName] = useState('Central ERP AP Connector');
  const [baseUrl, setBaseUrl] = useState('https://erp.example.com');
  const [endpointPath, setEndpointPath] = useState('/api/accounts-payable/invoices');
  const [httpMethod, setHttpMethod] = useState<'POST' | 'PUT' | 'PATCH'>('POST');
  const [authType, setAuthType] = useState<ErpDeliveryConfig['auth_type']>('BEARER');
  const [authHeaderName, setAuthHeaderName] = useState('Authorization');
  const [authToken, setAuthToken] = useState('');
  const [username, setUsername] = useState('');
  const [headersJson, setHeadersJson] = useState(DEFAULT_HEADERS);
  const [payloadJson, setPayloadJson] = useState(DEFAULT_PAYLOAD);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const company = entities.find((entity) => entity.id === companyId);
  const companyBranches = useMemo(
    () => branches.filter((branch) => branch.company === companyId),
    [branches, companyId],
  );

  const scopedHeaders = {
    'X-Company-ID': companyId,
    'X-Business-Group-ID': selectedGroup,
  };

  const loadConfigs = async () => {
    if (!canManage || !companyId) {
      setConfigs([]);
      return;
    }
    setIsLoading(true);
    setErrorMessages([]);
    try {
      const payload = await apiFetch<ErpDeliveryConfig[] | { results?: ErpDeliveryConfig[] }>(
        `/api/erp-delivery-configs?company=${encodeURIComponent(companyId)}&page_size=100`,
        { headers: scopedHeaders },
      );
      setConfigs(unwrapList(payload));
    } catch (error) {
      setErrorMessages(formatApiErrors(error, 'ERP delivery configurations could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadConfigs();
  }, [canManage, companyId, selectedGroup]);

  const resetForm = () => {
    setEditingId('');
    setScope('COMPANY');
    setBranchId('');
    setName('Central ERP AP Connector');
    setBaseUrl('https://erp.example.com');
    setEndpointPath('/api/accounts-payable/invoices');
    setHttpMethod('POST');
    setAuthType('BEARER');
    setAuthHeaderName('Authorization');
    setAuthToken('');
    setUsername('');
    setHeadersJson(DEFAULT_HEADERS);
    setPayloadJson(DEFAULT_PAYLOAD);
    setTimeoutSeconds(30);
    setIsActive(true);
    setMessage('');
    setErrorMessages([]);
  };

  const editConfig = (config: ErpDeliveryConfig) => {
    setEditingId(config.id);
    setScope(config.branch ? 'BRANCH' : 'COMPANY');
    setBranchId(config.branch || '');
    setName(config.name);
    setBaseUrl(config.base_url);
    setEndpointPath(config.endpoint_path);
    setHttpMethod(config.http_method);
    setAuthType(config.auth_type);
    setAuthHeaderName(config.auth_header_name);
    setAuthToken('');
    setUsername(config.username || '');
    setHeadersJson(JSON.stringify(config.custom_headers || {}, null, 2));
    setPayloadJson(JSON.stringify(config.payload_template || {}, null, 2));
    setTimeoutSeconds(config.timeout_seconds || 30);
    setIsActive(config.is_active);
    setMessage('Secret values are masked. Leave the token blank to keep the existing secret.');
    setErrorMessages([]);
  };

  const curlPreview = useMemo(() => {
    const target = `${baseUrl.replace(/\/$/, '')}/${endpointPath.replace(/^\//, '')}`;
    const auth = authType === 'NONE' ? '' : ` \\\n+  --header '${authHeaderName}: <configured-secret>'`;
    return `curl --request ${httpMethod} '${target}' \\\n+  --header 'Content-Type: application/json'${auth} \\\n+  --data '<mapped AP invoice payload>'`;
  }, [authHeaderName, authType, baseUrl, endpointPath, httpMethod]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessages([]);
    setMessage('');
    if (scope === 'BRANCH' && !branchId) {
      setErrorMessages(['Select the operational branch for this ERP target.']);
      return;
    }
    let customHeaders: Record<string, string>;
    let payloadTemplate: Record<string, unknown>;
    try {
      customHeaders = JSON.parse(headersJson);
      payloadTemplate = JSON.parse(payloadJson);
      if (Array.isArray(customHeaders) || Array.isArray(payloadTemplate)) throw new Error('JSON objects are required.');
    } catch (error) {
      setErrorMessages([error instanceof Error ? `Headers or payload JSON is invalid: ${error.message}` : 'Headers or payload JSON is invalid.']);
      return;
    }
    const confirmed = await confirmAction({
      title: editingId ? 'Update ERP delivery target?' : 'Create ERP delivery target?',
      description: `${name} · ${scope === 'BRANCH' ? companyBranches.find((branch) => branch.id === branchId)?.name || 'Branch' : 'Company centralized ERP'}`,
      detail: 'Approved AP invoices can use this target for customer ERP delivery. Authentication secrets are never returned by the API.',
      confirmLabel: editingId ? 'Update configuration' : 'Create configuration',
      kind: 'create',
    });
    if (!confirmed) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        company: companyId,
        branch: scope === 'BRANCH' ? branchId : null,
        name,
        base_url: baseUrl,
        endpoint_path: endpointPath,
        http_method: httpMethod,
        auth_type: authType,
        auth_header_name: authHeaderName,
        username,
        custom_headers: customHeaders,
        payload_template: payloadTemplate,
        timeout_seconds: timeoutSeconds,
        is_active: isActive,
      };
      if (authToken) body.auth_token = authToken;
      await apiFetch(editingId ? `/api/erp-delivery-configs/${editingId}` : '/api/erp-delivery-configs', {
        method: editingId ? 'PATCH' : 'POST',
        headers: scopedHeaders,
        body: JSON.stringify(body),
      });
      resetForm();
      setMessage('ERP delivery configuration saved successfully.');
      await loadConfigs();
    } catch (error) {
      setErrorMessages(formatApiErrors(error, 'ERP delivery configuration could not be saved.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (config: ErpDeliveryConfig) => {
    const confirmed = await confirmAction({
      title: 'Delete ERP delivery target?',
      description: `${config.name} · ${config.branch_name || 'Company centralized ERP'}`,
      detail: 'Future AP approvals will no longer use this configuration. Existing invoice history remains unchanged.',
      confirmLabel: 'Delete configuration',
      kind: 'danger',
    });
    if (!confirmed) return;
    try {
      await apiFetch(`/api/erp-delivery-configs/${config.id}`, { method: 'DELETE', headers: scopedHeaders });
      if (editingId === config.id) resetForm();
      await loadConfigs();
    } catch (error) {
      setErrorMessages(formatApiErrors(error, 'ERP delivery configuration could not be deleted.'));
    }
  };

  if (!canManage) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950"><b className="block">Restricted technical configuration</b><span className="mt-1 block text-xs">Only platform super administrators and ADMIN users designated as technical, dealer, or support staff can view or change customer ERP credentials.</span></div>;
  }

  if (!companyId) {
    return <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm font-semibold text-blue-950">Select one supplier company in the header before configuring its ERP delivery targets.</div>;
  }

  return (
    <div className="space-y-5">
      {confirmationDialog}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="flex items-center gap-2 text-base font-black text-[#0d4f8b]"><Server className="h-5 w-5" />AP Invoice → Customer ERP Delivery</h3><p className="mt-1 text-xs text-slate-600">Configure one centralized company endpoint, then override it for branches using different ERP or billing systems.</p></div><span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-bold text-emerald-800">{company?.name || 'Selected company'} · {configs.length} target{configs.length === 1 ? '' : 's'}</span></div>
      </div>

      {errorMessages.length ? <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-900"><ul className="list-disc space-y-1 pl-5">{errorMessages.map((error) => <li key={error}>{error}</li>)}</ul></div> : null}
      {message ? <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4" />{message}</div> : null}

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between"><h4 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Plus className="h-4 w-4 text-blue-700" />{editingId ? 'Edit ERP target' : 'Add ERP target'}</h4>{editingId ? <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">Cancel edit</button> : null}</div>
        <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2 lg:grid-cols-4">
          <div><label className="mb-1 block font-bold text-slate-700">Configuration Scope</label><select value={scope} onChange={(event) => { setScope(event.target.value as 'COMPANY' | 'BRANCH'); setBranchId(''); }} disabled={Boolean(editingId)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold"><option value="COMPANY">Company centralized ERP</option><option value="BRANCH">Branch-specific override</option></select></div>
          <div><label className="mb-1 block font-bold text-slate-700">Operational Branch</label><select value={branchId} onChange={(event) => setBranchId(event.target.value)} disabled={scope !== 'BRANCH' || Boolean(editingId)} required={scope === 'BRANCH'} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 disabled:opacity-60"><option value="">{scope === 'BRANCH' ? 'Select branch' : 'Not applicable'}</option>{companyBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.code} — {branch.name}</option>)}</select></div>
          <div className="lg:col-span-2"><label className="mb-1 block font-bold text-slate-700">ERP / Billing System Name *</label><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="SAP S/4HANA Central AP" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold" /></div>
          <div className="md:col-span-2"><label className="mb-1 block font-bold text-slate-700">API Base URL *</label><input required type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://erp.customer.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono" /></div>
          <div><label className="mb-1 block font-bold text-slate-700">Endpoint Path *</label><input required value={endpointPath} onChange={(event) => setEndpointPath(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono" /></div>
          <div><label className="mb-1 block font-bold text-slate-700">HTTP Method</label><select value={httpMethod} onChange={(event) => setHttpMethod(event.target.value as 'POST' | 'PUT' | 'PATCH')} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold"><option>POST</option><option>PUT</option><option>PATCH</option></select></div>
          <div><label className="mb-1 block font-bold text-slate-700">Authentication</label><select value={authType} onChange={(event) => setAuthType(event.target.value as ErpDeliveryConfig['auth_type'])} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold"><option value="NONE">None</option><option value="BEARER">Bearer token</option><option value="API_KEY">API key header</option><option value="BASIC">Basic authentication</option><option value="OAUTH2">OAuth 2 token</option></select></div>
          <div><label className="mb-1 block font-bold text-slate-700">Auth Header Name</label><input value={authHeaderName} onChange={(event) => setAuthHeaderName(event.target.value)} disabled={authType === 'NONE'} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono disabled:opacity-50" /></div>
          <div><label className="mb-1 block font-bold text-slate-700">Username / Client ID</label><input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" /></div>
          <div><label className="mb-1 block font-bold text-slate-700">Secret / Token {editingId ? '(blank keeps current)' : ''}</label><div className="relative"><KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="password" value={authToken} onChange={(event) => setAuthToken(event.target.value)} disabled={authType === 'NONE'} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 font-mono disabled:opacity-50" /></div></div>
          <div><label className="mb-1 block font-bold text-slate-700">Timeout (seconds)</label><input type="number" min={1} max={300} value={timeoutSeconds} onChange={(event) => setTimeoutSeconds(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" /></div>
          <label className="flex items-center gap-2 self-end rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 font-bold text-emerald-900"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />Active delivery target</label>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2"><div><label className="mb-1 block text-xs font-bold text-slate-700">Custom Headers (JSON)</label><textarea rows={8} value={headersJson} onChange={(event) => setHeadersJson(event.target.value)} spellCheck={false} className="w-full rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-emerald-300" /></div><div><label className="mb-1 block text-xs font-bold text-slate-700">AP Payload Mapping Template (JSON)</label><textarea rows={8} value={payloadJson} onChange={(event) => setPayloadJson(event.target.value)} spellCheck={false} className="w-full rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-blue-200" /></div></div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-xs text-slate-200"><div className="mb-2 flex items-center justify-between"><b className="flex items-center gap-2 text-emerald-300"><Code2 className="h-4 w-4" />Generated cURL Preview</b><button type="button" onClick={() => navigator.clipboard.writeText(curlPreview)} className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-[10px] font-bold"><Copy className="h-3 w-3" />Copy</button></div><pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{curlPreview}</pre></div>
        <div className="flex justify-end"><button type="submit" disabled={isSaving} className="rounded-xl bg-gradient-to-r from-[#0d4f8b] to-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50">{isSaving ? 'Saving…' : editingId ? 'Update ERP Configuration' : 'Save ERP Configuration'}</button></div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Scope</th><th className="p-3">ERP Target</th><th className="p-3">Endpoint</th><th className="p-3">Auth</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={6} className="p-6 text-center text-slate-400">Loading ERP targets…</td></tr> : configs.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-slate-400">No ERP delivery configuration exists for this company.</td></tr> : configs.map((config) => <tr key={config.id}><td className="p-3"><b className="text-slate-900">{config.branch ? `${config.branch_code} — ${config.branch_name}` : 'Company centralized'}</b></td><td className="p-3 font-bold text-[#0d4f8b]">{config.name}</td><td className="max-w-xs p-3 font-mono text-[10px] text-slate-600">{config.http_method} {config.base_url}{config.endpoint_path}</td><td className="p-3"><span className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px]">{config.auth_type}</span>{config.token_configured ? <span className="ml-1 text-emerald-700">● Secret set</span> : null}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${config.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{config.is_active ? 'Active' : 'Disabled'}</span></td><td className="whitespace-nowrap p-3 text-right"><button type="button" onClick={() => editConfig(config)} className="mr-2 rounded-lg border border-blue-200 px-2.5 py-1.5 font-bold text-blue-700"><Edit3 className="mr-1 inline h-3.5 w-3.5" />Edit</button><button type="button" onClick={() => handleDelete(config)} className="rounded-lg border border-red-200 px-2.5 py-1.5 font-bold text-red-700"><Trash2 className="mr-1 inline h-3.5 w-3.5" />Delete</button></td></tr>)}</tbody></table></div>
    </div>
  );
};
