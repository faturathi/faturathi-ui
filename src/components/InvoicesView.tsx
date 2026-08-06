import React, { useState } from 'react';
import { Entity, Invoice, RoleMode, canEditInvoice } from '../types';
import { Search, Download, Filter, Eye, Copy, Check, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit, Lock, ShieldCheck } from 'lucide-react';
import { ErpSourceBadge } from './ErpSourceBadge';

interface InvoicesViewProps {
  invoices: Invoice[];
  maskAmounts: boolean;
  onSelectInvoice: (inv: Invoice) => void;
  selectedEntity: string;
  onSelectEntity: (ent: string) => void;
  roleMode: RoleMode;
  onEditInvoice?: (inv: Invoice) => void;
  entities: Entity[];
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  maskAmounts,
  onSelectInvoice,
  selectedEntity,
  onSelectEntity,
  roleMode,
  onEditInvoice,
  entities
}) => {
  const [directionFilter, setDirectionFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null);

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    const selected = entities.find((entity) => entity.id === selectedEntity);
    if (selectedEntity !== 'group' && inv.ent !== selectedEntity && inv.ent !== selected?.short_code) return false;
    if (directionFilter && inv.dir !== directionFilter) return false;
    if (typeFilter && inv.type !== typeFilter) return false;
    if (statusFilter && inv.st !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        inv.n.toLowerCase().includes(q) ||
        inv.cp.toLowerCase().includes(q) ||
        (inv.uuid || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCopyUuid = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uuid);
    setCopiedUuid(uuid);
    setTimeout(() => setCopiedUuid(null), 1200);
  };

  const handleExportCsv = () => {
    const headers = ['Invoice Number', 'Issue Date', 'Type', 'Direction', 'Counterparty', 'Net Amount', 'VAT Amount', 'Total', 'Status', 'UUID'];
    const rows = filtered.map(i => [
      i.n, i.d, i.type, i.dir, i.cp, i.net.toFixed(3), i.vat.toFixed(3), (i.net + i.vat).toFixed(3), i.st, i.uuid
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faturathi_invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusPill = (st: string, warn?: string) => {
    switch (st) {
      case 'Reported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            <span>Reported</span>
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
            <span>Sent</span>
          </span>
        );
      case 'Draft (Pending Review)':
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse"></span>
            <span>Draft (Pending Review)</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
            <span>Rejected</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{st}</span>;
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center gap-2">
            <span>Invoices</span>
            <span className="text-sm font-normal text-slate-500 font-arabic">الفواتير</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All documents exchanged on your behalf as C1 (sales) and received as C4 (purchases). Click any row for the full PINT OM detail drawer.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
        >
          <Download className="h-4 w-4 text-[#0d4f8b]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Entity Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Supplier Entity:</span>
        <button
          onClick={() => onSelectEntity('group')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedEntity === 'group' ? 'bg-[#0d4f8b] text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Whole group ({entities.length} Suppliers)
        </button>
        {entities.map((entity) => <button key={entity.id}
          onClick={() => onSelectEntity(entity.id)}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedEntity === entity.id ? 'bg-[#0d4f8b] text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}>
          {entity.name}
        </button>)}
      </div>

      {/* Workflow Tracking Buckets */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Tracking:</span>
        {[
          { label: 'All', status: '', count: invoices.length, color: 'border-l-slate-400' },
          { label: 'Reported (OTA ack)', status: 'Reported', count: invoices.filter((i) => i.st === 'Reported').length, color: 'border-l-emerald-600' },
          { label: 'Submitted', status: 'Sent', count: invoices.filter((i) => i.st === 'Sent').length, color: 'border-l-blue-600' },
          { label: 'Pending', status: 'Pending', count: invoices.filter((i) => i.st === 'Pending').length, color: 'border-l-amber-500' },
          { label: 'Rejected', status: 'Rejected', count: invoices.filter((i) => i.st === 'Rejected').length, color: 'border-l-red-500' }
        ].map((b, idx) => (
          <button
            key={idx}
            onClick={() => setStatusFilter(b.status)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 border-l-4 ${b.color} transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === b.status ? 'bg-slate-100 ring-1 ring-slate-300' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <span>{b.label}</span>
            <b className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full">{b.count}</b>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 text-slate-400 pl-1">
          <Filter className="h-4 w-4" />
        </div>

        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white text-slate-700 outline-none hover:border-slate-300"
        >
          <option value="">Direction: All</option>
          <option value="Outbound (AR)">Outbound (AR)</option>
          <option value="Inbound (AP)">Inbound (AP)</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white text-slate-700 outline-none hover:border-slate-300"
        >
          <option value="">Type: All</option>
          <option value="Standard Invoice">Standard Invoice</option>
          <option value="Simplified (B2C)">Simplified (B2C)</option>
          <option value="Credit Note">Credit Note</option>
          <option value="Debit Note">Debit Note</option>
          <option value="Self-Billing">Self-Billing</option>
          <option value="Export">Export</option>
          <option value="Profit Margin">Profit Margin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white text-slate-700 outline-none hover:border-slate-300"
        >
          <option value="">Status: All</option>
          <option value="Reported">Reported</option>
          <option value="Sent">Sent</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search number, buyer, or UUID..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0d4f8b] transition-colors"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Invoice № (IBT-001) / UUID (BTOM-002)</th>
                <th className="py-3 px-3">Date · Time</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Counterparty</th>
                <th className="py-3 px-3 text-right">Total incl. VAT (OMR)</th>
                <th className="py-3 px-3">Lifecycle</th>
                <th className="py-3 px-3">TDD &amp; Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No invoices match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((inv, idx) => {
                  const isAr = inv.dir === 'Outbound (AR)';
                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {isAr ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          )}
                          <span>{inv.n}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span
                            onClick={(e) => handleCopyUuid(inv.uuid, e)}
                            className="font-mono text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-copy flex items-center gap-1 max-w-[200px] truncate"
                            title="Click to copy full UUID"
                          >
                            <span className="truncate">{inv.uuid}</span>
                            {copiedUuid === inv.uuid ? (
                              <Check className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{inv.d}</span>
                        <span className="text-[10px] text-slate-400 block">{inv.t}</span>
                        <span className="text-[9.5px] text-[#0d4f8b] font-mono block mt-0.5" title="Creation / API Ingestion Timestamp">
                          ⏱️ {inv.createdAt ? (inv.createdAt.includes('T') ? inv.createdAt.replace('T', ' ').slice(0, 19) : inv.createdAt) : `${inv.d} ${inv.t}`}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">{inv.type}</span>
                        {inv.b2c && (
                          <span className="inline-block mt-0.5 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            QR + readable
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900 block">{inv.cp}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{inv.eas}</span>
                        <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                          <span className="text-[9.5px] text-[#0d4f8b] font-medium block">
                            {inv.ent === 'E3' ? 'Alfaris Business' : inv.ent === 'E2' ? 'Aji Alibri' : 'Intl. Intelligence'}
                          </span>
                          <ErpSourceBadge
                            erpSystem={inv.erpSystem || 'SAP S/4HANA'}
                            sourceChannel={inv.sourceChannel || 'REST API'}
                            compact={true}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                        {maskAmounts ? (
                          <span className="font-bold text-slate-400">•••••</span>
                        ) : (
                          <>
                            <b className="text-slate-900 font-bold text-sm block">
                              {(inv.net + inv.vat).toLocaleString('en', { minimumFractionDigits: 3 })}
                            </b>
                            <span className="text-[10px] text-slate-400 block">
                              VAT {inv.vat.toLocaleString('en', { minimumFractionDigits: 3 })}
                            </span>
                          </>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusPill(inv.st, inv.warn)}
                        {inv.warn && (
                          <span className="block mt-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                            AB warning
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        <span>{inv.tdd}</span>
                        {inv.ap && (
                          <span
                            className={`block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                              inv.ap.startsWith('Awaiting')
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {inv.ap}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {canEditInvoice(inv) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onEditInvoice) {
                                onEditInvoice(inv);
                              } else {
                                onSelectInvoice(inv);
                              }
                            }}
                            className="px-2.5 py-1 bg-[#0d4f8b] hover:bg-blue-900 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title="Edit invoice data and re-submit"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md inline-flex items-center gap-1 cursor-default" title="Invoice submitted to OTA/Peppol cannot be edited or deleted">
                            <Lock className="h-3 w-3 text-emerald-600" />
                            <span>Locked</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
