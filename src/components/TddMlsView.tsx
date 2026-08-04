import React, { useState } from 'react';
import { Invoice, canEditInvoice } from '../types';
import { Clock, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, Code, Terminal, Copy, Check, Play, FileJson, Search, Filter, Layers, Edit, Send, Lock, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { validateOmanInvoice, OmanValidationResult, FieldEvaluation, GROUPS_INFO } from '../lib/omanValidator';
import { EditInvoiceModal } from './EditInvoiceModal';

interface TddMlsViewProps {
  invoices: Invoice[];
  onTriggerTddSubmit: (n: string) => void;
  onSaveAndResendInvoice?: (updatedInvoice: Invoice) => void;
}

const SAMPLE_JSON_PAYLOAD = `{
  "BTOM_001_OmanTransactionType": "10000000000000000000",
  "BTOM_002_InvoiceUUID": "a1b2c3d4-e5f6-5789-a1b2-c3d4e5f67890",
  "IBT_001_InvoiceNumber": "IIS-2026-07-0042",
  "IBT_002_InvoiceIssueDate": "2026-07-29",
  "IBT_168_InvoiceIssueTime": "10:14:22",
  "IBT_003_InvoiceTypeCode": "380",
  "IBT_024_SpecificationIdentifier": "urn:peppol:pint:billing-1@om-1",
  "IBT_023_BusinessProcessType": "urn:peppol:bis:billing",
  "IBT_005_InvoiceCurrencyCode": "OMR",
  "IBT_006_VATAccountingCurrency": "OMR",
  "SellerDetails": {
    "IBT_027_SellerName": "International Intelligence Solutions LLC",
    "IBT_034_SellerIdentifier": "OM1100123456",
    "IBT_034_1_SellerIdentifierScheme": "0248",
    "IBT_031_SellerVATIdentifier": "OM1100123456",
    "IBT_031_1_SellerVATScheme": "VAT",
    "IBT_035_SellerAddressLine1": "Al Khuwair Street 12",
    "IBT_037_SellerCity": "Muscat",
    "IBT_038_SellerPostCode": "112",
    "IBT_040_SellerCountryCode": "OM"
  },
  "BuyerDetails": {
    "IBT_044_BuyerName": "Johnson & Co. Ltd (Oman)",
    "IBT_049_BuyerIdentifier": "OM1100654321",
    "IBT_049_1_BuyerIdentifierScheme": "0248",
    "IBT_048_BuyerVATIdentifier": "OM1100654321",
    "IBT_048_1_BuyerVATScheme": "VAT",
    "IBT_050_BuyerAddressLine1": "Ruwi High Street 44",
    "IBT_052_BuyerCity": "Muscat",
    "IBT_053_BuyerPostCode": "111",
    "IBT_055_BuyerCountryCode": "OM"
  },
  "Totals": {
    "IBT_106_SumLineNetAmount": 4500.00,
    "IBT_110_InvoiceTotalVATAmount": 225.00,
    "IBT_112_InvoiceTotalAmountWithVAT": 4725.00
  },
  "Lines": [
    {
      "IBT_126_LineIdentifier": "1",
      "IBT_129_InvoicedQuantity": 1,
      "IBT_131_LineNetAmount": 3500.00,
      "IBT_153_ItemName": "Enterprise AI Cloud Platform Connector",
      "IBT_151_ItemVATCategoryCode": "S",
      "IBT_152_ItemVATRate": 5.00,
      "IBT_146_ItemNetPrice": 3500.00
    },
    {
      "IBT_126_LineIdentifier": "2",
      "IBT_129_InvoicedQuantity": 1,
      "IBT_131_LineNetAmount": 1000.00,
      "IBT_153_ItemName": "Annual Maintenance & SLA Support",
      "IBT_151_ItemVATCategoryCode": "S",
      "IBT_152_ItemVATRate": 5.00,
      "IBT_146_ItemNetPrice": 1000.00
    }
  ]
}`;

export const TddMlsView: React.FC<TddMlsViewProps> = ({ invoices, onTriggerTddSubmit, onSaveAndResendInvoice }) => {
  const [activeTab, setActiveTab] = useState<'tdd' | 'mls' | 'validator'>('validator');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [jsonInput, setJsonInput] = useState<string>(SAMPLE_JSON_PAYLOAD);
  const [validationResult, setValidationResult] = useState<OmanValidationResult | null>(() => {
    try {
      return validateOmanInvoice(JSON.parse(SAMPLE_JSON_PAYLOAD));
    } catch (e) {
      return null;
    }
  });
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Inspector filters
  const [groupFilter, setGroupFilter] = useState<number>(0); // 0 = All Groups
  const [fieldSearch, setFieldSearch] = useState('');

  // TDD Queue Search, Filter & Pagination State
  const [tddSearchQuery, setTddSearchQuery] = useState('');
  const [tddEntityFilter, setTddEntityFilter] = useState('ALL');
  const [tddStatusFilter, setTddStatusFilter] = useState('ALL');
  const [tddCurrentPage, setTddCurrentPage] = useState(1);
  const [tddItemsPerPage, setTddItemsPerPage] = useState(5);

  const filteredTddInvoices = invoices.filter((inv) => {
    const q = tddSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.n.toLowerCase().includes(q) ||
      inv.uuid.toLowerCase().includes(q) ||
      inv.cp.toLowerCase().includes(q) ||
      (inv.cpv && inv.cpv.toLowerCase().includes(q)) ||
      (inv.sourceChannel && inv.sourceChannel.toLowerCase().includes(q)) ||
      (inv.erpSystem && inv.erpSystem.toLowerCase().includes(q));

    const matchesEntity = tddEntityFilter === 'ALL' || inv.ent === tddEntityFilter;
    const matchesStatus =
      tddStatusFilter === 'ALL' ||
      (tddStatusFilter === 'Reported' && inv.st === 'Reported') ||
      (tddStatusFilter === 'Rejected' && inv.st === 'Rejected') ||
      (tddStatusFilter === 'Pending' && inv.st !== 'Reported' && inv.st !== 'Rejected');

    return matchesSearch && matchesEntity && matchesStatus;
  });

  const totalTddPages = Math.ceil(filteredTddInvoices.length / tddItemsPerPage) || 1;
  const paginatedTddInvoices = filteredTddInvoices.slice(
    (tddCurrentPage - 1) * tddItemsPerPage,
    tddCurrentPage * tddItemsPerPage
  );

  const handleRunValidation = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const res = validateOmanInvoice(parsed);
      setValidationResult(res);
    } catch (err: any) {
      alert('Invalid JSON input syntax: ' + err.message);
    }
  };

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const postmanCurlSnippet = `curl -X POST "${hostUrl}/api/validate" \\
  -H "Content-Type: application/json" \\
  -d '${jsonInput.replace(/'/g, "\\'")}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(postmanCurlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1500);
  };

  // Filtered field evaluations
  const filteredFields = (validationResult?.fieldEvaluations || []).filter(field => {
    const matchesGroup = groupFilter === 0 || field.group === groupFilter;
    const matchesSearch =
      field.id.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      field.name.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      field.ubl.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      String(field.value).toLowerCase().includes(fieldSearch.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span>
            73-Field Validator &amp; Network Monitor{' '}
            <span className="text-sm font-normal text-slate-500 font-arabic">التحقق والشبكات</span>
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Perform live 73-field PINT OM Schematron validation testing for Postman/REST clients, or monitor <b>TDD C5 queues</b> &amp; <b>MLS logs</b>.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('validator')}
          className={`py-2 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === 'validator' ? 'text-[#0d4f8b] border-[#0d4f8b]' : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          <FileJson className="h-4 w-4" />
          <span>73-Field Invoice Validator (REST API / Postman)</span>
        </button>
        <button
          onClick={() => setActiveTab('tdd')}
          className={`py-2 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'tdd' ? 'text-[#0d4f8b] border-[#0d4f8b]' : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          TDD Queue &amp; SLA Monitor (C5 Leg)
        </button>
        <button
          onClick={() => setActiveTab('mls')}
          className={`py-2 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'mls' ? 'text-[#0d4f8b] border-[#0d4f8b]' : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          MLS Logs Register (AP, AB, RE Messages)
        </button>
      </div>

      {activeTab === 'validator' && (
        <div className="space-y-6">
          {/* Endpoint Banner */}
          <div className="bg-[#082f54] text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded uppercase font-mono">
                  POST
                </span>
                <code className="text-xs font-mono font-bold text-emerald-300">{hostUrl}/api/validate</code>
                <span className="text-white/60 text-xs">(or /api/validate-oman)</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Endpoint for Postman &amp; ERP webhooks. Test JSON invoices directly below or copy Postman cURL command.
              </p>
            </div>
            <button
              onClick={handleCopyCurl}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {copiedCurl ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedCurl ? 'cURL Copied!' : 'Copy Postman cURL'}</span>
            </button>
          </div>

          {/* Interactive Editor & Validation Output Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input JSON Editor */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Code className="h-4 w-4 text-[#0d4f8b]" />
                  <span>Input JSON Invoice Payload</span>
                </h3>
                <button
                  onClick={handleRunValidation}
                  className="px-3 py-1.5 bg-[#0d4f8b] hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Run Validation Check</span>
                </button>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={18}
                className="w-full font-mono text-xs p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-[#0d4f8b] resize-none leading-relaxed"
                placeholder="Paste JSON invoice here..."
              />
            </div>

            {/* Validation Results Display */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span>73-Field Validation Engine Results</span>
                {validationResult && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      validationResult.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {validationResult.isValid ? 'PASSED · VALID PINT OM' : 'FAILED · STRUCTURAL ISSUES'}
                  </span>
                )}
              </h3>

              {validationResult ? (
                <div className="space-y-4 text-xs">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Passed Fields</span>
                      <b className="text-lg text-emerald-700 font-black">
                        {validationResult.passedCount} / {validationResult.totalMandatoryCount}
                      </b>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Errors Found</span>
                      <b className={`text-lg font-black ${validationResult.errors.length > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        {validationResult.errors.length}
                      </b>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">UUIDv5 Verification</span>
                      <b className="text-xs font-mono font-bold text-[#0d4f8b] block mt-1 truncate">
                        {validationResult.uuidV5Match ? 'MATCHED ✓' : 'GENERATED'}
                      </b>
                    </div>
                  </div>

                  {/* Errors List if any */}
                  {validationResult.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-2">
                      <b className="font-bold block text-red-950 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span>Validation Errors ({validationResult.errors.length})</span>
                      </b>
                      <ul className="space-y-1.5 pl-2">
                        {validationResult.errors.map((err, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] font-mono">
                            <span className="px-1.5 py-0.2 bg-red-200 text-red-950 rounded font-bold shrink-0">{err.fieldId}</span>
                            <span>{err.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Groups Breakdown */}
                  <div className="space-y-2">
                    <b className="text-slate-700 font-bold block">Section Breakdown (PINT OM 73-Field Groups):</b>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(validationResult.groupsStatus || {}).map(([grpId, grpData]) => {
                        const grp = grpData as { name: string; total: number; passed: number; errors: number };
                        return (
                          <div key={grpId} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-800 truncate max-w-[140px]">{grp.name}</span>
                            <span className="font-mono font-bold text-slate-700 shrink-0">
                              {grp.passed}/{grp.total}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 font-medium">
                  Click &quot;Run Validation Check&quot; to test payload.
                </div>
              )}
            </div>
          </div>

          {/* Full 73-Field Compliance Inspection Table */}
          {validationResult && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#0d4f8b]" />
                    <span>Comprehensive PINT-OM 73-Field Compliance Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed inspection of all 73 fields defined in the Oman Tax Authority (OTA) specification.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter 73 fields..."
                      value={fieldSearch}
                      onChange={(e) => setFieldSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none text-slate-800 font-medium"
                    />
                  </div>

                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none text-slate-800 font-bold"
                  >
                    <option value={0}>All 8 Groups (73 Fields)</option>
                    <option value={1}>Group 1 — Metadata (11)</option>
                    <option value={2}>Group 2 — Seller (12)</option>
                    <option value={3}>Group 3 — Buyer (11)</option>
                    <option value={4}>Group 4 — Payment (4)</option>
                    <option value={5}>Group 5 — Allowances (3)</option>
                    <option value={6}>Group 6 — Totals (8)</option>
                    <option value={7}>Group 7 — VAT (7)</option>
                    <option value={8}>Group 8 — Lines (17)</option>
                  </select>
                </div>
              </div>

              {/* Fields Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[500px]">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Field ID</th>
                      <th className="py-2.5 px-3">Field Name</th>
                      <th className="py-2.5 px-3">UBL XML Element</th>
                      <th className="py-2.5 px-3">Extracted Value</th>
                      <th className="py-2.5 px-3 text-center">Mandatory?</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredFields.map((field) => (
                      <tr key={field.id} className="hover:bg-slate-50 transition-all">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{field.num}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0d4f8b]">{field.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {field.name}
                          <span className="block text-[10px] text-slate-400 font-normal">{field.notes}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-purple-700 bg-purple-50/50 rounded max-w-[180px] truncate">
                          {field.ubl}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800 font-bold max-w-[200px] truncate">
                          {String(field.value)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {field.isMandatory ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[9px] font-extrabold rounded-full">Mandatory</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full">Optional</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                              field.status === 'Passed'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : field.status === 'Missing'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {field.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tdd' && (
        <div className="space-y-4">
          {/* SLA Overview Bar */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <b className="font-bold text-sm">PASR Annex A Compliance: 99.8% On-Time TDD Reporting</b>
                <p className="text-xs text-emerald-800">
                  Mandatory window: <b>15 minutes</b> for B2B invoices · <b>30 minutes</b> for B2C invoices.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-2xs">
              SLA Compliant
            </span>
          </div>

          {/* Search, Filter & Controls Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Search Bar */}
              <div className="sm:col-span-2 relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Invoice №, Counterparty, UUID, Source Channel..."
                  value={tddSearchQuery}
                  onChange={(e) => {
                    setTddSearchQuery(e.target.value);
                    setTddCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none font-medium text-slate-800 focus:border-[#0d4f8b] shadow-2xs"
                />
              </div>

              {/* Entity Filter */}
              <div>
                <select
                  value={tddEntityFilter}
                  onChange={(e) => {
                    setTddEntityFilter(e.target.value);
                    setTddCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-slate-800 focus:border-[#0d4f8b] shadow-2xs"
                >
                  <option value="ALL">All Legal Entities (Tenant)</option>
                  <option value="E1">E1 — Intl. Intelligence Solutions</option>
                  <option value="E2">E2 — Aji Alibri Enterprises</option>
                  <option value="E3">E3 — Alfaris Business Solutions</option>
                </select>
              </div>

              {/* TDD Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={tddStatusFilter}
                  onChange={(e) => {
                    setTddStatusFilter(e.target.value);
                    setTddCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-slate-800 focus:border-[#0d4f8b] shadow-2xs"
                >
                  <option value="ALL">All TDD Statuses</option>
                  <option value="Reported">Cleared / Reported (OTA Ack)</option>
                  <option value="Rejected">Rejected (Schematron Error)</option>
                  <option value="Pending">Pending Clearance Queue</option>
                </select>

                {(tddSearchQuery || tddEntityFilter !== 'ALL' || tddStatusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setTddSearchQuery('');
                      setTddEntityFilter('ALL');
                      setTddStatusFilter('ALL');
                      setTddCurrentPage(1);
                    }}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer shrink-0"
                    title="Reset TDD filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Queue Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Invoice № / UUID</th>
                    <th className="py-3 px-3">Direction · Entity</th>
                    <th className="py-3 px-3">Created / Received Timestamp</th>
                    <th className="py-3 px-3">SLA Countdown</th>
                    <th className="py-3 px-3">TDD Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedTddInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No TDD queue items match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedTddInvoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-all">
                        <td className="py-3 px-3">
                          <b className="font-bold text-slate-900 block">{inv.n}</b>
                          <span className="text-[10px] text-slate-400 font-mono">{inv.uuid.slice(0, 18)}...</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">{inv.dir}</span>
                          <span className="text-[10px] text-[#0d4f8b] font-medium">
                            {inv.ent === 'E3' ? 'Alfaris Business' : inv.ent === 'E2' ? 'Aji Alibri' : 'Intl. Intelligence'}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-medium text-slate-900 block">
                            Issued: {inv.d} {inv.t}
                          </span>
                          <span className="text-[10px] text-[#0d4f8b] font-mono font-semibold block mt-0.5" title="Creation or REST API Ingestion Timestamp">
                            ⏱️ Received: {inv.createdAt ? (inv.createdAt.includes('T') ? inv.createdAt.replace('T', ' ').slice(0, 19) : inv.createdAt) : `${inv.d} ${inv.t}`}
                          </span>
                          <span className="inline-block mt-0.5 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono border border-slate-200">
                            {inv.sourceChannel || 'REST API'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {inv.st === 'Reported' ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" /> Delivered in 1.4 min
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> 11m 45s remaining
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              inv.st === 'Reported' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : inv.st === 'Rejected' 
                                ? 'bg-red-100 text-red-800 border border-red-300' 
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.tdd}
                          </span>
                          {inv.err && (
                            <span className="block mt-1 text-[10px] text-red-700 bg-red-50 p-1 rounded border border-red-200 font-mono truncate max-w-[200px]" title={inv.err}>
                              ⚠️ {inv.err.slice(0, 45)}...
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {canEditInvoice(inv) ? (
                              <button
                                onClick={() => setEditingInvoice(inv)}
                                className="px-2.5 py-1 bg-[#0d4f8b] hover:bg-blue-900 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Edit invoice fields & re-submit to OTA"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Edit Invoice Data</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg inline-flex items-center gap-1 cursor-default" title="Invoice submitted to OTA/Peppol cannot be edited or deleted">
                                <Lock className="h-3 w-3 text-emerald-600" />
                                <span>Locked (Submitted)</span>
                              </span>
                            )}

                            {!canEditInvoice(inv) ? null : inv.st !== 'Reported' && (
                              <button
                                onClick={() => onTriggerTddSubmit(inv.n)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Directly re-submit TDD payload"
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span>Submit TDD Now</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredTddInvoices.length > 0 && (
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {/* Count Summary */}
                <div className="text-slate-600 font-medium">
                  Showing <b className="text-slate-900 font-bold">{Math.min((tddCurrentPage - 1) * tddItemsPerPage + 1, filteredTddInvoices.length)}</b> to{' '}
                  <b className="text-slate-900 font-bold">{Math.min(tddCurrentPage * tddItemsPerPage, filteredTddInvoices.length)}</b> of{' '}
                  <b className="text-slate-900 font-bold">{filteredTddInvoices.length}</b> queue items
                </div>

                {/* Per Page Selector & Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium text-[11px]">Per page:</span>
                    <select
                      value={tddItemsPerPage}
                      onChange={(e) => {
                        setTddItemsPerPage(Number(e.target.value));
                        setTddCurrentPage(1);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-xs font-bold text-slate-800 shadow-2xs"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {/* Page Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTddCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={tddCurrentPage === 1}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 shadow-2xs text-xs">
                      Page {tddCurrentPage} of {totalTddPages}
                    </span>

                    <button
                      onClick={() => setTddCurrentPage((p) => Math.min(p + 1, totalTddPages))}
                      disabled={tddCurrentPage >= totalTddPages}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        invoice={editingInvoice}
        isOpen={Boolean(editingInvoice)}
        onClose={() => setEditingInvoice(null)}
        onSaveAndResend={(updated) => {
          if (onSaveAndResendInvoice) {
            onSaveAndResendInvoice(updated);
          } else {
            onTriggerTddSubmit(updated.n);
          }
          setEditingInvoice(null);
        }}
      />

      {activeTab === 'mls' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
            <b>Peppol BIS Message Level Response (MLS) Specification:</b> Exchanged between C2 and C3 access points to convey commercial acceptance (`AP`), conditional acceptance (`AB`), or technical rejection (`RE`).
          </div>

          <div className="space-y-2">
            {[
              { code: 'AP', name: 'Accepted (AP)', color: 'bg-emerald-100 text-emerald-900 border-emerald-200', desc: 'Commercial invoice accepted by buyer AP without conditions.' },
              { code: 'AB', name: 'Acknowledged with Warning (AB)', color: 'bg-amber-100 text-amber-900 border-amber-200', desc: 'Accepted but flagged for minor warnings (e.g. rounded decimals).' },
              { code: 'RE', name: 'Rejected (RE)', color: 'bg-red-100 text-red-900 border-red-200', desc: 'Rejected due to Schematron structural error or invalid buyer VATIN.' }
            ].map((mls, idx) => (
              <div key={idx} className={`p-3 rounded-2xl border ${mls.color} text-xs flex items-center justify-between`}>
                <div>
                  <b className="text-sm font-bold block">{mls.name}</b>
                  <p className="mt-0.5 text-[11px]">{mls.desc}</p>
                </div>
                <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800">
                  {mls.code}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
