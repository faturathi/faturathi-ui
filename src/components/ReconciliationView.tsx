import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileCheck, Search } from 'lucide-react';
import { Invoice } from '../types';

interface ReconciliationViewProps {
  invoices: Invoice[];
  maskAmounts?: boolean;
}

type DirectionFilter = 'ALL' | 'AR' | 'AP';

const directionOf = (invoice: Invoice): 'AR' | 'AP' => invoice.dir === 'Inbound (AP)' ? 'AP' : 'AR';

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({ invoices, maskAmounts = false }) => {
  const [direction, setDirection] = useState<DirectionFilter>('ALL');
  const [search, setSearch] = useState('');
  const [packGenerated, setPackGenerated] = useState(false);

  const scopedInvoices = useMemo(() => invoices.filter((invoice) => {
    if (direction !== 'ALL' && directionOf(invoice) !== direction) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [invoice.n, invoice.cp, invoice.cpv, invoice.branchCode, invoice.branchName]
      .some((value) => String(value || '').toLowerCase().includes(query));
  }), [direction, invoices, search]);

  const summary = useMemo(() => {
    const totalVat = scopedInvoices.reduce((sum, invoice) => sum + Number(invoice.vat || 0), 0);
    const accessPointMatched = scopedInvoices.filter((invoice) => Boolean(invoice.uuid) || ['Sent', 'Reported'].includes(invoice.st)).length;
    const otaConfirmed = scopedInvoices.filter((invoice) => invoice.st === 'Reported').length;
    const exceptions = scopedInvoices.filter((invoice) => invoice.st === 'Rejected' || /reject|query|pending/i.test(`${invoice.ap || ''} ${invoice.apStatus || ''}`));
    return { totalVat, accessPointMatched, otaConfirmed, exceptions };
  }, [scopedInvoices]);

  const aging = useMemo(() => {
    const buckets = [0, 0, 0, 0];
    const now = new Date();
    summary.exceptions.forEach((invoice) => {
      const created = new Date(invoice.createdAt || `${invoice.d}T${invoice.t || '00:00:00'}`);
      const days = Number.isNaN(created.getTime()) ? 0 : Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86_400_000));
      buckets[days <= 7 ? 0 : days <= 15 ? 1 : days <= 30 ? 2 : 3] += 1;
    });
    return buckets;
  }, [summary.exceptions]);

  const amount = (value: number) => maskAmounts ? '••••••' : `${value.toFixed(3)} OMR`;
  const directionLabel = direction === 'AR' ? 'Accounts Receivable (AR)' : direction === 'AP' ? 'Accounts Payable (AP)' : 'Combined AR + AP';

  const exportReconciliationCsv = () => {
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = scopedInvoices.map((invoice) => [
      invoice.n, directionOf(invoice), invoice.d, invoice.cp, invoice.cpv,
      Number(invoice.net || 0).toFixed(3), Number(invoice.vat || 0).toFixed(3),
      invoice.st, invoice.uuid || '', invoice.apStatus || invoice.ap || '',
    ]);
    const csv = [
      ['Document', 'Direction', 'Date', 'Counterparty', 'VATIN', 'Net OMR', 'VAT OMR', 'PINT Status', 'UUID', 'ERP/AP Status'],
      ...rows,
    ].map((row) => row.map(escape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reconciliation_${direction}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePack = () => {
    setPackGenerated(true);
    exportReconciliationCsv();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0d4f8b]">Reconciliation &amp; 3-Way Match <span className="text-sm font-normal text-slate-500 font-arabic">المطابقة الثلاثية</span></h2>
          <p className="mt-1 text-xs text-slate-500">Live comparison of <b>ERP ledger/posting status</b>, <b>Netbue Access Point delivery</b>, and <b>OTA TDD/MLS status</b> for both sales and purchase documents.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-2xs" role="group" aria-label="Reconciliation direction">
            {(['ALL', 'AR', 'AP'] as DirectionFilter[]).map((value) => (
              <button key={value} type="button" onClick={() => setDirection(value)} className={`rounded-lg px-3 py-2 font-bold ${direction === value ? 'bg-[#0d4f8b] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {value === 'ALL' ? 'AR + AP' : value}
              </button>
            ))}
          </div>
          <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search document or party" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:w-64" /></label>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs text-blue-950">
        <b>{directionLabel}</b> · {scopedInvoices.length} database document{scopedInvoices.length === 1 ? '' : 's'} in the current company scope.
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ['Source 1', direction === 'AP' ? 'Customer ERP AP Ledger' : direction === 'AR' ? 'Customer ERP AR Ledger' : 'Customer ERP GL', `${scopedInvoices.length} Documents`, `${amount(summary.totalVat)} ${direction === 'AP' ? 'Input VAT' : direction === 'AR' ? 'Output VAT' : 'VAT'}`, scopedInvoices.length === 0 ? 'No data' : 'Ledger scope loaded'],
          ['Source 2', 'Netbue Access Point', `${summary.accessPointMatched} Delivered`, `${scopedInvoices.length ? Math.round((summary.accessPointMatched / scopedInvoices.length) * 100) : 0}% matched`, 'UUID / delivery evidence'],
          ['Source 3', 'OTA TDD / MLS', `${summary.otaConfirmed} Confirmed`, `${summary.exceptions.length} exception${summary.exceptions.length === 1 ? '' : 's'}`, 'Clearance and response status'],
        ].map(([source, label, main, secondary, footer], index) => (
          <div key={source} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs"><span className="text-[10px] font-bold uppercase text-slate-500">{source}</span><span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${index === 0 ? 'bg-blue-100 text-blue-800' : index === 1 ? 'bg-[#0d4f8b] text-white' : 'bg-emerald-100 text-emerald-800'}`}>{label}</span></div>
            <div className="text-xl font-black text-slate-900">{main}</div>
            <p className="text-xs text-slate-500">{secondary}</p>
            <div className={`flex items-center gap-1 pt-2 text-xs font-bold ${summary.exceptions.length && index === 2 ? 'text-amber-700' : 'text-emerald-600'}`}>{summary.exceptions.length && index === 2 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{footer}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-800">Reconciliation Exception Aging Register</h3><p className="text-xs text-slate-400">Rejected, queried, or pending AP/AR documents from live invoice data.</p></div><button type="button" onClick={exportReconciliationCsv} disabled={!scopedInvoices.length} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-800 disabled:opacity-40"><Download className="h-4 w-4" />Export</button></div>
        <div className="grid grid-cols-2 gap-3 pt-1 text-center text-xs sm:grid-cols-4">
          {['0–7 Days', '8–15 Days', '16–30 Days', '> 30 Days'].map((label, index) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="block text-[10px] font-bold text-slate-400">{label}</span><span className="text-lg font-bold text-slate-800">{aging[index]} docs</span><span className="mt-0.5 block text-[10px] text-slate-400">{aging[index] ? 'Needs review' : 'Clean'}</span></div>)}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-[#0d4f8b] p-5 text-white shadow-md space-y-3">
        <div className="flex items-center gap-3"><FileCheck className="h-6 w-6 shrink-0 text-emerald-400" /><div><h3 className="text-sm font-bold">Generate Reconciliation Data Pack</h3><p className="text-xs text-slate-300">Exports the visible {directionLabel} ledger, Peppol evidence, OTA state, and exception status for audit review.</p></div></div>
        <button type="button" onClick={handleGeneratePack} disabled={!scopedInvoices.length} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-sm transition-all hover:bg-emerald-600 disabled:opacity-40"><Download className="h-4 w-4" />{packGenerated ? 'Regenerate Reconciliation CSV' : 'Generate Reconciliation CSV'}</button>
        {packGenerated ? <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/80 p-2.5 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />Reconciliation export generated from the current AP/AR filters.</div> : null}
      </div>
    </div>
  );
};
