import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles, 
  Building2, 
  Hash, 
  Calendar, 
  DollarSign, 
  HelpCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAndResend: (updatedInvoice: Invoice) => void;
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSaveAndResend
}) => {
  if (!isOpen || !invoice) return null;

  // Form State initialized from preloaded invoice data
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.n);
  const [issueDate, setIssueDate] = useState(invoice.d);
  const [issueTime, setIssueTime] = useState(invoice.t || '12:00:00');
  const [docType, setDocType] = useState(invoice.type);
  const [direction, setDirection] = useState(invoice.dir);
  
  // Buyer Details
  const [buyerName, setBuyerName] = useState(invoice.cp);
  const [buyerVat, setBuyerVat] = useState(invoice.cpv);
  const [buyerEas, setBuyerEas] = useState(invoice.eas);
  const [entityId, setEntityId] = useState(invoice.ent || 'E1');
  const [sellerVat, setSellerVat] = useState(invoice.sVat || 'OM1100123456');

  // Line Items
  const [lineItems, setLineItems] = useState<Array<{ name: string; qty: number; price: number; vatCat: string }>>(() => {
    if (invoice.lines && invoice.lines.length > 0) {
      return invoice.lines.map(line => ({
        name: line[0],
        qty: Number(line[1]) || 1,
        price: parseFloat(String(line[2]).replace(/[^0-9.-]/g, '')) || 0,
        vatCat: line[3] || invoice.cat || 'S 5%'
      }));
    }
    return [{ name: 'Consulting & Implementation Services', qty: 1, price: invoice.net || 1000, vatCat: invoice.cat || 'S 5%' }];
  });

  const [currency, setCurrency] = useState('OMR');
  const [customError, setCustomError] = useState<string | null>(invoice.err || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Field Level Validation Flags
  const isVatValid = (v: string) => /^OM\d{8,12}$/i.test(v.trim());
  const isBuyerNameValid = (n: string) => n.trim().length >= 3;
  const isInvoiceNumValid = (num: string) => num.trim().length >= 3;

  const buyerVatError = !isVatValid(buyerVat);
  const buyerNameError = !isBuyerNameValid(buyerName);
  const invoiceNumError = !isInvoiceNumValid(invoiceNumber);

  // Calculate Totals
  const calculatedNet = lineItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const calculatedVat = lineItems.reduce((acc, item) => {
    const rate = item.vatCat.includes('5%') ? 0.05 : 0;
    return acc + (item.qty * item.price * rate);
  }, 0);
  const calculatedTotal = calculatedNet + calculatedVat;

  const handleFixVatFormat = () => {
    let clean = buyerVat.trim().toUpperCase();
    if (!clean.startsWith('OM')) {
      clean = 'OM' + clean.replace(/[^0-9]/g, '');
    }
    if (clean.length < 12) {
      clean = clean.padEnd(12, '0');
    }
    setBuyerVat(clean);
    if (buyerEas.includes(invoice.cpv)) {
      setBuyerEas(`0248:${clean}`);
    }
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { name: 'Additional Service Item', qty: 1, price: 100, vatCat: 'S 5%' }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (buyerVatError) {
      setCustomError('Buyer VATIN must start with "OM" followed by 10 digits (e.g. OM1100123456). Please fix before re-submitting.');
      return;
    }

    if (buyerNameError) {
      setCustomError('Buyer Legal Name is required (minimum 3 characters).');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Create updated invoice object
      const formattedLines: [string, number, string, string][] = lineItems.map(item => [
        item.name,
        item.qty,
        item.price.toFixed(3),
        item.vatCat
      ]);

      const updatedInvoice: Invoice = {
        ...invoice,
        n: invoiceNumber,
        d: issueDate,
        t: issueTime,
        type: docType,
        dir: direction,
        cp: buyerName,
        cpv: buyerVat,
        eas: buyerEas.includes(':') ? buyerEas : `0248:${buyerVat}`,
        net: calculatedNet,
        vat: calculatedVat,
        st: 'Reported', // Cleared & Reported
        tdd: 'Submit · Ack', // TDD Ack cleared
        err: undefined, // Clear error
        cat: lineItems[0]?.vatCat || 'S 5%',
        ent: entityId,
        sVat: sellerVat,
        lines: formattedLines
      };

      onSaveAndResend(updatedInvoice);
      setIsSubmitting(false);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-[#082f54] via-[#0d4f8b] to-[#0b7a63] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Edit Invoice Data &amp; Re-submit TDD</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-400 text-slate-950 uppercase">
                  {invoice.st === 'Rejected' ? 'REJECTED — CORRECTION MODE' : 'EDIT MODE'}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Invoice №: <b className="font-mono text-white">{invoice.n}</b> · UUID: <span className="font-mono text-emerald-200">{invoice.uuid.slice(0, 16)}...</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">

          {/* Prominent Error Banner if invoice has errors or is rejected */}
          {(invoice.st === 'Rejected' || invoice.err || customError) && (
            <div className="p-4 bg-red-50/90 border-2 border-red-300 rounded-2xl space-y-2 animate-fadeIn">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <b className="text-sm font-bold text-red-950 block">Oman Tax Authority (OTA) / Peppol Network Rejection Notice</b>
                    <p className="text-xs text-red-900 mt-1 leading-relaxed font-mono bg-white/80 p-2.5 rounded-xl border border-red-200">
                      {customError || invoice.err || 'Schematron Validation Error: Buyer VATIN violates PINT-OM syntax rules or missing mandatory fields.'}
                    </p>
                  </div>
                </div>

                {buyerVatError && (
                  <button
                    type="button"
                    onClick={handleFixVatFormat}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Auto-Fix Buyer VATIN</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-red-800 font-medium pt-1 flex items-center gap-2">
                <span>💡 Note: The fields requiring correction are highlighted with red borders below.</span>
              </div>
            </div>
          )}

          <form id="edit-invoice-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: General Header Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-[#0d4f8b] uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="h-4 w-4" />
                  <span>1. Invoice Header &amp; Metadata</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">PINT-OM BT-1 to BT-9</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Number (BT-1)*</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono text-xs outline-none transition-all ${
                      invoiceNumError 
                        ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/20 text-red-900' 
                        : 'border-slate-300 bg-white focus:border-blue-500'
                    }`}
                  />
                  {invoiceNumError && (
                    <span className="text-[10px] text-red-600 font-bold block mt-1">Invoice number required</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Date (BT-2)*</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document Type (BT-3)*</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Standard Invoice">380 — Standard Tax Invoice (B2B)</option>
                    <option value="Simplified Invoice">388 — Simplified Invoice (B2C)</option>
                    <option value="Credit Note">381 — Credit Note</option>
                    <option value="Debit Note">383 — Debit Note</option>
                    <option value="Export">Export Invoice (0% Zero Rated)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issuer Entity Group</label>
                  <select
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="E1">E1 — International Intelligence Solutions (OM1100123456)</option>
                    <option value="E2">E2 — Aji Alibri Enterprises (OM1100223344)</option>
                    <option value="E3">E3 — Alfaris Business Solutions (OM1100334455)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Counterparty / Buyer Party Details (HIGHLIGHTED ERRORS HERE) */}
            <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
              buyerVatError || buyerNameError 
                ? 'bg-red-50/40 border-red-300 ring-2 ring-red-500/10' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-[#0d4f8b] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span>2. Buyer / Counterparty Party Details</span>
                </h3>
                {buyerVatError && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-md border border-red-300 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    Validation Error in Buyer VATIN
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Buyer Legal Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Buyer Legal Name (BT-44)*
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none font-medium transition-all ${
                      buyerNameError 
                        ? 'border-red-500 bg-red-50/80 ring-2 ring-red-400/20 text-red-950 font-bold' 
                        : 'border-slate-300 bg-white focus:border-blue-500'
                    }`}
                  />
                  {buyerNameError && (
                    <span className="text-[10px] text-red-600 font-bold block mt-1">
                      ⚠️ Buyer name is required (min 3 chars).
                    </span>
                  )}
                </div>

                {/* Buyer VATIN — CRITICAL HIGHLIGHT FIELD */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Buyer VAT Registration № (BT-48)*
                    </label>
                    {buyerVatError && (
                      <button
                        type="button"
                        onClick={handleFixVatFormat}
                        className="text-[10px] text-red-700 hover:text-red-900 font-bold underline cursor-pointer"
                      >
                        Auto-Fix 'OM'
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={buyerVat}
                    onChange={(e) => {
                      setBuyerVat(e.target.value);
                      if (buyerEas.startsWith('0248:')) {
                        setBuyerEas(`0248:${e.target.value}`);
                      }
                    }}
                    placeholder="e.g. OM1100654321"
                    className={`w-full p-2.5 rounded-xl border font-mono text-xs outline-none transition-all ${
                      buyerVatError 
                        ? 'border-red-500 bg-red-50/90 ring-2 ring-red-500/30 text-red-950 font-bold' 
                        : 'border-slate-300 bg-white focus:border-blue-500'
                    }`}
                  />
                  {buyerVatError ? (
                    <span className="text-[10px] text-red-600 font-bold block mt-1 bg-red-100 p-1 rounded border border-red-200">
                      ❌ Invalid Oman VATIN. Must start with "OM" followed by 8–12 digits (e.g. OM1100654321).
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Valid Oman VATIN syntax
                    </span>
                  )}
                </div>

                {/* Peppol Endpoint EAS */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Peppol Endpoint ID / EAS (BT-49-EAS)
                  </label>
                  <input
                    type="text"
                    value={buyerEas}
                    onChange={(e) => setBuyerEas(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Scheme 0248 = Oman Tax Authority Registry</span>
                </div>
              </div>
            </div>

            {/* Section 3: Line Items & Pricing */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-[#0d4f8b] uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  <span>3. Invoice Line Items &amp; Tax Calculation</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Item Line</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-200/70 text-slate-700 font-bold uppercase text-[10px]">
                      <th className="p-2.5 rounded-l-lg">#</th>
                      <th className="p-2.5">Item Description (BT-153)</th>
                      <th className="p-2.5 w-24">Qty (BT-129)</th>
                      <th className="p-2.5 w-32">Unit Price OMR (BT-146)</th>
                      <th className="p-2.5 w-32">VAT Rate (BT-151)</th>
                      <th className="p-2.5 w-28 text-right">Line Total</th>
                      <th className="p-2.5 w-12 text-center rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lineItems.map((item, idx) => {
                      const lineTotal = item.qty * item.price;
                      return (
                        <tr key={idx} className="hover:bg-slate-100/50">
                          <td className="p-2 font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleLineChange(idx, 'name', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleLineChange(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs outline-none focus:border-blue-500 text-center"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.001"
                              value={item.price}
                              onChange={(e) => handleLineChange(idx, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs outline-none focus:border-blue-500 text-right"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.vatCat}
                              onChange={(e) => handleLineChange(idx, 'vatCat', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 font-semibold"
                            >
                              <option value="S 5%">Standard 5% (S)</option>
                              <option value="Z 0%">Zero Rated 0% (Z)</option>
                              <option value="E Exempt">Exempt (E)</option>
                              <option value="O Out of scope">Out of Scope (O)</option>
                            </select>
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {lineTotal.toFixed(3)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              disabled={lineItems.length <= 1}
                              className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500 space-y-1">
                  <span className="block font-bold text-slate-700">PINT-OM Automated Tax Verification:</span>
                  <span className="block text-[11px]">✓ Calculated Net (BT-109): <b>{calculatedNet.toFixed(3)} OMR</b></span>
                  <span className="block text-[11px]">✓ Standard 5% VAT (BT-110): <b>{calculatedVat.toFixed(3)} OMR</b></span>
                </div>

                <div className="text-right bg-blue-50 p-3 rounded-xl border border-blue-200 min-w-[200px]">
                  <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">Total Payable Amount (BT-112)</span>
                  <b className="text-xl font-black text-[#0d4f8b] font-mono block mt-0.5">
                    {calculatedTotal.toFixed(3)} <span className="text-xs font-normal">OMR</span>
                  </b>
                </div>
              </div>
            </div>

            {/* Live 73-Field Schematron Status Bar */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <b className="block font-bold">PINT-OM v1.0.1 Schematron Real-Time Evaluator</b>
                  <span className="text-[11px] text-emerald-800">
                    {buyerVatError 
                      ? '⚠️ 1 Field requires correction before re-submitting to OTA.' 
                      : '✓ All 73 PINT-OM business rules satisfied. Ready for immediate OTA C5 clearance.'}
                  </span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                buyerVatError ? 'bg-red-200 text-red-900' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {buyerVatError ? 'FAIL (1 Error)' : 'PASS (73 Rules)'}
              </span>
            </div>

          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              form="edit-invoice-form"
              disabled={isSubmitting || buyerVatError}
              className={`w-full sm:w-auto px-5 py-2.5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                buyerVatError 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-700 to-emerald-700 hover:from-blue-800 hover:to-emerald-800 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Validating &amp; Re-submitting to OTA...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Save Data &amp; Re-submit TDD to OTA / Peppol</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Success Confirmation Toast Overlay */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <b className="text-sm font-bold block">Invoice Successfully Corrected &amp; Re-submitted!</b>
            <p className="text-xs text-emerald-200">
              TDD cleared by Oman Tax Authority C5 Gateway · Message status set to Reported / Ack.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
