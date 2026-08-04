import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Cpu, CheckCircle2, Lock, ArrowRight, RefreshCw, Terminal, Laptop, Key } from 'lucide-react';
import { FaturathiLogo, NetbueLogo } from './Logos';

interface PreLandingCertCheckerProps {
  onProceed: () => void;
}

export const PreLandingCertChecker: React.FC<PreLandingCertCheckerProps> = ({ onProceed }) => {
  const [scanStep, setScanStep] = useState<'scanning' | 'warning' | 'verified'>('scanning');
  const [progress, setProgress] = useState<number>(15);
  const [showLogDetails, setShowLogDetails] = useState<boolean>(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(55), 400);
    const timer2 = setTimeout(() => setProgress(88), 800);
    const timer3 = setTimeout(() => {
      setProgress(100);
      // Default to warning since no client cert installed on workstation
      setScanStep('warning');
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleReScan = () => {
    setScanStep('scanning');
    setProgress(20);
    setTimeout(() => setProgress(70), 500);
    setTimeout(() => {
      setProgress(100);
      setScanStep('warning');
    }, 1100);
  };

  const handleSimulateCertFound = () => {
    setScanStep('scanning');
    setProgress(30);
    setTimeout(() => setProgress(80), 400);
    setTimeout(() => {
      setProgress(100);
      setScanStep('verified');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaturathiLogo className="h-8 w-auto" showSlogan={false} />
            <div className="h-5 w-px bg-slate-300 hidden sm:block"></div>
            <span className="text-xs font-mono font-bold text-slate-600 hidden sm:inline uppercase tracking-wider">
              System PKI Handshake Gateway
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 shadow-2xs">
              <Laptop className="h-3.5 w-3.5" /> Workstation OS Keystore
            </span>
            <NetbueLogo className="h-5 w-auto" />
          </div>
        </div>
      </header>

      {/* Main Center Verification Card */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden space-y-6">
          {/* Top Decorative Gradient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-[#0d4f8b]"></div>

          {/* Header Title Section */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className={`p-3.5 rounded-2xl border transition-all ${
                scanStep === 'scanning'
                  ? 'bg-blue-50 border-blue-200 text-[#0d4f8b]'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {scanStep === 'scanning' ? (
                  <RefreshCw className="h-7 w-7 animate-spin" />
                ) : (
                  <ShieldCheck className="h-7 w-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    scanStep === 'scanning'
                      ? 'text-blue-800 bg-blue-50 border-blue-200'
                      : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                  }`}>
                    {scanStep === 'scanning' ? 'SCANNING SYSTEM KEYSTORE' : 'CERTIFICATE VERIFIED'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">OTA Peppol mTLS</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Workstation Certificate Security Check
                </h1>
              </div>
            </div>

            <button
              onClick={handleReScan}
              disabled={scanStep === 'scanning'}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-xs font-mono flex items-center gap-1.5 border border-slate-300 disabled:opacity-50"
              title="Re-scan system certificate store"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${scanStep === 'scanning' ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-bold">Re-Scan</span>
            </button>
          </div>

          {/* Animated Scanning Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-700 flex items-center gap-1.5 font-bold">
                <Cpu className="h-4 w-4 text-emerald-600" />
                {scanStep === 'scanning'
                  ? 'Querying Windows Certificate Store / macOS Keychain...'
                  : 'System Certificate Match Found & Handshake Complete'}
              </span>
              <span className="text-emerald-700 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-[#0d4f8b] rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Certificate Warning Box if No Cert Installed */}
          {scanStep === 'warning' && (
            <div className="p-5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0" />
                  <div>
                    <b className="text-sm font-bold text-amber-950 block">
                      ⚠️ WARNING: No Client PKI Certificate Installed in PC/Laptop Keystore
                    </b>
                    <span className="text-[11px] text-amber-800 font-medium font-sans">
                      Windows Certmgr / macOS Keychain check completed without local hardware mTLS cert.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 font-mono text-[10px] font-bold rounded-full border border-amber-400 shrink-0">
                  Cert Missing
                </span>
              </div>

              <div className="p-3 bg-white border border-amber-200 rounded-xl text-xs text-slate-700 leading-relaxed font-sans shadow-2xs space-y-1.5">
                <p>
                  <b>Notice:</b> The system queried your operating system certificate store but could not find a pre-registered Oman Tax Authority (OTA) client mTLS certificate (e.g. <code className="font-mono text-amber-900 font-bold bg-amber-50 px-1 rounded">CN=OM-VAT-1100123456-NETBUE</code>).
                </p>
                <p className="text-slate-600">
                  You may choose to <b>Skip Verification (Bypass mTLS for Demo / Cloud Testing)</b> to proceed immediately to the Faturathi portal, or simulate certificate presence.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSimulateCertFound}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Simulate Mock Certificate Installed</span>
                </button>

                <button
                  type="button"
                  onClick={onProceed}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Skip Verification &amp; Proceed Anyway</span>
                </button>
              </div>
            </div>
          )}

          {/* Certificate Found Details Box */}
          {scanStep === 'verified' && (
            <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <b className="text-sm font-bold text-emerald-950">Client PKI Certificate Detected in OS Keystore</b>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold rounded-full border border-emerald-300">
                  Hardware Trusted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Certificate Subject:</span>
                  <b className="text-emerald-900 block truncate mt-0.5">CN=OM-VAT-1100123456-NETBUE</b>
                  <span className="text-[10px] text-slate-600 block truncate font-sans">Netbue Solutions SAOC · Muscat</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Issuing Authority (CA):</span>
                  <b className="text-slate-800 block truncate mt-0.5">Oman Tax Authority Root CA 2026</b>
                  <span className="text-[10px] text-slate-600 block truncate font-sans">Peppol AS4 PINT OM Policy</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Serial Number:</span>
                  <b className="text-slate-700 block truncate mt-0.5">0x99A82B014F890C2026</b>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Validity &amp; Scope:</span>
                  <b className="text-emerald-700 block truncate mt-0.5">Valid until Dec 2028 (PC Level)</b>
                </div>
              </div>

              <div className="p-3 bg-white/80 border border-emerald-200 rounded-xl text-xs text-slate-700 leading-relaxed font-sans shadow-2xs">
                <b>Note:</b> In compliance with Oman Tax Authority (OTA) E-Invoicing Security Guidelines, your workstation system certificate has been automatically validated via browser OS keystore integration. No manual file upload is required.
              </div>
            </div>
          )}

          {/* Technical Diagnostics Logs Expander */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-slate-200">
            <button
              type="button"
              onClick={() => setShowLogDetails(!showLogDetails)}
              className="w-full px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-left text-xs font-mono text-slate-300 flex items-center justify-between cursor-pointer border-b border-slate-700/60"
            >
              <span className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-teal-400" />
                <span>mTLS Handshake Log Diagnostics</span>
              </span>
              <span className="text-[10px] text-teal-300 font-bold">{showLogDetails ? 'Hide Console' : 'Show Console'}</span>
            </button>

            {showLogDetails && (
              <div className="p-4 font-mono text-[11px] text-slate-300 space-y-1.5 leading-relaxed bg-slate-950 overflow-x-auto">
                <p className="text-slate-400">[2026-08-01T08:33:41Z] [CLIENT_TLS] Initializing workstation system keystore check...</p>
                <p className="text-blue-400">[2026-08-01T08:33:41Z] [OS_KEYSTORE] Querying Windows Certmgr / Apple Keychain Services...</p>
                <p className="text-emerald-400">[2026-08-01T08:33:42Z] [MATCH_SUCCESS] Certificate found: CN=OM-VAT-1100123456-NETBUE (Serial: 0x99A82B014F890C)</p>
                <p className="text-emerald-400">[2026-08-01T08:33:42Z] [PEPPOL_AS4] Mutual TLS (mTLS) session keys established with OTA Gateway.</p>
              </div>
            )}
          </div>

          {/* Action Button: Proceed to Landing Page & Portal */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500 hidden sm:block font-medium">
              <span>Security Policy: <b className="text-slate-700 font-mono">OTA-SEC-PINT-2026</b></span>
            </div>

            <button
              onClick={onProceed}
              disabled={scanStep === 'scanning'}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0d4f8b] hover:from-emerald-500 hover:to-[#0b3d6b] text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShieldCheck className="h-5 w-5" />
              <span>Proceed to Faturathi Portal</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-3 px-6 text-xs text-slate-500 text-center font-mono">
        <span>© 2026 Netbue Solutions SAOC. Workstation PKI Certificate Security Layer.</span>
      </footer>
    </div>
  );
};
