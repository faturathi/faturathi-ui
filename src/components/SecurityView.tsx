import React from 'react';
import { Shield, Lock, Key, Server, CheckCircle2, FileCheck } from 'lucide-react';

export const SecurityView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span>Security &amp; Compliance <span className="text-sm font-normal text-slate-500 font-arabic">الأمان والامتثال</span></span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Enterprise-grade security controls complying with Oman PASR mandates and Peppol Security Policy v3.5.
        </p>
      </div>

      {/* Security Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs text-center space-y-1">
          <Shield className="h-6 w-6 text-[#0d4f8b] mx-auto" />
          <b className="text-xs font-bold text-slate-900 block">ISO 27001</b>
          <span className="text-[10px] text-slate-500 block">Certified DC</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs text-center space-y-1">
          <Lock className="h-6 w-6 text-emerald-600 mx-auto" />
          <b className="text-xs font-bold text-slate-900 block">TLS 1.3</b>
          <span className="text-[10px] text-slate-500 block">In-Transit Enc.</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs text-center space-y-1">
          <Key className="h-6 w-6 text-amber-600 mx-auto" />
          <b className="text-xs font-bold text-slate-900 block">AES-256</b>
          <span className="text-[10px] text-slate-500 block">At-Rest Enc.</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs text-center space-y-1">
          <Server className="h-6 w-6 text-blue-600 mx-auto" />
          <b className="text-xs font-bold text-slate-900 block">100% Oman</b>
          <span className="text-[10px] text-slate-500 block">Data Sovereignty</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs text-center space-y-1">
          <CheckCircle2 className="h-6 w-6 text-purple-600 mx-auto" />
          <b className="text-xs font-bold text-slate-900 block">MFA Active</b>
          <span className="text-[10px] text-slate-500 block">TOTP / WebAuthn</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs text-center space-y-1">
          <FileCheck className="h-6 w-6 text-emerald-600 mx-auto" />
          <b className="text-xs font-bold text-slate-900 block">RBAC Gated</b>
          <span className="text-[10px] text-slate-500 block">Role Enforcement</span>
        </div>
      </div>

      {/* Security Architecture & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Platform Security Controls &amp; AS4 PKI Encryption</h3>
        <p className="text-xs text-slate-500">
          Faturathi uses standard X.509 PKI certificates for signing and encrypting all AS4 payload envelopes transmitted to Peppol Access Points.
        </p>

        <div className="space-y-2 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <b className="font-bold text-slate-900">AS4 Message Level Signing</b>
              <p className="text-slate-500">Every outbound XML container is digitally signed using SHA-256 with Netbue's OTA-issued PKI private key.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <b className="font-bold text-slate-900">Immutable Audit Trail</b>
              <p className="text-slate-500">Every user action (creation, edit, approval, resubmission) is logged in an append-only audit register with cryptographic hash verification.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
