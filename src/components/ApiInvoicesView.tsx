import React, { useState } from 'react';
import { Invoice } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  MessageSquare, 
  Server, 
  Send, 
  Clock, 
  Filter, 
  Search, 
  AlertCircle, 
  Check, 
  X, 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  FileText,
  Radio,
  Sparkles
} from 'lucide-react';

interface ApiInvoicesViewProps {
  invoices: Invoice[];
  onSelectInvoice: (inv: Invoice) => void;
  onApproveAp: (invNum: string) => void;
  maskAmounts?: boolean;
}

interface QueryThread {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  status: 'Open Query' | 'Resolved';
  messages: {
    sender: 'Internal Accounting' | 'Vendor Staff';
    text: string;
    timestamp: string;
  }[];
}

export const ApiInvoicesView: React.FC<ApiInvoicesViewProps> = ({
  invoices,
  onSelectInvoice,
  onApproveAp,
  maskAmounts = false
}) => {
  // Filter for Inbound / AP invoices
  const apInvoices = invoices.filter(i => i.dir === 'Inbound (AP)' || i.dir === 'Inbound' || i.n.includes('AP') || i.ap);

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'query'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for actions
  const [acceptedInvoices, setAcceptedInvoices] = useState<Record<string, string>>({});
  const [rejectedInvoices, setRejectedInvoices] = useState<Record<string, { reason: string; timestamp: string }>>({});
  const [queries, setQueries] = useState<Record<string, QueryThread>>({
    'INV-2026-AP-0102': {
      id: 'q-1',
      invoiceNumber: 'INV-2026-AP-0102',
      vendorName: 'Gulf IT Logistics LLC',
      status: 'Open Query',
      messages: [
        {
          sender: 'Internal Accounting',
          text: 'Line item 2 shows VAT category S 5%, but unit price exceeds agreed PO-2026-88. Please verify discount term.',
          timestamp: '2026-07-31 10:14'
        }
      ]
    }
  });

  // Modal State for Querying Vendor
  const [queryModalInvoice, setQueryModalInvoice] = useState<Invoice | null>(null);
  const [queryInputText, setQueryInputText] = useState('');
  
  // Modal State for Rejecting Invoice
  const [rejectModalInvoice, setRejectModalInvoice] = useState<Invoice | null>(null);
  const [rejectReason, setRejectReason] = useState('02 — Unit price mismatch with Purchase Order');

  // Modal State for ERP Acceptance Confirmation
  const [acceptModalInvoice, setAcceptModalInvoice] = useState<Invoice | null>(null);

  const getStatusBadge = (inv: Invoice) => {
    const invNum = inv.n;
    if (acceptedInvoices[invNum] || inv.ap === 'Approved & Posted to ERP' || inv.ap === 'Approved · posted to ERP') {
      return {
        label: 'Accepted & Posted to ERP',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
      };
    }
    if (rejectedInvoices[invNum]) {
      return {
        label: 'Rejected over Peppol',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: <XCircle className="h-3.5 w-3.5 text-red-600" />
      };
    }
    if (queries[invNum] && queries[invNum].status === 'Open Query') {
      return {
        label: 'On Hold (Query Pending)',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: <HelpCircle className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
      };
    }
    return {
      label: 'Pending Inbound Action',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: <Clock className="h-3.5 w-3.5 text-blue-600" />
    };
  };

  const filteredInvoices = apInvoices.filter(inv => {
    const status = getStatusBadge(inv);
    if (activeFilter === 'pending' && status.label !== 'Pending Inbound Action') return false;
    if (activeFilter === 'accepted' && !status.label.includes('Accepted')) return false;
    if (activeFilter === 'rejected' && !status.label.includes('Rejected')) return false;
    if (activeFilter === 'query' && !status.label.includes('Hold')) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inv.n.toLowerCase().includes(q) ||
        inv.cp.toLowerCase().includes(q) ||
        inv.uuid.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleConfirmAccept = (inv: Invoice) => {
    onApproveAp(inv.n);
    setAcceptedInvoices(prev => ({
      ...prev,
      [inv.n]: `Posted to SAP S/4HANA AP Ledger on ${new Date().toLocaleTimeString()}`
    }));
    setAcceptModalInvoice(null);
  };

  const handleConfirmReject = () => {
    if (!rejectModalInvoice) return;
    setRejectedInvoices(prev => ({
      ...prev,
      [rejectModalInvoice.n]: {
        reason: rejectReason,
        timestamp: new Date().toISOString()
      }
    }));
    setRejectModalInvoice(null);
  };

  const handleSendQuery = () => {
    if (!queryModalInvoice || !queryInputText.trim()) return;
    const invNum = queryModalInvoice.n;
    const newMsg = {
      sender: 'Internal Accounting' as const,
      text: queryInputText.trim(),
      timestamp: new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setQueries(prev => {
      const existing = prev[invNum];
      if (existing) {
        return {
          ...prev,
          [invNum]: {
            ...existing,
            status: 'Open Query',
            messages: [...existing.messages, newMsg]
          }
        };
      }
      return {
        ...prev,
        [invNum]: {
          id: `q-${Date.now()}`,
          invoiceNumber: invNum,
          vendorName: queryModalInvoice.cp,
          status: 'Open Query',
          messages: [newMsg]
        }
      };
    });

    setQueryInputText('');
    setQueryModalInvoice(null);
  };

  const pendingCount = apInvoices.filter(i => getStatusBadge(i).label === 'Pending Inbound Action').length;
  const acceptedCount = apInvoices.filter(i => getStatusBadge(i).label.includes('Accepted')).length;
  const rejectedCount = apInvoices.filter(i => getStatusBadge(i).label.includes('Rejected')).length;
  const queryCount = apInvoices.filter(i => getStatusBadge(i).label.includes('Hold')).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0d4f8b] to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>Peppol AS4 / REST Inbound AP Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              AP Invoices Action Hub (Accounts Payable - AP)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Review incoming Accounts Payable (AP) invoices from vendors over the Peppol network or REST API. Accept to ERP, Reject over Peppol, or Raise Vendor Queries.
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto text-center text-xs">
            <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">Pending Action</span>
              <b className="text-lg font-black text-blue-400">{pendingCount}</b>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">Accepted to ERP</span>
              <b className="text-lg font-black text-emerald-400">{acceptedCount}</b>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">On Hold (Query)</span>
              <b className="text-lg font-black text-amber-400">{queryCount}</b>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">Rejected Peppol</span>
              <b className="text-lg font-black text-red-400">{rejectedCount}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter Tabs + Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs w-full md:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Inbound ({apInvoices.length})
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('accepted')}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'accepted'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Accepted to ERP ({acceptedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('query')}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'query'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>On Hold Query ({queryCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Rejected Peppol ({rejectedCount})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor, invoice #..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Inbound Invoices List / Grid Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Invoice # &amp; Date</th>
                <th className="p-4">Vendor (Counterparty)</th>
                <th className="p-4">Net &amp; VAT Total</th>
                <th className="p-4">PINT OM Status</th>
                <th className="p-4">Inbound Action Status</th>
                <th className="p-4 text-right">Interactive Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No inbound AP invoices found matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const statusInfo = getStatusBadge(inv);
                  const isAccepted = statusInfo.label.includes('Accepted');
                  const isRejected = statusInfo.label.includes('Rejected');
                  const isQueryHold = statusInfo.label.includes('Hold');

                  return (
                    <tr key={inv.n} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice # */}
                      <td className="p-4">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="font-bold text-blue-700 hover:underline flex items-center gap-1 font-mono text-xs cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>{inv.n}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{inv.d} · {inv.t}</span>
                      </td>

                      {/* Vendor */}
                      <td className="p-4">
                        <b className="text-slate-900 block font-semibold">{inv.cp}</b>
                        <span className="text-[10px] text-slate-400 font-mono">VAT: {inv.cpv || 'OM1100654321'}</span>
                      </td>

                      {/* Amounts */}
                      <td className="p-4">
                        <b className="text-slate-900 font-bold font-mono block">
                          {maskAmounts ? '***.**' : `${inv.net.toFixed(3)} OMR`}
                        </b>
                        <span className="text-[10px] text-slate-400 font-mono">
                          VAT: {maskAmounts ? '**.**' : `${inv.vat.toFixed(3)} OMR`}
                        </span>
                      </td>

                      {/* PINT OM Status */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span>Cleared C5</span>
                        </span>
                      </td>

                      {/* Action Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span>{statusInfo.label}</span>
                        </span>
                        {queries[inv.n] && (
                          <div className="text-[10px] text-amber-700 mt-1 font-medium italic">
                            Last Query: "{queries[inv.n].messages[queries[inv.n].messages.length - 1].text.slice(0, 45)}..."
                          </div>
                        )}
                        {rejectedInvoices[inv.n] && (
                          <div className="text-[10px] text-red-700 mt-1 font-medium italic">
                            Reason: {rejectedInvoices[inv.n].reason}
                          </div>
                        )}
                      </td>

                      {/* Interactive Actions Column */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Accept Button */}
                          <button
                            onClick={() => setAcceptModalInvoice(inv)}
                            disabled={isAccepted}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                              isAccepted
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                            }`}
                            title="Send invoice to ERP Accounts Payable"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{isAccepted ? 'Accepted' : 'Accept (ERP)'}</span>
                          </button>

                          {/* Query Button */}
                          <button
                            onClick={() => setQueryModalInvoice(inv)}
                            disabled={isRejected}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                              isQueryHold
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                            title="Ask vendor questions & hold invoice"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            <span>{isQueryHold ? 'View Query' : 'Query'}</span>
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => setRejectModalInvoice(inv)}
                            disabled={isRejected || isAccepted}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                              isRejected
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-300'
                            }`}
                            title="Reject over Peppol Network"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accept to ERP Confirmation Modal */}
      {acceptModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fadeIn border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-300">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Post Invoice to ERP System</h3>
                <p className="text-xs text-slate-500">Accounts Payable (AP) Integration</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Number:</span>
                <b className="font-mono text-slate-900">{acceptModalInvoice.n}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor:</span>
                <b className="text-slate-900">{acceptModalInvoice.cp}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net + VAT Amount:</span>
                <b className="font-mono text-emerald-700 font-bold">
                  {(acceptModalInvoice.net + acceptModalInvoice.vat).toFixed(3)} OMR
                </b>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Accepting this invoice will post it directly into your configured ERP System (SAP S/4HANA / Oracle Cloud) Accounts Payable subledger and mark the Peppol Message Level Response (MLS) as <b>AP (Accepted)</b>.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAcceptModalInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAccept(acceptModalInvoice)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Confirm ERP Posting</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Over Peppol Modal */}
      {rejectModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fadeIn border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-700 rounded-2xl border border-red-300">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Invoice over Peppol</h3>
                <p className="text-xs text-slate-500">Peppol Message Level Response (RE)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Rejecting invoice <b className="font-mono text-slate-900">{rejectModalInvoice.n}</b> will transmit a Peppol MLS RE rejection response directly to vendor <b>{rejectModalInvoice.cp}</b>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Rejection Reason / Code:
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-red-500"
              >
                <option value="01 — Duplicate invoice submission">01 — Duplicate invoice submission</option>
                <option value="02 — Unit price mismatch with Purchase Order">02 — Unit price mismatch with Purchase Order</option>
                <option value="03 — Goods/Services not received or defective">03 — Goods/Services not received or defective</option>
                <option value="04 — Incorrect Buyer VAT Registration Number">04 — Incorrect Buyer VAT Registration Number</option>
                <option value="05 — Incorrect VAT Category or Tax calculation">05 — Incorrect VAT Category or Tax calculation</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <X className="h-4 w-4" />
                <span>Transmit Peppol Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Query Modal */}
      {queryModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-fadeIn border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl border border-amber-300">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Vendor Query &amp; Hold</h3>
                  <p className="text-xs text-slate-500 font-mono">{queryModalInvoice.n} · {queryModalInvoice.cp}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQueryModalInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing thread if any */}
            {queries[queryModalInvoice.n] && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 max-h-48 overflow-y-auto text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Query Conversation History:</span>
                {queries[queryModalInvoice.n].messages.map((m, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <b className="text-blue-800">{m.sender}</b>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="text-slate-800 leading-normal">{m.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Compose Question / Clarification for Vendor:
              </label>
              <textarea
                rows={3}
                value={queryInputText}
                onChange={(e) => setQueryInputText(e.target.value)}
                placeholder="e.g. Please clarify discount structure on line item #2 or confirm delivery note number..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-amber-700 italic">
                * Note: Raising a query will automatically set invoice status to <b>On Hold (Query Pending)</b> until vendor responds.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQueryModalInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendQuery}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Query &amp; Hold Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
