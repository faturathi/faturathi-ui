import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, FileCheck, Download } from 'lucide-react';

export const ReconciliationView: React.FC = () => {
  const [packGenerated, setPackGenerated] = useState(false);

  const handleGeneratePack = () => {
    setPackGenerated(true);
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '#';
      link.setAttribute('download', 'VAT_Compliance_Pack_July_2026.zip');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span>Reconciliation &amp; 3-Way Match <span className="text-sm font-normal text-slate-500 font-arabic">المطابقة الثلاثية</span></span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Automated 3-way reconciliation between <b>ERP General Ledger</b>, <b>Netbue Access Point Logs</b>, and <b>Oman Tax Authority TDD Register</b>.
        </p>
      </div>

      {/* 3-Way Reconciliation Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Source 1</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">ERP Ledger</span>
          </div>
          <div className="text-xl font-black text-slate-900">1,284 Invoices</div>
          <p className="text-xs text-slate-500">16,890.121 OMR Output VAT</p>
          <div className="pt-2 text-emerald-600 font-bold text-xs flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> 100% Synced
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Source 2</span>
            <span className="px-2 py-0.5 bg-[#0d4f8b] text-white rounded font-semibold text-[10px]">Netbue Access Point</span>
          </div>
          <div className="text-xl font-black text-slate-900">1,284 Delivered</div>
          <p className="text-xs text-slate-500">16,890.121 OMR Verified</p>
          <div className="pt-2 text-emerald-600 font-bold text-xs flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> 100% Match
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Source 3</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">OTA TDD Database</span>
          </div>
          <div className="text-xl font-black text-slate-900">1,284 Confirmed</div>
          <p className="text-xs text-slate-500">16,890.121 OMR Acked</p>
          <div className="pt-2 text-emerald-600 font-bold text-xs flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> 0 Variance
          </div>
        </div>
      </div>

      {/* Exception Aging Register */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Reconciliation Exception Aging Register</h3>
        <p className="text-xs text-slate-400">Aging breakdown of un-reconciled invoices or pending MLS acknowledgments.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block">0–7 Days</span>
            <span className="text-lg font-bold text-slate-800">1 doc</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">INV-2026-07-0231 (Rejected)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block">8–15 Days</span>
            <span className="text-lg font-bold text-slate-800">0 docs</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Clean</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block">16–30 Days</span>
            <span className="text-lg font-bold text-slate-800">0 docs</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Clean</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block">&gt; 30 Days</span>
            <span className="text-lg font-bold text-slate-800">0 docs</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Clean</span>
          </div>
        </div>
      </div>

      {/* Trigger Month-End Pack Generation */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-[#0d4f8b] text-white rounded-2xl shadow-md space-y-3">
        <div className="flex items-center gap-3">
          <FileCheck className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Generate Month-End VAT Reconciliation Pack</h3>
            <p className="text-xs text-slate-300">
              Produces signed ZIP containing SAF-T audit file, XML archive digest, and signed 3-way match declaration for OTA audit submission.
            </p>
          </div>
        </div>

        <button
          onClick={handleGeneratePack}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-sm cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>{packGenerated ? 'Regenerate VAT Compliance Pack' : 'Generate VAT Compliance Pack (July 2026)'}</span>
        </button>

        {packGenerated && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Package compiled! Downloading SAF-T XML + Signed Audit Trail ZIP file.</span>
          </div>
        )}
      </div>
    </div>
  );
};
