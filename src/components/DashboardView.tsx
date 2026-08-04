import React, { useState } from 'react';
import { Invoice, RoleMode } from '../types';
import { TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardViewProps {
  invoices: Invoice[];
  maskAmounts: boolean;
  onSelectInvoice: (inv: Invoice) => void;
  selectedEntity: string;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  maskAmounts,
  onSelectInvoice,
  selectedEntity,
  onNavigateTab
}) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [apArFilter, setApArFilter] = useState<'all' | 'ar' | 'ap'>('all');

  // Calculate filtered counts
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedEntity && inv.ent !== selectedEntity) return false;
    if (apArFilter === 'ar') return inv.dir === 'Outbound (AR)';
    if (apArFilter === 'ap') return inv.dir === 'Inbound (AP)';
    return true;
  });

  const totalCount = filteredInvoices.length;
  const validatedCount = filteredInvoices.filter((i) => i.st === 'Reported').length;
  const verifiedCount = Math.max(0, validatedCount - 3);
  const pendingCount = filteredInvoices.filter((i) => i.st === 'Pending' || i.st === 'Sent').length;
  const rejectedCount = filteredInvoices.filter((i) => i.st === 'Rejected').length;
  const cancelledCount = filteredInvoices.filter((i) => i.type.includes('Credit Note')).length;

  // AR / AP Totals
  const arInvoices = filteredInvoices.filter((i) => i.dir === 'Outbound (AR)');
  const apInvoices = filteredInvoices.filter((i) => i.dir === 'Inbound (AP)');

  const arNet = arInvoices.reduce((sum, i) => sum + i.net, 0);
  const arVat = arInvoices.reduce((sum, i) => sum + i.vat, 0);
  const arTotal = arNet + arVat;

  const apNet = apInvoices.reduce((sum, i) => sum + i.net, 0);
  const apVat = apInvoices.reduce((sum, i) => sum + i.vat, 0);
  const apTotal = apNet + apVat;

  const fmt = (num: number) =>
    maskAmounts ? '•••••' : num.toLocaleString('en', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  // Chart 1 data: 14 days volume
  const days = ["16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29"];
  const volumeData = [74, 81, 68, 90, 96, 52, 48, 102, 110, 95, 88, 60, 131, 119];
  const W1 = 640, H1 = 200, L1 = 38, B1 = 168, T1 = 18, R1 = 16, maxV = 140;
  const x1 = (i: number) => L1 + i * ((W1 - L1 - R1) / (days.length - 1));
  const y1 = (val: number) => B1 - (val / maxV) * (B1 - T1);

  const pts = volumeData.map((val, i) => [x1(i), y1(val)]);
  let pathD = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    pathD += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }

  // VAT categories breakdown
  const vatCategories = [
    { label: "S — Standard 5%", amount: 352410, color: "var(--color-series-1, #2a78d6)" },
    { label: "Z — Zero rated", amount: 41200, color: "var(--color-series-1, #2a78d6)" },
    { label: "E — Exempt", amount: 12806, color: "var(--color-series-1, #2a78d6)" },
    { label: "O — Out of scope", amount: 6390, color: "var(--color-series-1, #2a78d6)" }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Subtitle + AP/AR Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center gap-2">
            <span>Dashboard Overview</span>
            <span className="text-sm font-normal text-slate-500 font-arabic">لوحة المعلومات</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live view of your e-invoicing under the Oman Fawtara framework (PINT OM · 5-corner model). Period: July 2026.
          </p>
        </div>

        {/* AP / AR Mode Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setApArFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                apArFilter === 'all'
                  ? 'bg-[#0d4f8b] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>All Invoices</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                apArFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {invoices.length}
              </span>
            </button>

            <button
              onClick={() => setApArFilter('ar')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                apArFilter === 'ar'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Accounts Receivable (AR)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                apArFilter === 'ar' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {arInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setApArFilter('ap')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                apArFilter === 'ap'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>Accounts Payable (AP)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                apArFilter === 'ap' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {apInvoices.length}
              </span>
            </button>
          </div>

          {onNavigateTab && (
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => onNavigateTab('inv')}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-[#0d4f8b] font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Go to Outbound AR Invoices Register"
              >
                <span>Go to AR Register</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => onNavigateTab('ap_inv')}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-emerald-800 font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Go to Inbound AP Invoices Hub"
              >
                <span>Go to AP Hub</span>
                <ArrowDownRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs border-t-4 border-t-blue-600">
          <div className="text-2xl font-black tracking-tight text-blue-600">{totalCount}</div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Total invoices (July)</div>
          <div className="text-[11px] text-slate-400 mt-1">AR {arInvoices.length} · AP {apInvoices.length}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs border-t-4 border-t-emerald-600">
          <div className="text-2xl font-black tracking-tight text-emerald-600">{validatedCount}</div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Validated (&lt; 24 hrs)</div>
          <div className="text-[11px] text-slate-400 mt-1">Schematron + AS4 delivered</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs border-t-4 border-t-emerald-600">
          <div className="text-2xl font-black tracking-tight text-emerald-600">{verifiedCount}</div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Verified (&gt; 24 hrs)</div>
          <div className="text-[11px] text-slate-400 mt-1">TDD reported via C5</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs border-t-4 border-t-amber-500">
          <div className="text-2xl font-black tracking-tight text-amber-600">{pendingCount}</div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Pending task</div>
          <div className="text-[11px] text-slate-400 mt-1">awaiting MLS or TDD ack</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs border-t-4 border-t-red-500">
          <div className="text-2xl font-black tracking-tight text-red-600">{rejectedCount}</div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Rejection (buyer)</div>
          <div className="text-[11px] text-slate-400 mt-1">correct + Disregard TDD</div>
        </div>

        <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3.5 shadow-2xs border-t-4 border-t-purple-600">
          <div className="text-2xl font-black tracking-tight text-purple-700">{cancelledCount}</div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Cancelled (supplier)</div>
          <div className="text-[11px] text-purple-400 mt-1">credit-noted per spec</div>
        </div>
      </div>

      {/* Row 2: VAT Group Table & AR/AP Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* VAT Group Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">VAT Group view — one customer, two Peppol participants</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Per OTA: each VAT-group member registers with its own OM11 VATIN as Participant ID; group VATIN (OM12…) is for VAT filing only — never on the network.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-2">Entity (participant)</th>
                  <th className="py-2 px-2 text-right">Docs</th>
                  <th className="py-2 px-2 text-right">Output VAT</th>
                  <th className="py-2 px-2 text-right">Input VAT</th>
                  <th className="py-2 px-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-2">
                    <span className="font-semibold text-slate-900 block">International Intelligence Solutions LLC</span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">0248:OM1100123456</span>
                  </td>
                  <td className="py-2.5 px-2 text-right">1,152</td>
                  <td className="py-2.5 px-2 text-right">{fmt(16890.121)}</td>
                  <td className="py-2.5 px-2 text-right">{fmt(4810.745)}</td>
                  <td className="py-2.5 px-2 text-right font-bold">{fmt(12079.376)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2">
                    <span className="font-semibold text-slate-900 block">Aji Alibri Enterprises</span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">0248:OM1100223344</span>
                  </td>
                  <td className="py-2.5 px-2 text-right">132</td>
                  <td className="py-2.5 px-2 text-right">{fmt(3750.200)}</td>
                  <td className="py-2.5 px-2 text-right">{fmt(0.000)}</td>
                  <td className="py-2.5 px-2 text-right font-bold">{fmt(3750.200)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2">
                    <span className="font-semibold text-slate-900 block">Alfaris Business Solutions</span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">0248:OM1100334455</span>
                  </td>
                  <td className="py-2.5 px-2 text-right">245</td>
                  <td className="py-2.5 px-2 text-right">{fmt(8420.500)}</td>
                  <td className="py-2.5 px-2 text-right">{fmt(1200.000)}</td>
                  <td className="py-2.5 px-2 text-right font-bold">{fmt(7220.500)}</td>
                </tr>
                <tr className="bg-slate-50/80 font-bold">
                  <td className="py-2.5 px-2 text-slate-900">VAT Group OM1200001234 — filing total</td>
                  <td className="py-2.5 px-2 text-right text-slate-900">1,529</td>
                  <td className="py-2.5 px-2 text-right">{fmt(29060.821)}</td>
                  <td className="py-2.5 px-2 text-right">{fmt(6010.745)}</td>
                  <td className="py-2.5 px-2 text-right text-[#0d4f8b]">{fmt(23050.076)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>One login, one dashboard, one group VAT-return pack — while every entity stays a separate, registered Peppol participant underneath.</span>
          </div>
        </div>

        {/* AR / AP Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">AR / AP summary — July</h3>
            <span className="text-xs text-slate-400">Currency: OMR</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2 text-right">Total Excl. VAT</th>
                  <th className="py-2 px-2 text-right">VAT Amount</th>
                  <th className="py-2 px-2 text-right">Total Incl. VAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-2 font-semibold flex items-center gap-1.5 text-blue-700">
                    <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    <span>Accounts Receivable ({arInvoices.length} docs)</span>
                  </td>
                  <td className="py-3 px-2 text-right font-bold">{fmt(arNet)}</td>
                  <td className="py-3 px-2 text-right">{fmt(arVat)}</td>
                  <td className="py-3 px-2 text-right font-black text-slate-900">{fmt(arTotal)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-semibold flex items-center gap-1.5 text-amber-700">
                    <ArrowDownRight className="h-4 w-4 text-amber-600" />
                    <span>Accounts Payable ({apInvoices.length} docs)</span>
                  </td>
                  <td className="py-3 px-2 text-right font-bold">{fmt(apNet)}</td>
                  <td className="py-3 px-2 text-right">{fmt(apVat)}</td>
                  <td className="py-3 px-2 text-right font-black text-slate-900">{fmt(apTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Net output VAT position (July): <b className="font-mono">{fmt(arVat - apVat)} OMR</b></span>
            </div>
            <span className="text-[10px] text-blue-600 font-medium">Feeds VAT-return schedule</span>
          </div>

          {/* Sales by VAT category bar chart */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Sales by VAT category — July (OMR)</h4>
            <div className="space-y-2">
              {vatCategories.map((cat, idx) => {
                const widthPct = Math.min(100, Math.max(5, (cat.amount / 360000) * 100));
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-36 text-slate-600 truncate text-[11px]">{cat.label}</span>
                    <div className="flex-1 bg-slate-100 h-5 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full bg-blue-600 rounded-lg transition-all"
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                    <span className="w-16 text-right font-bold text-slate-800 text-[11px]">
                      {(cat.amount / 1000).toFixed(1)}k
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Volume Line Chart & Status Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Volume Line Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <h3 className="text-sm font-bold text-slate-800">Invoice volume — last 14 days</h3>
          <p className="text-xs text-slate-400">Documents validated per day (all types). Hover points for details.</p>
          
          <div className="relative pt-2">
            <svg viewBox={`0 0 ${W1} ${H1}`} className="w-full h-auto">
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2a78d6" stopOpacity="0.32" />
                  <stop offset="70%" stopColor="#0e8f6f" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#0e8f6f" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="volLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2a78d6" />
                  <stop offset="100%" stopColor="#0e8f6f" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[50, 100].map((gv) => (
                <g key={gv}>
                  <line x1={L1} x2={W1 - R1} y1={y1(gv)} y2={y1(gv)} stroke="#eef1f6" strokeWidth="1" />
                  <text x={L1 - 6} y={y1(gv) + 4} fontSize="10" fill="#a5b0bb" textAnchor="end">{gv}</text>
                </g>
              ))}

              <line x1={L1} x2={W1 - R1} y1={B1} y2={B1} stroke="#dfe5ec" strokeWidth="1" />

              {/* Area & Line */}
              <path d={`${pathD} L${pts[pts.length - 1][0]},${B1} L${pts[0][0]},${B1} Z`} fill="url(#volGrad)" />
              <path d={pathD} fill="none" stroke="url(#volLine)" strokeWidth="2.5" strokeLinecap="round" />

              {/* Points */}
              {volumeData.map((val, i) => {
                const isPeak = val === Math.max(...volumeData);
                const isLast = i === volumeData.length - 1;
                return (
                  <g key={i}>
                    <circle
                      cx={x1(i)}
                      cy={y1(val)}
                      r={isPeak || isLast ? "5" : "3"}
                      fill={isPeak ? "#2a78d6" : "#0e8f6f"}
                      stroke="#fff"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-6 transition-all"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ x: rect.left, y: rect.top, text: `${days[i]} Jul — ${val} invoices` });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {(isPeak || isLast) && (
                      <text x={x1(i)} y={y1(val) - 9} fontSize="11" fontWeight="700" fill="#12222f" textAnchor="middle">
                        {val}
                      </text>
                    )}
                    <text x={x1(i)} y={B1 + 15} fontSize="9.5" fill="#a5b0bb" textAnchor="middle">
                      {days[i]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <h3 className="text-sm font-bold text-slate-800">Status distribution — July</h3>
          <p className="text-xs text-slate-400">Lifecycle state of all {totalCount} documents in system.</p>

          <div className="space-y-3 pt-3">
            {[
              { label: "Reported (OTA ack)", count: validatedCount, color: "bg-emerald-600" },
              { label: "In exchange", count: 3, color: "bg-blue-600" },
              { label: "Pending", count: pendingCount, color: "bg-amber-500" },
              { label: "Rejected", count: rejectedCount, color: "bg-red-500" }
            ].map((st, idx) => {
              const pct = Math.min(100, Math.max(2, (st.count / Math.max(1, totalCount)) * 100));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{st.label}</span>
                    <span className="font-bold text-slate-900">{st.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className={`h-full ${st.color} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-600"></i>Reported (TDD ✓)</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-600"></i>In exchange</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-500"></i>Pending</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-500"></i>Rejected</span>
          </div>
        </div>
      </div>

      {/* Row 4: Regulatory SLA Compliance & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SLA Compliance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Regulatory SLA compliance (PASR Annex A)</h3>
          </div>
          <p className="text-xs text-slate-400">Measured on this tenant's traffic, July 2026.</p>

          <div className="space-y-3 text-xs">
            {[
              { label: "TDD to OTA (C5) — B2B ≤ 15 min", value: "99.7%", color: "bg-emerald-600", text: "text-emerald-700" },
              { label: "TDD to OTA (C5) — B2C ≤ 30 min", value: "100%", color: "bg-emerald-600", text: "text-emerald-700" },
              { label: "MLS response ≤ 20 min", value: "99.9%", color: "bg-emerald-600", text: "text-emerald-700" },
              { label: "B2C data received ≤ 24 h of issuance", value: "98.2%", color: "bg-amber-500", text: "text-amber-700" }
            ].map((sla, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">{sla.label}</span>
                  <b className={`font-bold ${sla.text}`}>{sla.value}</b>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${sla.color} rounded-full`} style={{ width: sla.value }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Anomalies */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">Alerts &amp; anomalies</h3>
          </div>
          <p className="text-xs text-slate-400">Real-time monitoring with e-mail &amp; in-app notifications.</p>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-900">
              <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold shrink-0 mt-0.5">Action</span>
              <div>
                <b>INV-2026-07-0231 rejected by buyer AP</b> — <code className="bg-red-100 px-1 rounded font-mono text-[10px]">ibr-003-om</code> VAT ID format. Correct &amp; resend; Disregard TDD queued.
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-amber-900">
              <span className="px-1.5 py-0.5 bg-amber-500 text-slate-900 rounded text-[10px] font-bold shrink-0 mt-0.5">Watch</span>
              <div>
                3 B2C batches from POS store MCT-04 approaching the 24-hour submission window.
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-emerald-900">
              <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold shrink-0 mt-0.5">Info</span>
              <div>
                PINT OM v1.0.1 rules active since 29 Jul 2026 — Baisa-gap tolerance &amp; UUIDv5 enforcement applied automatically.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <div
          className="fixed bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg pointer-events-none z-50 shadow-lg transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
