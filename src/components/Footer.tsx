import React from 'react';
import { NetbueLogo, FaturathiLogo } from './Logos';

interface FooterProps {
  onNavigateAbout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateAbout }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 antialiased mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <NetbueLogo className="h-8 w-auto text-white" />
            <div className="h-6 w-px bg-slate-700"></div>
            <div>
              <b className="text-white text-xs block font-bold">NETBUE LLC</b>
              <span className="text-[11px] text-slate-400 block">OTA Accredited E-Invoicing Service Provider · Muscat, Sultanate of Oman</span>
            </div>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-500">
            <div>Faturathi E-Invoicing Platform v2.4 (PINT OM v1.0.1 Compliant)</div>
            <div className="font-arabic mt-0.5">حلول الفوترة الإلكترونية المعتمدة في سلطنة عمان</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>© 2026 NETBUE LLC. All rights reserved. Demo version for pitch and evaluation purposes.</p>
          <div className="flex items-center gap-4">
            {onNavigateAbout && (
              <>
                <button onClick={onNavigateAbout} className="hover:text-white transition-colors cursor-pointer underline-offset-2 hover:underline">
                  About Us / Contact Us
                </button>
                <span>•</span>
              </>
            )}
            <span>Peppol Network Access Point</span>
            <span>•</span>
            <span>Oman Tax Authority Accredited</span>
            <span>•</span>
            <span>ISO 27001 Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
