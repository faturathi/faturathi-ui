import React, { useState } from 'react';
import { ShieldAlert, Key, Download, Upload, CheckCircle2, X, Terminal, Lock } from 'lucide-react';

interface CertificateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCertificateInstalled: () => void;
}

export const CertificateWarningModal: React.FC<CertificateWarningModalProps> = ({
  isOpen,
  onClose,
  onCertificateInstalled
}) => {
  const [activeAction, setActiveAction] = useState<'view' | 'upload' | 'download'>('view');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [certPass, setCertPass] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTimestamp = new Date().toISOString();
  const traceId = "8eea6d8e-1e16-452f-b7bb-1a07c8486a05";

  const handleDownloadDemoCert = () => {
    setActiveAction('download');
    setTimeout(() => {
      const blob = new Blob(
        [
          `-----BEGIN CERTIFICATE-----\nMIID3zCCAsegAwIBAgIUfaturathiDemoKey2026102948201948201948\nMA0GCSqGSIb3DQEBCwUAMIGMMQswCQYDVQQGEwJPTTEOMAwGA1UECAwFTXVzY2F0\n...FATURATHI-PEPPOL-AS4-DEMO-CERTIFICATE...\n-----END CERTIFICATE-----`
        ],
        { type: 'application/x-pkcs12' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'faturathi-peppol-as4-demo-cert.p12';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
    }
  };

  const handleInstallCert = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInstalling(true);
    setTimeout(() => {
      setIsInstalling(false);
      setIsSuccess(true);
      setTimeout(() => {
        onCertificateInstalled();
        onClose();
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative text-slate-100 overflow-y-auto max-h-[88vh] my-auto scrollbar-thin scrollbar-thumb-slate-700">
        {/* Warning Accent Header Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500"></div>

        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 mb-5 pt-2 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-400 shrink-0">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 bg-red-950/90 px-2 py-0.5 rounded-full border border-red-500/30">
                  SECURITY HANDSHAKE
                </span>
                <span className="text-[11px] font-mono text-slate-400">Peppol AS4 PKI</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Faturathi Client Certificate Required
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Close warning"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Peppol Testbed Style Console Error Box */}
        <div className="p-4 bg-slate-950 border border-red-900/60 rounded-2xl space-y-2 mb-6 font-mono text-xs text-red-300 relative shadow-inner">
          <div className="flex items-center justify-between border-b border-red-950 pb-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <Terminal className="h-3.5 w-3.5" /> Peppol Testbed Security Log
            </span>
            <span>HTTP 403 Forbidden</span>
          </div>
          <p className="leading-relaxed text-red-200">
            <strong className="text-red-400 font-bold">Forbidden or unauthorized operation was detected;</strong> Full authentication is required to access this resource.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <div>Trace ID: <span className="text-slate-200">{traceId}</span></div>
            <div>Timestamp: <span className="text-slate-200">{currentTimestamp}</span></div>
          </div>
        </div>

        {/* Context Message */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          The <b>Faturathi Peppol AS4 Client PKI Certificate (.p12 / .crt)</b> is required for mutual TLS (mTLS) handshake and digital signing of Oman Tax Authority (OTA) PINT OM invoices. You can download the demo client certificate, upload your local workstation certificate, or bypass this check for demo testing.
        </p>

        {isSuccess ? (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-200 flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
            <div>
              <b className="text-white text-sm block">Certificate Handshake Verified!</b>
              <span className="text-xs text-emerald-300">Faturathi PKI key pair bound to local session. Proceeding to portal...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadDemoCert}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  activeAction === 'download'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Download className="h-4 w-4" />
                  <span>1. Download Demo Cert</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  Get pre-configured .p12 test certificate
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('upload')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  activeAction === 'upload'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Upload className="h-4 w-4" />
                  <span>2. Upload Workstation Cert</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  Select local .p12 or .crt key file
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:border-amber-500/50 hover:text-amber-300 transition-all cursor-pointer text-xs font-bold text-left flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Key className="h-4 w-4" />
                  <span>3. Bypass for Demo</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  Proceed with simulated session
                </span>
              </button>
            </div>

            {/* Form when Upload or Download selected */}
            {activeAction === 'upload' && (
              <form onSubmit={handleInstallCert} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 animate-fadeIn">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-blue-400" />
                  <span>Import Workstation PKI Certificate</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Select Certificate File (.p12, .pfx, .crt)</label>
                  <input
                    type="file"
                    accept=".p12,.pfx,.crt,.pem"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-xl p-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white"
                  />
                  {uploadedFileName && (
                    <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                      Selected: {uploadedFileName}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Passphrase (if encrypted)</label>
                  <input
                    type="password"
                    value={certPass}
                    onChange={(e) => setCertPass(e.target.value)}
                    placeholder="Enter PKI passphrase"
                    className="w-full text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveAction('view')}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInstalling}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isInstalling ? 'Validating Handshake...' : 'Install & Authenticate'}
                  </button>
                </div>
              </form>
            )}

            {activeAction === 'download' && (
              <div className="p-4 bg-slate-950 border border-emerald-900/50 rounded-2xl text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Demo Certificate Issued!</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  File <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono">faturathi-peppol-as4-demo-cert.p12</code> has been saved to your downloads folder. Default password: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono">faturathi2026</code>.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onCertificateInstalled();
                      onClose();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Activate Session &amp; Proceed
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 text-[11px]">
            Oman Tax Authority (OTA) E-Invoicing Security Policy 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer"
          >
            Acknowledge &amp; Proceed To Portal
          </button>
        </div>
      </div>
    </div>
  );
};
