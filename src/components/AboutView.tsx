import React from 'react';
import { Phone, Mail, Globe, MapPin, Building2, Landmark } from 'lucide-react';

/**
 * Faturathi is the product; Netbue is the trade name under which it is marketed and supported;
 * International Intelligence Solutions LLC is the legal entity registered in the Sultanate of
 * Oman that operates the platform (same pattern as other Netbue-branded regional entities, e.g.
 * "Netbue India" trades as Netbue Technologies Pvt. Ltd.). Both are shown here rather than
 * merged, since they answer different questions ("who do I call for support" vs "who is the
 * registered company on my contract").
 */
export const AboutView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="bg-[#0d4f8b] text-white text-xs px-2 py-0.5 rounded-md font-mono">I</span>
            <span>About Us / Contact Us</span>
            <span className="text-sm font-normal text-slate-500 font-arabic">من نحن / اتصل بنا</span>
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Product support, sales, and API key requests — plus the registered legal entity behind Faturathi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product support (Netbue trade name) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0d4f8b]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Faturathi Support (by Netbue)</h3>
              <p className="text-[11px] text-slate-500">Product support, onboarding, and API key / access token requests.</p>
            </div>
          </div>
          <div className="space-y-2.5 text-xs">
            <a href="tel:+96895219001" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Phone className="h-4 w-4 text-emerald-700 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Phone / WhatsApp</span>
                <span className="font-semibold text-slate-800">+968 9521 9001</span>
              </div>
            </a>
            <a href="mailto:faturathi@netbue.com" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Mail className="h-4 w-4 text-[#0d4f8b] shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Email</span>
                <span className="font-semibold text-slate-800">faturathi@netbue.com</span>
              </div>
            </a>
            <a href="https://www.faturathi.com" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Globe className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Website</span>
                <span className="font-semibold text-slate-800">www.faturathi.com</span>
              </div>
            </a>
          </div>
        </div>

        {/* Registered legal entity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-emerald-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered Entity</h3>
              <p className="text-[11px] text-slate-500">The legal company operating Faturathi, registered in the Sultanate of Oman.</p>
            </div>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="block text-slate-400 text-[10px] font-bold uppercase">Company</span>
              <span className="font-bold text-slate-900">International Intelligence Solutions LLC</span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <MapPin className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Address</span>
                <span className="font-semibold text-slate-800 block">Al Aman Building, CBD Ruwi, Muscat, Sultanate of Oman</span>
                <span className="text-slate-600 block">PB No: 2038, PC: 112</span>
              </div>
            </div>
            <a href="tel:+96824799200" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Phone className="h-4 w-4 text-emerald-700 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Landline</span>
                <span className="font-semibold text-slate-800">+968 2479 9200</span>
              </div>
            </a>
            <a href="tel:+96895219001" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Phone className="h-4 w-4 text-[#0d4f8b] shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">GSM</span>
                <span className="font-semibold text-slate-800">+968 9521 9001</span>
              </div>
            </a>
            <a href="mailto:faturathi@netbue.com" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Mail className="h-4 w-4 text-[#0d4f8b] shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Email</span>
                <span className="font-semibold text-slate-800">faturathi@netbue.com</span>
              </div>
            </a>
            <a href="https://www.faturathi.com" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Globe className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Website</span>
                <span className="font-semibold text-slate-800">https://www.faturathi.com</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-[11px] text-slate-600">
        <b className="text-slate-800">Faturathi</b> is the product; <b className="text-slate-800">Netbue</b> is the
        trade name it is marketed and supported under; <b className="text-slate-800">International Intelligence
        Solutions LLC</b> is the registered legal entity operating the platform in Oman. Regional Netbue entities
        follow the same pattern (e.g. Netbue India trades as Netbue Technologies Pvt. Ltd.).
      </div>
    </div>
  );
};
