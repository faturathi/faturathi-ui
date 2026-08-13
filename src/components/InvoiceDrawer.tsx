import React, { useEffect, useState } from 'react';
import { Invoice, RoleMode, canEditInvoice } from '../types';
import { X, Copy, Check, Download, Edit, CheckCircle2, AlertTriangle, QrCode, FileCode, Printer, ShieldCheck, Lock } from 'lucide-react';
import { ErpSourceBadge } from './ErpSourceBadge';
import { buildB2cQrDataUrl } from '../lib/b2cQr';

interface InvoiceDrawerProps {
  invoice: Invoice | null;
  onClose: () => void;
  maskAmounts: boolean;
  roleMode: RoleMode;
  onApproveAp: (id: string) => Promise<Invoice>;
  onResendInvoice: (id: string) => void;
  onEditInvoice?: (inv: Invoice) => void;
}

export const InvoiceDrawer: React.FC<InvoiceDrawerProps> = ({
  invoice,
  onClose,
  maskAmounts,
  roleMode,
  onApproveAp,
  onResendInvoice,
  onEditInvoice
}) => {
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    setQrDataUrl('');
    if (invoice?.b2c) void buildB2cQrDataUrl(invoice).then(setQrDataUrl).catch(console.error);
  }, [invoice]);

  if (!invoice) return null;

  const isAp = invoice.dir === 'Inbound (AP)';
  const supplierName = invoice.sName || (isAp ? invoice.cp : '');
  const supplierVat = invoice.sVat || (isAp ? invoice.cpv : '');
  const supplierEndpoint = isAp ? invoice.eas : (supplierVat ? `0248:${supplierVat}` : '');
  const customerName = invoice.buyerName || (isAp ? '' : invoice.cp);
  const customerVat = invoice.buyerVat || (isAp ? '' : invoice.cpv);
  const customerEndpoint = isAp ? (customerVat ? `0248:${customerVat}` : '') : invoice.eas;

  const handleCopyUuid = () => {
    navigator.clipboard.writeText(invoice.uuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 1500);
  };

  const handleDownloadXml = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:CustomizationID>urn:peppol:pint:billing-1@om-1</cbc:CustomizationID>
    <cbc:ProfileID>urn:peppol:bis:billing</cbc:ProfileID>
    <cbc:ID>${invoice.n}</cbc:ID>
    <cbc:IssueDate>${invoice.d}</cbc:IssueDate>
    <cbc:IssueTime>${invoice.t}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="${invoice.tt}">${invoice.type.includes('Credit') ? '381' : '380'}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>OMR</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>OMR</cbc:TaxCurrencyCode>
    <cbc:UUID>${invoice.uuid}</cbc:UUID>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cbc:EndpointID schemeID="0248">${supplierEndpoint.replace('0248:', '')}</cbc:EndpointID>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${supplierVat}</cbc:CompanyID>
                <cac:TaxScheme><cbc:ID>VAT</cbc:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${supplierName}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cbc:EndpointID schemeID="0248">${customerEndpoint.replace('0248:', '')}</cbc:EndpointID>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${customerVat}</cbc:CompanyID>
                <cac:TaxScheme><cbc:ID>VAT</cbc:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${customerName}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="OMR">${invoice.vat.toFixed(3)}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="OMR">${invoice.net.toFixed(3)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="OMR">${invoice.net.toFixed(3)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="OMR">${(invoice.net + invoice.vat).toFixed(3)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="OMR">${(invoice.net + invoice.vat).toFixed(3)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
</Invoice>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.n}_PINT_OM.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fmt = (val: number) =>
    maskAmounts ? '•••••' : val.toLocaleString('en', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  // Lifecycle steps
  const steps = isAp
    ? [
        { label: 'Received via AS4', done: true },
        { label: 'Validated (schematron)', done: true },
        { label: 'MLS sent to supplier', done: invoice.st !== 'Rejected', fail: invoice.st === 'Rejected' },
        { label: 'TDD → OTA (C3 leg)', done: invoice.st === 'Reported' },
        { label: 'Posted to AP ledger', done: invoice.ap?.startsWith('Approved') }
      ]
    : [
        { label: 'Created', done: true },
        { label: 'Validated (v1.0.1)', done: true },
        { label: 'Sent via AS4', done: invoice.st !== 'Pending', fail: invoice.st === 'Rejected' },
        { label: 'MLS received', done: invoice.st === 'Reported' || invoice.st === 'Sent', fail: invoice.st === 'Rejected' },
        { label: 'TDD → OTA', done: invoice.st === 'Reported', fail: invoice.st === 'Rejected' }
      ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity animate-fadeIn">
      {/* Drawer Container */}
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col p-6 space-y-5 antialiased">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#0d4f8b]">{invoice.n}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {invoice.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Issued: {invoice.d} at {invoice.t} · {invoice.dir}
            </p>
            <p className="text-[11px] font-mono text-[#0d4f8b] font-semibold mt-0.5">
              ⏱️ Received/Created: {invoice.createdAt ? (invoice.createdAt.includes('T') ? invoice.createdAt.replace('T', ' ').slice(0, 19) : invoice.createdAt) : `${invoice.d} ${invoice.t}`} ({invoice.sourceChannel || 'REST API'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status + TDD + ERP Source Chip */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                invoice.st === 'Reported'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.st === 'Sent'
                  ? 'bg-blue-100 text-blue-800'
                  : invoice.st === 'Rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {invoice.st}
            </span>
          </div>

          <ErpSourceBadge
            erpSystem={invoice.erpSystem || 'SAP S/4HANA'}
            sourceChannel={invoice.sourceChannel || 'REST API'}
          />

          <div className="text-xs font-mono bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 font-semibold">
            TDD: <b className="text-[#0d4f8b]">{invoice.tdd}</b>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Lifecycle</h4>
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                      step.fail
                        ? 'bg-red-600'
                        : step.done
                        ? 'bg-emerald-600'
                        : 'bg-slate-300'
                    }`}
                  >
                    {step.fail ? '✕' : step.done ? '✓' : idx + 1}
                  </span>
                  <span className={`font-medium ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && <span className="text-slate-300">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error / Warning Alert if applicable */}
        {invoice.err && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-1">
            <div className="font-bold text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span>Rejected by Buyer AP / OTA Network Rule Engine</span>
            </div>
            <p className="font-mono text-[11px] bg-red-100/80 p-2 rounded-xl text-red-950">
              {invoice.err}
            </p>
          </div>
        )}

        {invoice.warn && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
            <div className="font-bold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Accepted with Warning (AB)</span>
            </div>
            <p className="text-[11px]">{invoice.warn}</p>
          </div>
        )}

        {/* Section 1: Mandatory PINT OM Fields */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0e8f6f] uppercase tracking-wider border-b border-slate-200 pb-1">
            Document — Mandatory PINT OM Fields
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">IBT-001 Invoice Number</span>
              <span className="font-bold text-slate-800">{invoice.n}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">IBT-003 Type Code</span>
              <span className="font-semibold text-slate-800">
                {invoice.type.includes('Credit') ? '381 (Credit Note)' : '380 (Tax Invoice)'}
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">IBT-002 Issue Date</span>
              <span className="font-semibold text-slate-800">{invoice.d}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">IBT-168 Issue Time</span>
              <span className="font-semibold text-slate-800">{invoice.t}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">IBT-005 / IBT-006 Currency</span>
              <span className="font-semibold text-slate-800">OMR / OMR</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">BTOM-001 Bitmap (20-char)</span>
              <span className="font-mono font-semibold text-slate-800 text-[11px]">{invoice.tt}</span>
            </div>
          </div>

          {/* BTOM-002 UUID Chip */}
          <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                BTOM-002 Invoice UUID (v5) — OTA Reference
              </span>
              <button
                onClick={handleCopyUuid}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
              >
                {copiedUuid ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedUuid ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs font-bold text-slate-900 break-all">{invoice.uuid}</div>
            <p className="text-[10px] text-slate-500">
              Deterministic UUIDv5 derived under OTA namespace (`e0bc4ac8...`). Identical at C2 and C3.
            </p>
          </div>

          {invoice.cn && (
            <div className="p-2 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-700 block">Preceding Invoice Reference</span>
              <span>{invoice.cn}</span>
            </div>
          )}
        </div>

        {/* Section 2: Seller & Buyer Details */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0e8f6f] uppercase tracking-wider border-b border-slate-200 pb-1">
            Seller (BG-4) &amp; Buyer (BG-7) Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Seller */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-[#0d4f8b] uppercase block">Seller (Supplier)</span>
              <div className="font-bold text-slate-900">
                {invoice.sName || (isAp ? invoice.cp : 'Issuing company')}
              </div>
              <div className="text-slate-600">
                VAT ID: <b className="font-mono">{invoice.sVat || (isAp ? invoice.cpv : 'Not available')}</b>
              </div>
              <div className="text-slate-500 text-[11px]">
                E-Address: <span className="font-mono">{isAp ? invoice.eas : (invoice.sVat ? `0248:${invoice.sVat}` : 'Not available')}</span>
              </div>
              <div className="text-slate-500 text-[11px]">Country: OM (Oman)</div>
            </div>

            {/* Buyer */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-[#0d4f8b] uppercase block">Buyer (Customer)</span>
              <div className="font-bold text-slate-900">
                {invoice.buyerName || (!isAp ? invoice.cp : 'Receiving company')}
              </div>
              <div className="text-slate-600">
                VAT ID: <b className="font-mono">{invoice.buyerVat || (!isAp ? invoice.cpv : 'Not available')}</b>
              </div>
              <div className="text-slate-500 text-[11px]">
                E-Address: <span className="font-mono">{!isAp ? invoice.eas : (invoice.buyerVat ? `0248:${invoice.buyerVat}` : 'Not available')}</span>
              </div>
              <div className="text-slate-500 text-[11px]">Country: OM (Oman)</div>
            </div>
          </div>
        </div>

        {/* Section 3: Line Items */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0e8f6f] uppercase tracking-wider border-b border-slate-200 pb-1">
            Lines &amp; VAT Breakdown (BG-25 / BG-23)
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2 px-3">Item Name (IBT-153)</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Price (OMR)</th>
                  <th className="py-2 px-3 text-right">VAT Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {invoice.lines?.map((line, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-semibold">{line[0]}</td>
                    <td className="py-2.5 px-3 text-right">{line[1]}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{fmt(Number(line[2]))}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{line[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Line Totals */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-xs text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">IBT-109 Total Net</span>
              <span className="font-bold text-slate-800">{fmt(invoice.net)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">IBT-110 Total VAT</span>
              <span className="font-bold text-slate-800">{fmt(invoice.vat)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">IBT-112 Total Incl. VAT</span>
              <span className="font-black text-[#0d4f8b]">{fmt(invoice.net + invoice.vat)}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Network & Authority Response Details */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0e8f6f] uppercase tracking-wider border-b border-slate-200 pb-1">
            Network &amp; Authority Response Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Branch Code</span>
              <span className="font-semibold text-slate-800">{invoice.branch || '100 — HQ Muscat'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Consolidated B2C?</span>
              <span className="font-semibold text-slate-800">{invoice.b2c ? 'Yes (B2C batch eligible)' : 'No'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Cancellation Window Status</span>
              <span className="font-semibold text-slate-800">
                {invoice.st === 'Reported'
                  ? 'Closed (Reported to OTA) — Credit Note required per spec'
                  : 'Open — can be modified before final TDD reporting'}
              </span>
            </div>
          </div>
        </div>

        {/* B2C QR Code Rendering if B2C */}
        {invoice.b2c && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-[#0d4f8b] flex items-center gap-1.5">
              <QrCode className="h-4 w-4" />
              <span>B2C Readable Invoice — TLV Base64 QR Code</span>
            </h4>
            <div className="flex items-center gap-4 pt-1">
              {qrDataUrl ? <img src={qrDataUrl} alt={`B2C QR code for ${invoice.n}`} className="w-32 h-32 border-4 border-white bg-white shadow-md rounded-lg" /> : <div className="w-32 h-32 bg-slate-200 animate-pulse rounded-lg" />}
              <div className="text-[11px] text-slate-600 space-y-1">
                <p>
                  <b>Tags 1–9 encoded:</b> QR version · invoice type · seller name · seller VATIN · date · time · total incl. VAT · VAT total · invoice UUID.
                </p>
                <p className="text-[10px] text-slate-400">
                  Fixed B2C buyer values per IBR-173-OM: "General customer" · OM · 0248:997770000099.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleDownloadXml}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <FileCode className="h-4 w-4 text-[#0d4f8b]" />
            <span>Download UBL XML</span>
          </button>

          {isAp && (!invoice.ap || /awaiting|pending/i.test(invoice.ap)) && (
            <button
              onClick={() => void onApproveAp(invoice.n).catch((error) => {
                window.alert(error instanceof Error ? error.message : 'The AP document could not be approved.');
              })}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer ml-auto shadow-2xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve &amp; Post to ERP</span>
            </button>
          )}

          {!isAp && invoice.st.includes('Draft') && (
            <button
              onClick={() => onResendInvoice(invoice.n)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#0d4f8b] hover:from-emerald-500 hover:to-[#0b3d6b] text-white rounded-xl text-xs font-bold transition-all cursor-pointer ml-auto shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approver: Approve &amp; Dispatch to Peppol / OTA</span>
            </button>
          )}

          {!isAp && canEditInvoice(invoice) && (
            <button
              onClick={() => {
                if (onEditInvoice) {
                  onEditInvoice(invoice);
                } else {
                  onResendInvoice(invoice.n);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0d4f8b] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer ml-auto shadow-2xs"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Invoice Data &amp; Re-submit</span>
            </button>
          )}

          {!isAp && !canEditInvoice(invoice) && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold ml-auto">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>Immutable Record — Cannot Be Edited or Deleted Once Submitted ({invoice.tdd})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
