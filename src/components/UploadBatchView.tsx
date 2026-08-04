import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle2, AlertTriangle, RefreshCw, Download, Server } from 'lucide-react';

interface UploadBatchViewProps {
  onBatchParsed: (newInvoices: any[]) => void;
  activeTab?: string;
}

export const UploadBatchView: React.FC<UploadBatchViewProps> = ({ onBatchParsed, activeTab = 'up_batch' }) => {
  const isIndividual = activeTab === 'up';
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedResult, setProcessedResult] = useState<{
    total: number;
    valid: number;
    failed: number;
    errors: { file: string; rule: string; msg: string }[];
  } | null>(null);

  const stages = [
    'Parsing file payloads...',
    'Checking PINT OM v1.0.1 Schematron rules...',
    'Generating deterministic UUIDv5 (BTOM-002)...',
    'Packaging AS4 message container...',
    'Transmitting & queuing TDD records...'
  ];

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files) as File[];
      setUploadedFiles(filesArr);
      startPipeline(filesArr);
    }
  };

  const startPipeline = (files: File[]) => {
    setIsProcessing(true);
    setStage(0);
    setProcessedResult(null);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < stages.length) {
        setStage(current);
      } else {
        clearInterval(interval);
        setIsProcessing(false);

        // Generate mock parsed invoices from uploaded batch
        const parsedInvoices = files.map((f, idx) => ({
          n: `BATCH-${Date.now().toString().slice(-4)}-${idx + 1}`,
          d: new Date().toISOString().slice(0, 10),
          t: '15:10:00',
          type: 'Standard Invoice',
          dir: 'Outbound (AR)',
          cp: `Batch Customer ${idx + 1} SAOC`,
          cpv: `OM1100${800000 + idx}`,
          eas: `0248:OM1100${800000 + idx}`,
          net: 450.0 + idx * 50,
          vat: 22.5 + idx * 2.5,
          st: 'Reported',
          tdd: 'Reported',
          tt: '10000000000000000000',
          cat: 'S 5%',
          b2c: false,
          lines: [['Bulk import item line', 1, 450.0 + idx * 50, 'S 5%']],
          sVat: 'OM1100123456'
        }));

        setProcessedResult({
          total: files.length + 12,
          valid: files.length + 11,
          failed: 1,
          errors: [
            {
              file: 'batch_inv_007.xml',
              rule: 'ibr-003-om',
              msg: 'Seller VAT identifier "OM9911" is not 10 digits.'
            }
          ]
        });

        onBatchParsed(parsedInvoices);
      }
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="bg-[#0d4f8b] text-white text-xs px-2 py-0.5 rounded-md font-mono">
              {isIndividual ? 'C.1' : 'C.2'}
            </span>
            <span>{isIndividual ? 'Upload Individual Invoice Payload' : 'Upload Batch Ingestion Pipeline'}</span>
            <span className="text-sm font-normal text-slate-500 font-arabic">رفع الفواتير</span>
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isIndividual 
            ? 'Single invoice payload importer. Supports XML (UBL 2.1 PINT-OM), JSON, and Excel single files with live instant validation.' 
            : 'High-volume batch invoice processing pipeline. Upload ZIP archives, multi-row Excel / CSV, or bulk UBL XML files.'}
        </p>
      </div>

      {/* Main Upload Drag & Drop Zone */}
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-4 hover:border-[#0d4f8b] transition-colors bg-slate-50/50">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-[#0d4f8b] flex items-center justify-center">
          <Upload className="h-6 w-6" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Drag &amp; drop invoice batch files here, or click to browse
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Supports UBL 2.1 XML (<code className="font-mono text-[11px]">urn:peppol:pint:billing-1@om-1</code>), JSON, CSV, XLSX. Maximum 5,000 invoices per batch.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0d4f8b] hover:bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition-all">
          <FileCode className="h-4 w-4" />
          <span>Select Batch File</span>
          <input
            type="file"
            multiple
            accept=".xml,.json,.csv,.xlsx"
            onChange={handleFileDrop}
            className="hidden"
          />
        </label>
      </div>

      {/* Processing Pipeline Animation */}
      {isProcessing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 text-center animate-fadeIn">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#0d4f8b]">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Processing Batch Pipeline...</span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden max-w-md mx-auto">
            <div
              className="h-full bg-gradient-to-r from-[#0d4f8b] to-[#0e8f6f] transition-all duration-300"
              style={{ width: `${((stage + 1) / stages.length) * 100}%` }}
            ></div>
          </div>

          <div className="text-xs font-semibold text-slate-700 font-mono">
            Step {stage + 1} of {stages.length}: {stages[stage]}
          </div>
        </div>
      )}

      {/* Batch Results Output */}
      {processedResult && !isProcessing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">Batch Processing Summary</h3>
            <span className="text-xs text-slate-400">Execution time: 1.24s</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Processed</span>
              <span className="text-lg font-black text-slate-800">{processedResult.total}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Valid &amp; Reported</span>
              <span className="text-lg font-black text-emerald-700">{processedResult.valid}</span>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <span className="text-[10px] text-red-700 font-bold uppercase block">Validation Errors</span>
              <span className="text-lg font-black text-red-700">{processedResult.failed}</span>
            </div>
          </div>

          {processedResult.errors.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs text-red-900">
              <div className="font-bold flex items-center gap-1.5 text-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Failed Document Line Items</span>
              </div>
              {processedResult.errors.map((err, idx) => (
                <div key={idx} className="p-2 bg-white rounded-lg border border-red-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{err.file}</span> — <code className="font-mono text-red-700 font-bold">{err.rule}</code>: {err.msg}
                  </div>
                  <button className="px-2 py-1 bg-red-100 text-red-800 hover:bg-red-200 text-[10px] font-bold rounded cursor-pointer">
                    Fix Line
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ingestion Channels & Pending Batch Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending & Processed Batch Invoices Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#0d4f8b]" />
              <span>Pending &amp; Processed Batch Queue Status</span>
            </h3>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
              3 Active Batches
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Real-time status monitor of incoming batch files queued for Schematron validation, AS4 packaging, and OTA transmission.
          </p>

          <div className="space-y-2.5 pt-1 text-xs">
            {/* Batch 1: Pending Approver Review */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <b className="font-mono text-slate-900 block font-bold">BATCH-20260801-9012 (POS Salalah Store)</b>
                  <span className="text-[11px] text-slate-500">48 Invoices · Uploaded by Maker at 14:22</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded-md">
                  Pending Approver Review
                </span>
              </div>
              <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full w-2/3"></div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-800 font-medium">32 of 48 validated — waiting for Final Finance Approver</span>
                <button
                  onClick={() => onBatchParsed([
                    { n: 'INV-BATCH-9012-1', d: '2026-08-01', t: '14:22:00', type: 'Full Tax Invoice', dir: 'Outbound (AR)', cp: 'Salalah Hypermarket SAOC', cpv: 'OM1100887766', eas: '0248:OM1100887766', net: 1200.0, vat: 60.0, st: 'Draft (Pending Review)', tdd: 'Pending Review', tt: '10000000000000000000', cat: 'S 5%', b2c: false, lines: [['Bulk store item', 1, 1200.0, 'S 5%']] }
                  ])}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Review Batch
                </button>
              </div>
            </div>

            {/* Batch 2: In Queue Processing */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <b className="font-mono text-slate-900 block font-bold">BATCH-20260801-8954 (SAP S/4HANA Sync)</b>
                  <span className="text-[11px] text-slate-500">120 Invoices · Automatic REST API Push</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-200 text-blue-900 font-bold text-[10px] rounded-md flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Processing (85%)
                </span>
              </div>
              <div className="w-full bg-blue-200/60 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[85%] transition-all duration-500"></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-blue-900">
                <span>Checking Schematron rules &amp; signing XML payloads...</span>
                <span className="font-mono font-bold">ETA ~2s</span>
              </div>
            </div>

            {/* Batch 3: Completed */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <b className="font-mono text-slate-900 block font-bold">BATCH-20260801-8810 (SFTP Manual Upload)</b>
                  <span className="text-[11px] text-slate-500">250 Invoices · Processed today at 11:05</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-md flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Completed &amp; Reported
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-900 pt-1 border-t border-emerald-200/60">
                <span>250 of 250 transmitted to OTA with Peppol AS4 receipt</span>
                <span className="font-bold">100% Success</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ingestion Channels Reference */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Server className="h-4 w-4 text-[#0d4f8b]" />
            <span>Automated Ingestion Channels</span>
          </h3>
          <p className="text-xs text-slate-500">
            In addition to web upload, Faturathi provides secure API endpoints and direct SFTP watch folders for seamless ERP integration.
          </p>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <b className="font-bold text-slate-900 block">REST API</b>
              <code className="text-[10px] font-mono text-blue-700 block mt-0.5">POST /api/invoices</code>
              <p className="text-slate-500 mt-1">JSON / XML payload with bearer token auth. Sub-second validation response.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <b className="font-bold text-slate-900 block">SFTP Drop Folder</b>
              <code className="text-[10px] font-mono text-blue-700 block mt-0.5">sftp.netbue.com/inbound</code>
              <p className="text-slate-500 mt-1">Polls every 60s. Auto-validates and writes back .ack or .err log files.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <b className="font-bold text-slate-900 block">ERP Connectors</b>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">SAP · Oracle · Dynamics 365</span>
              <p className="text-slate-500 mt-1">Pre-built mapping modules for standard ERP invoice IDoc / payload schemas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
