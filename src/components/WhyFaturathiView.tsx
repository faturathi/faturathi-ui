import React from 'react';
import { FaturathiLogo, NetbueLogo } from './Logos';
import { Check, X, ShieldCheck, Zap, Award } from 'lucide-react';

export const WhyFaturathiView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span>Why Faturathi by NETBUE <span className="text-sm font-normal text-slate-500 font-arabic">لماذا فوترتي</span></span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Complete comparison matrix: Why leading enterprises in Oman select Netbue as their accredited E-Invoicing Service Provider.
        </p>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Award className="h-5 w-5 text-[#0e8f6f]" />
            <span>Faturathi E-Invoicing Solution vs. Alternatives</span>
          </h3>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
            OTA Accredited Provider
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4 text-left">Capability / Specification</th>
                <th className="py-3 px-4 text-center bg-blue-50/70 text-[#0d4f8b] font-black w-1/4">
                  Faturathi NETBUE
                </th>
                <th className="py-3 px-4 text-center text-slate-500 w-1/4">
                  Typical Regional SP
                </th>
                <th className="py-3 px-4 text-center text-slate-400 w-1/4">
                  Basic DIY Gateway
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[
                {
                  feat: 'OTA Accredited Service Provider & Peppol Access Point',
                  faturathi: true,
                  regional: false,
                  diy: false,
                  note: 'Direct Peppol AS4 connectivity without 3rd-party intermediaries'
                },
                {
                  feat: 'Integrated Service Metadata Publisher (SMP)',
                  faturathi: true,
                  regional: 'Partial',
                  diy: false,
                  note: 'Automated 0248:OM11... lookup directory registration'
                },
                {
                  feat: 'Native PINT OM v1.0.1 Schematron & UUIDv5 Engine',
                  faturathi: true,
                  regional: true,
                  diy: false,
                  note: 'Deterministic UUIDv5 namespace matching C2 and C3 legs'
                },
                {
                  feat: 'BTOM-001 20-character Bitmap Builder with Rules Guard',
                  faturathi: true,
                  regional: false,
                  diy: false,
                  note: 'Prevents invalid bit combos (e.g. Export + RCM, SB + Export)'
                },
                {
                  feat: 'B2C TLV Base64 Tag 1–9 QR Code Renderer',
                  faturathi: true,
                  regional: true,
                  diy: false,
                  note: 'Fully compliant with IBR-173-OM and offline POS support'
                },
                {
                  feat: 'Multi-Entity VAT Group Architecture (OM12... vs OM11...)',
                  faturathi: true,
                  regional: false,
                  diy: false,
                  note: 'One dashboard for VAT Group filing while maintaining separate Peppol IDs'
                },
                {
                  feat: 'Automated 3-Way Reconciliation & OECD SAF-T Export',
                  faturathi: true,
                  regional: false,
                  diy: false,
                  note: 'ERP vs AP vs OTA TDD real-time matching'
                },
                {
                  feat: '100% Sovereign Cloud Data Residency in Oman',
                  faturathi: true,
                  regional: false,
                  diy: true,
                  note: '10-year immutable WORM storage hosted locally in Muscat/Salalah'
                }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-left">
                    <b className="font-bold text-slate-900 block">{row.feat}</b>
                    <span className="text-[10px] text-slate-400 block">{row.note}</span>
                  </td>
                  <td className="py-3 px-4 text-center bg-blue-50/30 font-bold text-[#0d4f8b]">
                    {row.faturathi === true ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-700">✓</span>
                    ) : (
                      row.faturathi
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 font-medium">
                    {row.regional === true ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-600">✓</span>
                    ) : row.regional === false ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-50 text-red-600">✕</span>
                    ) : (
                      row.regional
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    {row.diy === true ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-500">✓</span>
                    ) : (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-50 text-red-500">✕</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
