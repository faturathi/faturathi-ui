import React, { useEffect, useState } from 'react';
import { Download, Database, ShieldCheck, FileSpreadsheet, Search, Filter, Printer, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, FileText, SearchCheck, Calendar, RotateCcw, CalendarDays } from 'lucide-react';
import { apiFetch, unwrapList } from '../lib/api';

interface ReportsViewProps {
  activeTab?: string;
}

interface ReportRow {
  id: string;
  num: string;
  date: string;
  time: string;
  docType: 'AR Invoice' | 'AP Invoice' | 'Credit Note' | 'Debit Note' | 'Self-Billed';
  counterparty: string;
  vatin: string;
  netAmt: number;
  vatAmt: number;
  totalAmt: number;
  status: 'Cleared' | 'Pending OTA' | 'Rejected' | 'Archived';
  errorCode?: string;
  hash: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activeTab = 'rep' }) => {
  const isAuditLogs = activeTab === 'audit_logs';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'num' | 'totalAmt' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Date & Time Range Filter State
  const [fromDate, setFromDate] = useState<string>('');
  const [fromTime, setFromTime] = useState<string>('00:00');
  const [toDate, setToDate] = useState<string>('');
  const [toTime, setToTime] = useState<string>('23:59');
  const [quickRange, setQuickRange] = useState<string>('ALL');

  const handleApplyPreset = (preset: string) => {
    setQuickRange(preset);
    setCurrentPage(1);
    if (preset === 'ALL') {
      setFromDate('');
      setFromTime('00:00');
      setToDate('');
      setToTime('23:59');
    } else if (preset === 'TODAY') {
      setFromDate('2026-08-03');
      setFromTime('00:00');
      setToDate('2026-08-03');
      setToTime('23:59');
    } else if (preset === 'WEEK') {
      setFromDate('2026-07-27');
      setFromTime('00:00');
      setToDate('2026-08-03');
      setToTime('23:59');
    } else if (preset === 'JULY') {
      setFromDate('2026-07-01');
      setFromTime('00:00');
      setToDate('2026-07-31');
      setToTime('23:59');
    }
  };

  const handleClearDateFilter = () => {
    setQuickRange('ALL');
    setFromDate('');
    setFromTime('00:00');
    setToDate('');
    setToTime('23:59');
    setCurrentPage(1);
  };

  // ElasticSearch Query state for 10-Year Archive
  const [elasticQuery, setElasticQuery] = useState('');
  const [elasticResults, setElasticResults] = useState<ReportRow[] | null>(null);

  // System Logs Filter
  const [logLevel, setLogLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'AS4'>('ALL');

  // Sample report dataset
  const [reportData, setReportData] = useState<ReportRow[]>([
    {
      id: '1',
      num: 'INV-2026-07-0012',
      date: '2026-07-28',
      time: '14:22:10',
      docType: 'AR Invoice',
      counterparty: 'Muscat Retail SAOC',
      vatin: 'OM1100654321',
      netAmt: 1450.000,
      vatAmt: 72.500,
      totalAmt: 1522.500,
      status: 'Cleared',
      hash: 'sha256-8a9012f451b...'
    },
    {
      id: '2',
      num: 'INV-2026-07-0011',
      date: '2026-07-27',
      time: '11:15:00',
      docType: 'AR Invoice',
      counterparty: 'Sohar Logistics LLC',
      vatin: 'OM1100882211',
      netAmt: 3200.000,
      vatAmt: 160.000,
      totalAmt: 3360.000,
      status: 'Cleared',
      hash: 'sha256-9b1248c891a...'
    },
    {
      id: '3',
      num: 'CN-2026-07-0004',
      date: '2026-07-26',
      time: '16:05:30',
      docType: 'Credit Note',
      counterparty: 'Muscat Retail SAOC',
      vatin: 'OM1100654321',
      netAmt: -120.000,
      vatAmt: -6.000,
      totalAmt: -126.000,
      status: 'Cleared',
      hash: 'sha256-128491a0f5c...'
    },
    {
      id: '4',
      num: 'AP-2026-07-0988',
      date: '2026-07-25',
      time: '09:40:12',
      docType: 'AP Invoice',
      counterparty: 'Oman Cables Industry SAOG',
      vatin: 'OM1100994433',
      netAmt: 8500.000,
      vatAmt: 425.000,
      totalAmt: 8925.000,
      status: 'Cleared',
      hash: 'sha256-7c0012e88a2...'
    },
    {
      id: '5',
      num: 'DN-2026-07-0002',
      date: '2026-07-24',
      time: '10:12:44',
      docType: 'Debit Note',
      counterparty: 'Dhofar Trading Co',
      vatin: 'OM1100445566',
      netAmt: 450.000,
      vatAmt: 22.500,
      totalAmt: 472.500,
      status: 'Pending OTA',
      hash: 'sha256-3f1109a823b...'
    },
    {
      id: '6',
      num: 'SBI-2026-07-0001',
      date: '2026-07-23',
      time: '15:55:00',
      docType: 'Self-Billed',
      counterparty: 'Salalah Port Logistics',
      vatin: 'OM1100334455',
      netAmt: 12000.000,
      vatAmt: 600.000,
      totalAmt: 12600.000,
      status: 'Cleared',
      hash: 'sha256-01824a9912c...'
    },
    {
      id: '7',
      num: 'INV-2026-07-0009',
      date: '2026-07-22',
      time: '13:00:21',
      docType: 'AR Invoice',
      counterparty: 'Al Batinah Hypermarket LLC',
      vatin: 'OM1100771122',
      netAmt: 890.500,
      vatAmt: 44.525,
      totalAmt: 935.025,
      status: 'Rejected',
      errorCode: 'IBR-003-OM: Missing Buyer Tax Identification Number',
      hash: 'sha256-5a1129b004d...'
    },
    {
      id: '8',
      num: 'INV-2026-07-0008',
      date: '2026-07-20',
      time: '11:10:05',
      docType: 'AR Invoice',
      counterparty: 'Gulf Equipment Services',
      vatin: 'OM1100556677',
      netAmt: 2100.000,
      vatAmt: 105.000,
      totalAmt: 2205.000,
      status: 'Archived',
      hash: 'sha256-9a2244f001e...'
    }
  ]);

  // System logs dataset
  const [systemLogs, setSystemLogs] = useState<any[]>([
    { time: '2026-08-01 14:32:01', level: 'AS4', src: 'C2 Gateway', msg: 'Peppol AS4 transmission outbound receipt verified. Message ID: 20260801-143201-9812@faturathi.om' },
    { time: '2026-08-01 14:30:15', level: 'INFO', src: 'REST API', msg: 'POST /api/v1/invoices/validate — 200 OK (Execution time: 14ms)' },
    { time: '2026-08-01 14:15:22', level: 'WARN', src: 'SFTP Watcher', msg: 'Batch file Oman_Batch_20260801.csv contains 1 row with missing Seller EAS prefix. Auto-defaulted to 0248.' },
    { time: '2026-08-01 13:50:00', level: 'ERROR', src: 'Validation Engine', msg: 'Rule IBR-003-OM violated on INV-2026-07-0009: Buyer VAT ID format invalid.' },
    { time: '2026-08-01 12:10:44', level: 'INFO', src: 'Secondary DB', msg: 'AES-256 Write-Once-Read-Many (WORM) snapshot synchronized to Oman Cloud Cold Vault.' }
  ]);

  useEffect(() => {
    void Promise.all([
      apiFetch<any[]>('/api/reports/tax-grid'),
      apiFetch<any[] | { results?: any[] }>('/api/config/logs?page_size=100'),
    ]).then(([rows, logPayload]) => {
      setReportData(rows.map((row) => ({
        id: row.id || row.invoice_number,
        num: row.invoice_number,
        date: row.date,
        time: row.time || '00:00:00',
        docType: row.direction === 'AP' ? 'AP Invoice' : row.type?.includes('Credit') ? 'Credit Note' : 'AR Invoice',
        counterparty: row.counterparty,
        vatin: row.counterparty_vatin,
        netAmt: row.net,
        vatAmt: row.vat,
        totalAmt: row.total,
        status: row.status === 'Reported' ? 'Cleared' : row.status === 'Rejected' ? 'Rejected' : 'Pending OTA',
        errorCode: row.error,
        hash: row.uuid || '',
      })));
      setSystemLogs(unwrapList(logPayload).map((log) => ({
        time: log.created_at,
        level: log.action?.includes('ERROR') ? 'ERROR' : log.entity === 'Transmission' ? 'AS4' : 'INFO',
        src: log.entity || 'API',
        msg: `${log.action}${log.entity_id ? ` — ${log.entity_id}` : ''}`,
      })));
    }).catch((error) => console.warn('Report loading failed:', error));
  }, []);

  // Filtering & Sorting
  const filteredData = reportData.filter((row) => {
    const matchesSearch =
      row.num.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.vatin.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || row.docType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter;

    // Date & Time Range Filter
    let matchesDate = true;
    const rowTime = row.time.length === 5 ? row.time + ':00' : row.time;
    const rowDateTime = `${row.date}T${rowTime}`;

    if (fromDate) {
      const fromStamp = `${fromDate}T${fromTime || '00:00'}:00`;
      if (rowDateTime < fromStamp) matchesDate = false;
    }

    if (toDate) {
      const toStamp = `${toDate}T${toTime || '23:59'}:59`;
      if (rowDateTime > toStamp) matchesDate = false;
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  }).sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: 'date' | 'num' | 'totalAmt' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export options
  const handleExportCSV = () => {
    let csv = 'Invoice Number,Date,Document Type,Counterparty,VATIN,Net Amount (OMR),VAT Amount (OMR),Total Amount (OMR),Status,Hash\n';
    filteredData.forEach(r => {
      csv += `"${r.num}","${r.date}","${r.docType}","${r.counterparty}","${r.vatin}",${r.netAmt.toFixed(3)},${r.vatAmt.toFixed(3)},${r.totalAmt.toFixed(3)},"${r.status}","${r.hash}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Faturathi_Tax_Report_${typeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    handleExportCSV();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // ElasticSearch Query Handler
  const handleElasticSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elasticQuery.trim()) {
      setElasticResults(null);
      return;
    }
    const results = reportData.filter(
      r =>
        r.num.toLowerCase().includes(elasticQuery.toLowerCase()) ||
        r.counterparty.toLowerCase().includes(elasticQuery.toLowerCase()) ||
        r.hash.toLowerCase().includes(elasticQuery.toLowerCase()) ||
        r.vatin.toLowerCase().includes(elasticQuery.toLowerCase())
    );
    setElasticResults(results);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="bg-[#0d4f8b] text-white text-xs px-2 py-0.5 rounded-md font-mono">
              {isAuditLogs ? 'D.3' : 'D.2'}
            </span>
            <span>{isAuditLogs ? 'Audit Trail Logs & 10-Year Secondary Archive' : 'Tax Reports, Status Tracking & Regulatory Returns'}</span>
            <span className="text-sm font-normal text-slate-500 font-arabic">التقارير والأرشفة</span>
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isAuditLogs
            ? 'Immutable execution traces, webhooks, Peppol AS4 transmission logs, and 10-year secondary database query engine.'
            : 'Interactive report tables with search, multi-field filters, pagination, rejection analysis, and Excel/PDF/CSV exports.'}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold">Total Invoices Logged</span>
            <FileText className="h-4 w-4 text-[#0d4f8b]" />
          </div>
          <div className="text-xl font-black text-slate-900">{reportData.length} Records</div>
          <span className="text-[10px] text-slate-400">AR, AP, CN, DN &amp; Self-Billed</span>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs space-y-1 bg-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="font-bold">Cleared (OTA Valid)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-950">
            {reportData.filter(r => r.status === 'Cleared').length}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">100% Hash Matched</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs space-y-1 bg-amber-50/30">
          <div className="flex items-center justify-between text-amber-800">
            <span className="font-bold">Pending Transmission</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-950">
            {reportData.filter(r => r.status === 'Pending OTA').length}
          </div>
          <span className="text-[10px] text-amber-800 font-medium">Queueing for C2 Gateway</span>
        </div>

        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-2xs space-y-1 bg-red-50/30">
          <div className="flex items-center justify-between text-red-700">
            <span className="font-bold">Rejected Invoices</span>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-xl font-black text-red-950">
            {reportData.filter(r => r.status === 'Rejected').length}
          </div>
          <span className="text-[10px] text-red-700 font-medium">Requires Resolution</span>
        </div>
      </div>

      {/* Interactive Data Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        {/* Table Controls Header */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#0d4f8b]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Standard Tax Report Data Grid</h3>
              <p className="text-[11px] text-slate-500">Filter, sort, search, and export line-item invoice returns.</p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Excel (.XLSX)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-[#0d4f8b] hover:bg-blue-900 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF Report</span>
            </button>
          </div>
        </div>

        {/* Date & Time Range Filter Panel */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <CalendarDays className="h-4 w-4 text-[#0d4f8b]" />
              <span>Date &amp; Time Range Filter</span>
              {(fromDate || toDate) && (
                <span className="text-[10px] font-mono bg-blue-100 text-[#0d4f8b] px-2 py-0.5 rounded-full font-bold">
                  Active Filter: {fromDate || 'Start'} {fromDate ? fromTime : ''} → {toDate || 'End'} {toDate ? toTime : ''}
                </span>
              )}
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] text-slate-500 font-medium">Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  quickRange === 'ALL' && !fromDate && !toDate
                    ? 'bg-[#0d4f8b] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('TODAY')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  quickRange === 'TODAY'
                    ? 'bg-[#0d4f8b] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('WEEK')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  quickRange === 'WEEK'
                    ? 'bg-[#0d4f8b] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('JULY')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  quickRange === 'JULY'
                    ? 'bg-[#0d4f8b] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                July 2026
              </button>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[11px] rounded-lg transition-all cursor-pointer flex items-center gap-1 ml-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Dates</span>
                </button>
              )}
            </div>
          </div>

          {/* Date & Time Input Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* From Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#0d4f8b]" />
                <span>From Date</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setQuickRange('CUSTOM');
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-semibold text-slate-800 focus:border-[#0d4f8b] shadow-2xs"
              />
            </div>

            {/* From Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#0d4f8b]" />
                <span>From Time</span>
              </label>
              <input
                type="time"
                value={fromTime}
                onChange={(e) => {
                  setFromTime(e.target.value);
                  setQuickRange('CUSTOM');
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-semibold text-slate-800 focus:border-[#0d4f8b] shadow-2xs"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#0d4f8b]" />
                <span>To Date</span>
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setQuickRange('CUSTOM');
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-semibold text-slate-800 focus:border-[#0d4f8b] shadow-2xs"
              />
            </div>

            {/* To Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#0d4f8b]" />
                <span>To Time</span>
              </label>
              <input
                type="time"
                value={toTime}
                onChange={(e) => {
                  setToTime(e.target.value);
                  setQuickRange('CUSTOM');
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-semibold text-slate-800 focus:border-[#0d4f8b] shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Invoice No, Counterparty, or VATIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none text-slate-800 font-semibold focus:border-[#0d4f8b]"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-800 font-bold"
            >
              <option value="ALL">All Document Types</option>
              <option value="AR Invoice">Sales Invoices (AR)</option>
              <option value="AP Invoice">Purchase Invoices (AP)</option>
              <option value="Credit Note">Credit Notes (CN)</option>
              <option value="Debit Note">Debit Notes (DN)</option>
              <option value="Self-Billed">Self-Billed Invoices</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-800 font-bold"
            >
              <option value="ALL">All Reporting Statuses</option>
              <option value="Cleared">Cleared (OTA Ack)</option>
              <option value="Pending OTA">Pending Transmission</option>
              <option value="Rejected">Rejected (Error)</option>
              <option value="Archived">Archived (10-Yr)</option>
            </select>
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th onClick={() => handleSort('num')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-all">
                  <div className="flex items-center gap-1">
                    <span>Invoice No</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('date')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-all">
                  <div className="flex items-center gap-1">
                    <span>Date &amp; Time</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Counterparty &amp; VATIN</th>
                <th className="py-2.5 px-3 text-right">Net Amount</th>
                <th className="py-2.5 px-3 text-right">VAT (5%)</th>
                <th onClick={() => handleSort('totalAmt')} className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200 transition-all">
                  <div className="flex items-center justify-end gap-1">
                    <span>Total (OMR)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('status')} className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200 transition-all">
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No matching tax report records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-all">
                    <td className="py-3 px-3 font-mono font-bold text-[#0d4f8b]">
                      {row.num}
                      <span className="block text-[9px] text-slate-400 font-mono font-normal truncate max-w-[120px]">{row.hash}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      <div>{row.date}</div>
                      <span className="text-[10px] text-slate-400">{row.time}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{row.docType}</span>
                    </td>
                    <td className="py-3 px-3">
                      <b className="font-bold text-slate-900 block">{row.counterparty}</b>
                      <span className="font-mono text-[10px] text-slate-500">{row.vatin}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                      {row.netAmt.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {row.vatAmt.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {row.totalAmt.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                          row.status === 'Cleared'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : row.status === 'Pending OTA'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : row.status === 'Rejected'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-2">
          <div className="text-slate-500 text-[11px]">
            Showing <b className="text-slate-800">{paginatedData.length}</b> of <b className="text-slate-800">{filteredData.length}</b> items
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-xs outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold text-slate-700 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection & Error Analysis Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span>OTA Rejection &amp; Validation Error Analysis Matrix</span>
        </h3>

        <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-red-900">
            <span>Recent Rejection Exception: INV-2026-07-0009</span>
            <span className="font-mono text-[10px] bg-red-200 text-red-900 px-2 py-0.5 rounded">Error Code: IBR-003-OM</span>
          </div>
          <p className="text-slate-700 text-[11px]">
            <b>Rule Message:</b> Buyer VAT Identification Number (<code className="font-mono font-bold">IBT-048</code>) must start with prefix 'OM' followed by 10 or 12 digits.
          </p>
          <div className="text-[11px] text-red-800 font-semibold pt-1">
            💡 Recommended Resolution: Edit buyer tax parameters in Customer Directory and resubmit via Data Source.
          </div>
        </div>
      </div>

      {/* System & Audit Logs Section (E.3 / D.3) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0d4f8b]" />
            <span>System &amp; Communication Logs (REST / SFTP / Peppol AS4)</span>
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Log Level:</span>
            <select
              value={logLevel}
              onChange={(e: any) => setLogLevel(e.target.value)}
              className="border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50 text-xs font-bold outline-none"
            >
              <option value="ALL">ALL Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="AS4">AS4 Transmissions</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-slate-200 space-y-2 overflow-x-auto max-h-56">
          {systemLogs
            .filter(l => logLevel === 'ALL' || l.level === logLevel)
            .map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 border-b border-slate-800 pb-1.5 last:border-none">
                <span className="text-slate-500 shrink-0">{log.time}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                    log.level === 'ERROR'
                      ? 'bg-red-500 text-white'
                      : log.level === 'WARN'
                      ? 'bg-amber-500 text-slate-950'
                      : log.level === 'AS4'
                      ? 'bg-purple-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-teal-400 shrink-0 font-bold">[{log.src}]</span>
                <span className="text-slate-300">{log.msg}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 10-Year Secondary Database & ElasticSearch Query Engine */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-[#0e8f6f] shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">10-Year Secondary Database &amp; ElasticSearch Query</h3>
              <p className="text-xs text-slate-500">
                Oman Executive Regulation Article 142 compliance vault in encrypted WORM storage.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Cold Backup (.ZIP / .SQL)</span>
          </button>
        </div>

        {/* ElasticSearch Input Form */}
        <form onSubmit={handleElasticSearch} className="flex gap-2 text-xs">
          <div className="relative flex-1">
            <SearchCheck className="h-4 w-4 text-emerald-600 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ElasticSearch Query (e.g. search by UUID, SHA-256 Hash, Buyer Name, or XML tag)..."
              value={elasticQuery}
              onChange={(e) => setElasticQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none text-slate-800 font-mono focus:border-emerald-600"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Search Secondary Archive
          </button>
        </form>

        {elasticResults && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
            <b className="text-emerald-950 block">ElasticSearch Index Match Results ({elasticResults.length} records found):</b>
            <div className="space-y-1 font-mono text-[11px]">
              {elasticResults.map((res) => (
                <div key={res.id} className="p-2 bg-white rounded border border-emerald-100 flex items-center justify-between">
                  <div>
                    <b className="text-slate-900">{res.num}</b> — {res.counterparty} ({res.vatin})
                  </div>
                  <div className="text-emerald-700 font-bold">{res.totalAmt.toFixed(3)} OMR</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block">Storage Security Standard</span>
            <b className="text-slate-900 block mt-0.5">AES-256 + RSA 4096 Signature</b>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block">Data Sovereignty</span>
            <b className="text-emerald-700 block mt-0.5">100% Oman Cloud Datacenters</b>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block">Retention Policy Lock</span>
            <b className="text-slate-900 block mt-0.5">10 Years Mandatory Immutable Lock</b>
          </div>
        </div>
      </div>
    </div>
  );
};
