import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle2, AlertTriangle, RefreshCw, Download, Server } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Invoice } from '../types';

interface UploadBatchViewProps {
  onBatchParsed: (newInvoices: any[]) => void;
  activeTab?: string;
  invoices: Invoice[];
}

const ACCEPTED_EXTENSIONS = ['.xml', '.json', '.csv', '.xlsx'];

/**
 * Client-side content check (item 20): reject files whose real content doesn't match what
 * they claim to be — before anything is sent to the server — with a message the user can act
 * on immediately, rather than a generic server 400/500 after a round-trip. Files with only
 * minor/fixable field-level issues are NOT caught here; those still go through normal
 * server-side validation and land in the per-row error list below.
 */
async function sniffFile(file: File): Promise<string | null> {
  const name = file.name.toLowerCase();
  const ext = ACCEPTED_EXTENSIONS.find((candidate) => name.endsWith(candidate));
  if (!ext) {
    return `Unsupported file type. Accepted formats: ${ACCEPTED_EXTENSIONS.join(', ')}.`;
  }
  if (ext === '.xlsx') {
    const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isZip = header[0] === 0x50 && header[1] === 0x4b; // 'PK' — .xlsx is a zip archive
    if (!isZip) {
      return 'This file is named .xlsx but its content is not a real Excel file (wrong file signature). Re-export it, or upload .csv instead.';
    }
    return null;
  }
  if (ext === '.json') {
    try {
      JSON.parse(await file.text());
      return null;
    } catch {
      return 'This file is not valid JSON — check for a missing bracket, comma, or quote.';
    }
  }
  if (ext === '.xml') {
    const text = await file.text();
    if (!text.trim().startsWith('<')) {
      return 'This file is named .xml but does not start with an XML tag.';
    }
    if (new DOMParser().parseFromString(text, 'application/xml').getElementsByTagName('parsererror').length) {
      return 'This XML file is not well-formed and could not be parsed.';
    }
    return null;
  }
  // .csv
  const text = await file.text();
  if (text.includes('\x00')) {
    return 'This file is named .csv but contains binary data, not plain text.';
  }
  if (!text.trim()) {
    return 'This CSV file is empty.';
  }
  return null;
}

export const UploadBatchView: React.FC<UploadBatchViewProps> = ({ onBatchParsed, invoices, activeTab = 'up_batch' }) => {
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

  const startPipeline = async (files: File[]) => {
    setIsProcessing(true);
    setStage(0);
    setProcessedResult(null);
    const errors: { file: string; rule: string; msg: string }[] = [];
    const items: any[] = [];

    // Client-side content validation happens before anything touches the network — files that
    // fail are reported immediately and excluded from the upload, not silently sent through.
    const validFiles: File[] = [];
    for (const file of files) {
      const issue = await sniffFile(file);
      if (issue) {
        errors.push({ file: file.name, rule: 'file-type', msg: issue });
      } else {
        validFiles.push(file);
      }
    }

    try {
      setStage(1);
      const created: any[] = [];
      for (const file of validFiles) {
        try {
          if (file.name.toLowerCase().endsWith('.json')) {
            const parsed = JSON.parse(await file.text());
            items.push(...(Array.isArray(parsed) ? parsed : parsed.items || [parsed]));
          } else {
            const form = new FormData();
            form.append('file', file);
            const result = await apiFetch<{ created: any[]; errors?: any[] }>('/api/upload-batch/file', { method: 'POST', body: form });
            created.push(...result.created);
            for (const failure of result.errors || []) {
              const details = failure.errors?.length ? failure.errors : [{ rule: 'validation', message: failure.error }];
              details.forEach((detail: any) => errors.push({
                file: `${file.name}${failure.invoice_number ? ` · ${failure.invoice_number}` : ''}`,
                rule: detail.rule || detail.field || 'validation', msg: detail.message || failure.error
              }));
            }
          }
        } catch (error) {
          errors.push({ file: file.name, rule: 'upload-error', msg: error instanceof Error ? error.message : 'Upload failed.' });
        }
      }
      setStage(3);
      const result = items.length
        ? await apiFetch<{ created: any[]; errors?: any[] }>('/api/upload-batch', { method: 'POST', body: JSON.stringify({ items }) })
        : { created: [], errors: [] };
      created.push(...result.created);
      for (const failure of result.errors || []) {
        const details = failure.errors?.length ? failure.errors : [{ rule: 'validation', message: failure.error }];
        details.forEach((detail: any) => errors.push({
          file: failure.invoice_number || `Row ${failure.row}`,
          rule: detail.rule || detail.field || 'validation', msg: detail.message || failure.error
        }));
      }
      setStage(4);
      const rejectedDocuments = created.filter((document) => document.st === 'Rejected').length;
      setProcessedResult({
        total: Math.max(created.length, files.length),
        valid: created.length - rejectedDocuments,
        failed: rejectedDocuments || errors.length,
        errors,
      });
      onBatchParsed(created);
    } catch (error) {
      setProcessedResult({ total: items.length, valid: 0, failed: items.length || 1,
        errors: [{ file: 'batch', rule: 'api-error', msg: error instanceof Error ? error.message : 'Upload failed.' }] });
    } finally {
      setIsProcessing(false);
    }
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
            multiple={!isIndividual}
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
        <div role="status" className={`border-2 rounded-2xl p-5 shadow-2xs space-y-4 animate-fadeIn ${processedResult.failed ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'}`}>
          <div className={`font-bold text-sm flex items-center gap-2 ${processedResult.failed ? 'text-red-900' : 'text-emerald-900'}`}>
            {processedResult.failed ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            <span>{processedResult.failed ? `Upload completed with ${processedResult.failed} rejected document(s). Open the rejected document to correct the highlighted fields.` : `Upload successful. ${processedResult.valid} document(s) validated and stored.`}</span>
          </div>
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
              {invoices.filter((invoice) => invoice.source === 'BATCH').length} Uploaded Documents
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Real-time status monitor of incoming batch files queued for Schematron validation, AS4 packaging, and OTA transmission.
          </p>

          <div className="space-y-2.5 pt-1 text-xs">
            {invoices.filter((invoice) => invoice.source === 'BATCH').map((invoice) => (
              <button key={invoice.id || invoice.n} onClick={() => onBatchParsed([])}
                className="w-full text-left p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between">
                <div><b className="font-mono text-slate-900 block">{invoice.n}</b>
                  <span className="text-[11px] text-slate-500">{invoice.cp} · {invoice.createdAt || invoice.d}</span></div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">{invoice.st}</span>
              </button>
            ))}
            {invoices.every((invoice) => invoice.source !== 'BATCH') && <p className="p-4 text-center text-slate-400">No uploaded documents in this tenant scope.</p>}
            <div className="hidden">
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
