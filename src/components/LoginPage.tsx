import React, { useState } from 'react';
import { FaturathiLogo, NetbueLogo } from './Logos';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  X, 
  Key, 
  UserCheck, 
  Cpu, 
  Users, 
  Calculator, 
  FileCheck2, 
  Server, 
  Globe, 
  Building2, 
  Zap,
  Sparkles
} from 'lucide-react';
import { User, RoleMode } from '../types';
import { apiFetch, formatApiErrors, saveSession } from '../lib/api';

export interface AuthUser extends User {
  roleCategory: 'superadmin' | 'portal_admin' | 'finance_mgr' | 'normal_user';
  roleTitle: string;
  roleBadge: string;
  description: string;
  avatarColor: string;
  mappedRoleMode: RoleMode;
}

export const DEMO_USER_ROLES: AuthUser[] = [
  {
    id: 'user-2',
    n: 'Tariq Al-Siyabi',
    e: 'salim.h@intel-sol.om',
    r: 'Admin / Manager',
    ent: 'All Organization Entities',
    st: 'Active',
    ll: 'Today, 08:50',
    roleCategory: 'portal_admin',
    roleTitle: '1.) Admin / Manager for Portal',
    roleBadge: 'Portal Administrator',
    description: 'Manage organization users, grant/revoke entity permissions, configure role access controls, and manage subscription settings.',
    avatarColor: 'bg-[#0d4f8b] text-white',
    mappedRoleMode: 'admin'
  },
  {
    id: 'user-3',
    n: 'Fatma Al-Zahra',
    e: 'fatma.z@alibri.om',
    r: 'Accountant / Finance Manager',
    ent: 'E1 & E2 (International Intelligence)',
    st: 'Active',
    ll: 'Yesterday, 16:40',
    roleCategory: 'finance_mgr',
    roleTitle: '2.) Accountant / Finance Manager',
    roleBadge: 'Finance Approver',
    description: 'Review invoice totals, sign-off AP ERP postings, run VAT reconciliation, and generate SAF-T audit compliance files.',
    avatarColor: 'bg-emerald-600 text-white',
    mappedRoleMode: 'finmgr'
  },
  {
    id: 'user-4',
    n: 'Ahmed Al-Balushi',
    e: 'ahmed.b@alfaris.om',
    r: 'Normal App User',
    ent: 'E1 — HQ Muscat',
    st: 'Active',
    ll: 'Today, 08:30',
    roleCategory: 'normal_user',
    roleTitle: '3.) Normal App User',
    roleBadge: 'Invoice Operations',
    description: 'Create & monitor invoices, upload batch JSON/XML files, review validation errors, correct line items, and submit to OTA.',
    avatarColor: 'bg-amber-600 text-white',
    mappedRoleMode: 'maker'
  }
];

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<AuthUser>(DEMO_USER_ROLES[0]);
  const [email, setEmail] = useState<string>(DEMO_USER_ROLES[0].e);
  const [password, setPassword] = useState<string>('Demo@1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetSent, setResetSent] = useState<boolean>(false);

  // 2FA / MFA OTP Step State
  const [authStep, setAuthStep] = useState<'credentials' | 'mfa_otp'>('credentials');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<string>('');

  const handleRoleSelect = (usr: AuthUser) => {
    setSelectedRole(usr);
    setEmail(usr.e);
    setPassword('Demo@1234');
  };

  const toAuthUser = (user: any): AuthUser => {
    const roleMap: Record<string, RoleMode> = {
      SUPERADMIN: 'admin', ADMIN: 'admin', APPROVER: 'finmgr', MAKER: 'maker', VIEWER: 'audit'
    };
    return {
      ...selectedRole, id: user.id, n: user.name || user.email, e: user.email,
      email: user.email, r: user.role, role: user.role, ent: user.entityId || 'ALL',
      branch: user.branch, designation: user.designation || '', mappedRoleMode: roleMap[user.role] || 'ops',
    };
  };

  const completeLogin = (result: any) => {
    saveSession({ token: result.token, refresh: result.refresh }, rememberMe);
    onLoginSuccess(toAuthUser(result.user));
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await apiFetch<any>('/api/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password })
      });
      if (result.mfa_required) {
        if (!result.mfa_challenge) {
          throw new Error('The server did not issue a secure OTP challenge. Please try signing in again.');
        }
        setMfaChallenge(result.mfa_challenge);
        setAuthStep('mfa_otp');
        setOtpCode('');
        setOtpError(null);
      } else {
        completeLogin(result);
      }
    } catch (error) {
      setLoginError(formatApiErrors(error, 'Sign-in failed. Check the email and password and try again.').join(' '));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setOtpError(null);
    try {
      const result = await apiFetch<any>('/api/auth/mfa-verify', {
        method: 'POST', body: JSON.stringify({ email, otp: otpCode, mfa_challenge: mfaChallenge })
      });
      completeLogin(result);
    } catch (error) {
      setOtpError(formatApiErrors(error, 'OTP verification failed.').join(' '));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAutoFillDemoOtp = () => {
    setOtpCode('582910');
    setOtpError(null);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Banner / Corporate Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaturathiLogo className="h-9 w-auto" showSlogan={false} />
            <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-800 block">
                Oman Tax Authority Accredited E-Invoicing
              </span>
              <span className="text-[10px] text-slate-500 font-arabic">
                المحرّك الوطني للفواتير الإلكترونية المعتمد
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Peppol BIS PINT OM Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-bold">POWERED BY</span>
              <NetbueLogo className="h-6 w-auto" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Split Screen Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Product Branding & Highlights (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6 pr-0 lg:pr-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
            <span>Netbue Faturathi Enterprise Platform v2.6</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Seamless Oman E-Invoicing <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-700 to-[#0d4f8b] bg-clip-text text-transparent">
              Built for Complete Tax Compliance
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Faturathi by Netbue provides an all-in-one e-invoicing hub designed specifically for the <b>Oman Tax Authority (OTA)</b> guidelines. Process standard tax invoices, simplified B2C receipts, self-billing, credit notes, and 73-field PINT OM validations in real time.
          </p>

          {/* Core Feature Matrix Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 hover:border-emerald-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <FileCheck2 className="h-4 w-4" />
                <span>PINT OM 73-Field Engine</span>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Deterministic UUIDv5 hash generation, Baisa rounding tolerance, and Schematron validations.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 hover:border-blue-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-[#0d4f8b] font-bold text-sm">
                <Server className="h-4 w-4" />
                <span>Multi-ERP Native Connectivity</span>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Direct connectors for SAP S/4HANA, Oracle Cloud, MS Dynamics 365, Tally Prime, and Odoo ERP.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 hover:border-purple-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <Globe className="h-4 w-4" />
                <span>C5 OTA Clearance &amp; Peppol AS4</span>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Tax Data Document (TDD) submission queues &amp; Peppol BIS Message Level Response (MLS) monitoring.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 hover:border-amber-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <Building2 className="h-4 w-4" />
                <span>SAF-T &amp; VAT Audit Trail</span>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Multi-entity group filing, 10-year encrypted archive, and automated SAF-T XML exports.
              </p>
            </div>
          </div>

          {/* Compliance & Security Badges Bar */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> OTA Accredited
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4 text-[#0d4f8b]" /> ISO 27001 Certified
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Lock className="h-4 w-4 text-purple-600" /> 256-Bit Encrypted Data
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Zap className="h-4 w-4 text-amber-600" /> 99.99% Uptime SLA
            </span>
          </div>
        </div>

        {/* Right Column: Portal Login Box (5 cols on lg) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#082f54] via-emerald-500 to-blue-500"></div>

            {authStep === 'credentials' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-between">
                    <span>Sign In to Portal</span>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      SECURE AUTH
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in with your password, then verify the demo email OTP.
                  </p>
                </div>

                {/* Three tenant-facing role presets. Technical super-admin login is intentionally not advertised. */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Select User Role Persona (3 Core Roles):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEMO_USER_ROLES.map((roleItem) => {
                      const isSelected = selectedRole.id === roleItem.id;
                      return (
                        <button
                          key={roleItem.id}
                          type="button"
                          onClick={() => handleRoleSelect(roleItem)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50/80 border-[#0d4f8b] text-slate-900 ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${roleItem.avatarColor}`}>
                              {roleItem.roleBadge}
                            </span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-[#0d4f8b] shrink-0" />}
                          </div>
                          <b className="text-xs font-bold text-slate-800 block truncate">{roleItem.n}</b>
                          <span className="text-[10px] text-slate-500 block truncate font-medium">{roleItem.r}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Role Description Box */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 mt-2">
                    <div className="flex items-center gap-1.5 text-[#0d4f8b] font-bold">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Active Profile: {selectedRole.roleTitle}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {selectedRole.description}
                    </p>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Corporate Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0d4f8b] focus:ring-1 focus:ring-[#0d4f8b] transition-all"
                        placeholder="name@company.om"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setShowForgotModal(true);
                        }}
                        className="text-xs text-[#0d4f8b] hover:underline cursor-pointer font-bold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0d4f8b] focus:ring-1 focus:ring-[#0d4f8b] transition-all font-mono"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#0d4f8b] focus:ring-[#0d4f8b] h-4 w-4"
                      />
                      <span>Remember my role on this browser</span>
                    </label>
                  </div>

                  {loginError ? (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                      {loginError}
                    </div>
                  ) : null}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0d4f8b] hover:from-emerald-500 hover:to-[#0b3d6b] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Checking credentials…</span>
                      </>
                    ) : (
                      <>
                        <span>Login &amp; Continue to OTP</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Step 2: 2FA / MFA Verification Screen */
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> STEP 2 OF 2: MFA / 2FA
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMfaChallenge('');
                        setOtpCode('');
                        setAuthStep('credentials');
                      }}
                      className="text-xs text-[#0d4f8b] hover:underline cursor-pointer font-bold"
                    >
                      Change Role
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">
                    Enter MFA / 2FA Verification Code
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the 6-digit One-Time Password (OTP) sent to your registered authenticator app or email.
                  </p>
                </div>

                {/* Target User Info Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm ${selectedRole.avatarColor}`}>
                    {selectedRole.n.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <b className="text-xs font-bold text-slate-900 block truncate">{selectedRole.n}</b>
                    <span className="text-[11px] text-slate-500 block truncate">{selectedRole.e}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 shrink-0">
                    {selectedRole.roleBadge}
                  </span>
                </div>

                {/* OTP Form */}
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        6-Digit Security OTP Code:
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoFillDemoOtp}
                        className="text-[11px] font-mono font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="h-3 w-3 text-emerald-600" /> Auto-Fill Demo OTP (582910)
                      </button>
                    </div>

                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value);
                          setOtpError(null);
                        }}
                        maxLength={6}
                        required
                        className="w-full bg-white border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-lg font-mono tracking-[0.3em] font-bold text-center text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-slate-400"
                        placeholder="e.g. 582910"
                      />
                    </div>

                    {otpError && (
                      <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                        <span>⚠️</span> {otpError}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                    <span>OTP timer active (SMS/Auth App)</span>
                    <span className="font-mono text-amber-700 font-bold">Resend code in 24s</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0d4f8b] hover:from-emerald-500 hover:to-[#0b3d6b] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying 2FA Security Token...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 text-white" />
                          <span>Verify 2FA &amp; Launch Faturathi Portal</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthStep('credentials')}
                      className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium"
                    >
                      ← Back to User Role Selection
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Forgot Password / Reset Password Help Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 relative shadow-2xl animate-fadeIn">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setResetSent(false);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reset Password Help</h3>
                <p className="text-xs text-slate-500">Netbue Faturathi User Account Services</p>
              </div>
            </div>

            {resetSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-slate-700 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Password Reset Link Sent!</span>
                </div>
                <p>
                  We have dispatched a secure password reset link to <b className="text-slate-900 font-mono">{resetEmail}</b>. Please check your inbox or corporate spam filter.
                </p>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-[11px] text-slate-600">
                  <b>Need instant admin assistance?</b> Contact your Portal Administrator or reach out to Netbue Support at <a href="mailto:support@netbue.om" className="text-[#0d4f8b] underline">support@netbue.om</a> or call <b>800-FATURA</b>.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetSent(false);
                  }}
                  className="w-full py-2 bg-[#0d4f8b] hover:bg-[#0b3d6b] text-white font-bold rounded-xl text-xs cursor-pointer mt-2"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered corporate email below. We will send you an OTP code and instructions to restore or update your password.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0d4f8b] focus:ring-1 focus:ring-[#0d4f8b]"
                      placeholder="user@company.om"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <b className="text-amber-800 flex items-center gap-1 font-bold">
                    <HelpCircle className="h-3.5 w-3.5" /> Support Notice:
                  </b>
                  <p className="text-[11px] text-slate-600">
                    If your account has multi-factor authentication (MFA) enabled via SMS or Auth App, have your device ready when opening the reset link.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0d4f8b] hover:bg-[#0b3d6b] text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Netbue Solutions SAOC. All rights reserved. Faturathi™ E-Invoicing Platform.</span>
          <span className="font-arabic text-slate-600 font-medium">سلطنة عمان — فوترتك من نتبيو</span>
        </div>
      </footer>
    </div>
  );
};
