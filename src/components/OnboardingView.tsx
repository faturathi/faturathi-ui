import React from 'react';
import { Network, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const OnboardingView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span>Onboarding &amp; SMP Registration <span className="text-sm font-normal text-slate-500 font-arabic">التسجيل وخدمة دليل العناوين</span></span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your Service Metadata Publisher (SMP) participant lookup records and entity onboarding setup.
        </p>
      </div>

      {/* SMP Active Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950">
        <div className="flex items-center gap-3">
          <Network className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <b className="font-bold text-sm">Registered Peppol Participant on Netbue SMP</b>
            <p className="text-xs text-emerald-800">
              Scheme <code className="font-mono bg-emerald-100 px-1 rounded">0248</code> · Oman VATIN registration published to global Peppol Directory.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-2xs">
          SMP Active
        </span>
      </div>

      {/* Group Participant Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Group Entity Participant Registration Directory</h3>
        <p className="text-xs text-slate-400">
          Every entity in your VAT Group is registered individually as a Peppol participant under scheme 0248.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Participant ID (0248:)</th>
                <th className="py-2.5 px-3">Legal Name</th>
                <th className="py-2.5 px-3">Series Prefix</th>
                <th className="py-2.5 px-3">Supported Processes</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-[#0d4f8b]">0248:OM1100123456</td>
                <td className="py-3 px-3 font-semibold text-slate-900">Al Noor Trading LLC</td>
                <td className="py-3 px-3 font-mono bg-slate-100 px-2 py-0.5 rounded w-fit">INV-</td>
                <td className="py-3 px-3">
                  <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono text-[10px]">
                    billing-1@om-1
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Published
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-[#0d4f8b]">0248:OM1100223344</td>
                <td className="py-3 px-3 font-semibold text-slate-900">Al Noor Foods SAOC</td>
                <td className="py-3 px-3 font-mono bg-slate-100 px-2 py-0.5 rounded w-fit">FOOD-</td>
                <td className="py-3 px-3">
                  <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono text-[10px]">
                    billing-1@om-1
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Published
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
