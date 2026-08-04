import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { SubNavTabStrip } from './components/SubNavTabStrip';
import { Footer } from './components/Footer';
import { DashboardView } from './components/DashboardView';
import { InvoicesView } from './components/InvoicesView';
import { ApiInvoicesView } from './components/ApiInvoicesView';
import { CreateInvoiceView } from './components/CreateInvoiceView';
import { UploadBatchView } from './components/UploadBatchView';
import { DataConnectorsView } from './components/DataConnectorsView';
import { TddMlsView } from './components/TddMlsView';
import { ReconciliationView } from './components/ReconciliationView';
import { ReportsView } from './components/ReportsView';
import { OnboardingView } from './components/OnboardingView';
import { SecurityView } from './components/SecurityView';
import { AdministrationView } from './components/AdministrationView';
import { WhyFaturathiView } from './components/WhyFaturathiView';
import { InvoiceDrawer } from './components/InvoiceDrawer';
import { EditInvoiceModal } from './components/EditInvoiceModal';
import { LoginPage, AuthUser } from './components/LoginPage';
import { CertificateWarningModal } from './components/CertificateWarningModal';
import { PreLandingCertChecker } from './components/PreLandingCertChecker';
import EndpointDocs from './components/EndpointDocs';
import { Invoice, User, RoleMode, canEditInvoice } from './types';
import { AnimatePresence, motion } from 'motion/react';

const INITIAL_INVOICES: Invoice[] = [
  {
    n: "IIS-2026-08-0099",
    d: "2026-08-02",
    t: "14:20:00",
    type: "Standard Invoice",
    dir: "Outbound (AR)",
    cp: "Muscat Marine Services SAOC",
    cpv: "11008877", // Missing 'OM' prefix -> INVALID VATIN
    eas: "0248:11008877",
    net: 3200.000,
    vat: 160.000,
    st: "Rejected",
    tdd: "Rejected · OTA Error C5",
    err: "Schematron Error BR-O-02: Buyer VATIN '11008877' violates Oman PINT-OM syntax rules. Must start with 'OM' followed by 8–12 digits (e.g. OM1100887700).",
    tt: "10000000000000000000",
    cat: "S 5%",
    b2c: false,
    ent: "E1",
    branch: "100 — HQ Muscat",
    erpSystem: "SAP S/4HANA",
    sourceChannel: "REST API",
    lines: [
      ["Navigational Radar Calibration & SLA Support", 1, "3200.000", "S 5%"]
    ],
    uuid: "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
    sVat: "OM1100123456"
  },
  {
    n: "IIS-2026-07-0042",
    d: "2026-07-29",
    t: "10:14:22",
    type: "Standard Invoice",
    dir: "Outbound (AR)",
    cp: "Johnson & Co. Ltd (Oman)",
    cpv: "OM1100654321",
    eas: "0248:OM1100654321",
    net: 4500.000,
    vat: 225.000,
    st: "Reported",
    tdd: "Submit · Ack",
    tt: "10000000000000000000",
    cat: "S 5%",
    b2c: false,
    ent: "E1",
    branch: "100 — HQ Muscat",
    erpSystem: "SAP S/4HANA",
    sourceChannel: "REST API",
    lines: [
      ["Enterprise AI Cloud Platform Connector", 1, "3500.000", "S 5%"],
      ["Annual Maintenance & SLA Support", 1, "1000.000", "S 5%"]
    ],
    uuid: "a1b2c3d4-e5f6-5789-a1b2-c3d4e5f67890",
    sVat: "OM1100123456"
  },
  {
    n: "AAE-2026-07-0108",
    d: "2026-07-29",
    t: "14:02:10",
    type: "Standard Invoice",
    dir: "Outbound (AR)",
    cp: "Al-bhurji Contracting LLC (Oman)",
    cpv: "OM1100778899",
    eas: "0248:OM1100778899",
    net: 12500.000,
    vat: 625.000,
    st: "Reported",
    tdd: "Submit · Ack",
    tt: "10000000000000000000",
    cat: "S 5%",
    b2c: false,
    ent: "E2",
    branch: "200 — Sohar Operations",
    erpSystem: "Oracle Cloud ERP",
    sourceChannel: "SFTP Sync",
    lines: [
      ["Heavy Machinery Supply & Site Logistics", 5, "2500.000", "S 5%"]
    ],
    uuid: "b2c3d4e5-f6a7-5890-b2c3-d4e5f6a78901",
    sVat: "OM1100223344"
  },
  {
    n: "ABS-2026-07-0201",
    d: "2026-07-28",
    t: "11:30:00",
    type: "Export",
    dir: "Outbound (AR)",
    cp: "Abdulla NASS GROUP (Bahrain)",
    cpv: "BH100200300",
    eas: "0248:997770000097",
    net: 18400.000,
    vat: 0.000,
    st: "Reported",
    tdd: "Submit · Ack",
    tt: "10010000000000000000",
    cat: "Z 0%",
    b2c: false,
    ent: "E3",
    branch: "300 — Salalah Port Office",
    erpSystem: "Microsoft Dynamics 365",
    sourceChannel: "ERP Integration",
    lines: [
      ["Cross-Border Industrial Valve Systems (GCC Export)", 10, "1840.000", "Z 0%"]
    ],
    uuid: "c3d4e5f6-a7b8-5901-c3d4-e5f6a7b89012",
    sVat: "OM1100334455"
  },
  {
    n: "INV-2026-AP-0102",
    d: "2026-07-31",
    t: "09:30:00",
    type: "Standard Invoice",
    dir: "Inbound (AP)",
    cp: "Gulf IT Logistics LLC",
    cpv: "OM1100998877",
    eas: "0248:OM1100998877",
    net: 5200.000,
    vat: 260.000,
    st: "Reported",
    tdd: "C3 leg · Ack",
    ap: "Awaiting Inbound Review",
    tt: "10000000000000000000",
    cat: "S 5%",
    b2c: false,
    ent: "E1",
    branch: "100 — HQ Muscat",
    erpSystem: "SAP S/4HANA",
    sourceChannel: "REST API",
    lines: [
      ["Data Center Network Rack Switch Array", 2, "2600.000", "S 5%"]
    ],
    uuid: "f1e2d3c4-b5a6-7890-f1e2-d3c4b5a67890",
    sVat: "OM1100998877"
  },
  {
    n: "INV-2026-AP-0105",
    d: "2026-07-30",
    t: "16:20:00",
    type: "Standard Invoice",
    dir: "Inbound (AP)",
    cp: "Oman Oilfield Services SAOC",
    cpv: "OM1100223344",
    eas: "0248:OM1100223344",
    net: 14200.000,
    vat: 710.000,
    st: "Reported",
    tdd: "C3 leg · Ack",
    ap: "Awaiting Inbound Review",
    tt: "10000000000000000000",
    cat: "S 5%",
    b2c: false,
    ent: "E1",
    branch: "100 — HQ Muscat",
    erpSystem: "Oracle Cloud ERP",
    sourceChannel: "SFTP Sync",
    lines: [
      ["Industrial Drilling Fluids & Site Testing", 1, "14200.000", "S 5%"]
    ],
    uuid: "e2d3c4b5-a6f7-8901-e2d3-c4b5a6f78901",
    sVat: "OM1100223344"
  },
  {
    n: "PINV-2026-07-0099",
    d: "2026-07-24",
    t: "08:15:00",
    type: "Standard Invoice",
    dir: "Inbound (AP)",
    cp: "Alfaris Business Solutions",
    cpv: "OM1100334455",
    eas: "0248:OM1100334455",
    net: 3400.000,
    vat: 170.000,
    st: "Reported",
    tdd: "C3 leg · Ack",
    ap: "Approved · posted to ERP",
    tt: "10000000000000000000",
    cat: "S 5%",
    b2c: false,
    ent: "E1",
    branch: "100 — HQ Muscat",
    erpSystem: "Microsoft Dynamics 365",
    sourceChannel: "REST API",
    lines: [
      ["Enterprise Software Licenses — Q3", 1, "3400.000", "S 5%"]
    ],
    uuid: "2c3d4e5f-6a7b-8901-2c3d-4e5f6a7b8901",
    sVat: "OM1100334455"
  }
];

const INITIAL_USERS: User[] = [
  { id: "1", n: "Salim Al-Harthy", e: "salim.h@intel-sol.om", r: "Super Admin", ent: "All Entities", st: "Active", ll: "Today, 09:15" },
  { id: "2", n: "Fatma Al-Zahra", e: "fatma.z@alibri.om", r: "Finance Manager", fontRole: "finmgr", ent: "E2 — Aji Alibri Enterprises", st: "Active", ll: "Yesterday, 16:40" },
  { id: "3", n: "Ahmed Al-Balushi", e: "ahmed.b@alfaris.om", r: "Invoice Clerk", fontRole: "maker", ent: "E3 — Alfaris Business Solutions", st: "Active", ll: "Today, 08:30" },
  { id: "4", n: "Mariam Al-Kindi", e: "mariam.k@intel-sol.om", r: "Operations Viewer", fontRole: "ops", ent: "E1 — International Intelligence Solutions", st: "Active", ll: "26 Jul 2026" },
  { id: "5", n: "KPMG Auditor", e: "audit.oman@kpmg.com", r: "Auditor", fontRole: "audit", ent: "All Entities", st: "Active", ll: "20 Jul 2026" }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dash');
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [selectedEntity, setSelectedEntity] = useState<string>(''); // empty = whole group
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [roleMode, setRoleMode] = useState<RoleMode>('admin');
  const [maskAmounts, setMaskAmounts] = useState<boolean>(false);
  const [showDocs, setShowDocs] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Certificate & Pre-Landing Security State
  const [isCertVerifiedPreLanding, setIsCertVerifiedPreLanding] = useState<boolean>(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);
  const [certVerified, setCertVerified] = useState<boolean>(true);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setRoleMode(user.mappedRoleMode);
    setActiveTab('dash');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const apiEndpoint = `${window.location.origin}/api/invoices`;

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setInvoices(data);
        }
      }
    } catch (e) {
      console.warn('Backend fetch failed, using memory state:', e);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleResetDb = async () => {
    if (!confirm('This will reset seed data to standard defaults. Proceed?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        await fetchInvoices();
      } else {
        setInvoices(INITIAL_INVOICES);
      }
    } catch (e) {
      setInvoices(INITIAL_INVOICES);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateInvoiceSubmit = async (newInv: any) => {
    const invWithId: Invoice = {
      ...newInv,
      ent: selectedEntity || 'E1',
      branch: '100 — HQ Muscat',
      uuid: newInv.uuid || `${Math.random().toString(36).slice(2, 10)}-${Date.now()}`
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invWithId)
      });
      if (res.ok) {
        await fetchInvoices();
      } else {
        setInvoices((prev) => [invWithId, ...prev]);
      }
    } catch (e) {
      setInvoices((prev) => [invWithId, ...prev]);
    }

    setActiveTab('inv');
    setSelectedInvoice(invWithId);
  };

  const handleBatchParsed = async (newBatchInvoices: any[]) => {
    setInvoices((prev) => [...newBatchInvoices, ...prev]);
    setActiveTab('inv');
  };

  const handleApproveAp = (invNum: string) => {
    setInvoices((prev) =>
      prev.map((i) =>
        i.n === invNum ? { ...i, ap: 'Approved & Posted to ERP' } : i
      )
    );
    if (selectedInvoice && selectedInvoice.n === invNum) {
      setSelectedInvoice((prev) => prev ? { ...prev, ap: 'Approved & Posted to ERP' } : null);
    }
  };

  const handleResendInvoice = (invNum: string) => {
    const target = invoices.find(i => i.n === invNum);
    if (target) {
      handleOpenEditInvoice(target);
    } else {
      setInvoices((prev) =>
        prev.map((i) =>
          i.n === invNum ? { ...i, st: 'Reported', tdd: 'Reported', err: undefined } : i
        )
      );
      if (selectedInvoice && selectedInvoice.n === invNum) {
        setSelectedInvoice((prev) =>
          prev ? { ...prev, st: 'Reported', tdd: 'Reported', err: undefined } : null
        );
      }
    }
  };

  const handleOpenEditInvoice = (inv: Invoice) => {
    if (!canEditInvoice(inv)) {
      alert(`Invoice ${inv.n} has been submitted to OTA/Peppol (${inv.tdd}). Under Oman Tax Authority PINT-OM rules, submitted invoices cannot be edited or deleted.`);
      return;
    }
    setEditingInvoice(inv);
    setIsEditModalOpen(true);
  };

  const handleSaveAndResendInvoice = async (updatedInvoice: Invoice) => {
    setInvoices((prev) =>
      prev.map((i) => (i.n === updatedInvoice.n ? updatedInvoice : i))
    );

    if (selectedInvoice && selectedInvoice.n === updatedInvoice.n) {
      setSelectedInvoice(updatedInvoice);
    }

    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedInvoice)
      });
    } catch (e) {
      console.warn('Backend update note:', e);
    }
  };

  const handleAddUser = (newUser: any) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, st: u.st === 'Active' ? 'Disabled' : 'Active' }
          : u
      )
    );
  };

  const handleTriggerTddSubmit = () => {
    fetchInvoices();
  };

  if (!isCertVerifiedPreLanding) {
    return <PreLandingCertChecker onProceed={() => setIsCertVerifiedPreLanding(true)} />;
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Main Top Header */}
      <Header
        selectedEntity={selectedEntity}
        onSelectEntity={setSelectedEntity}
        showDocs={showDocs}
        onToggleDocs={() => setShowDocs(!showDocs)}
        onResetDb={handleResetDb}
        isResetting={isResetting}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenCertModal={() => setIsCertModalOpen(true)}
        certVerified={certVerified}
      />

      {/* Navbar Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        roleMode={roleMode}
      />

      {/* Secondary Cascade Sub-Tab Strip */}
      <SubNavTabStrip
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area - Responsive Full Width */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Collapsible Setup Docs */}
        <AnimatePresence>
          {showDocs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <EndpointDocs apiEndpoint={apiEndpoint} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 1: Dashboard */}
        {activeTab === 'dash' && (
          <DashboardView
            invoices={invoices}
            maskAmounts={maskAmounts}
            onSelectInvoice={setSelectedInvoice}
            selectedEntity={selectedEntity}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Tab 2: Outbound & All Invoices Register */}
        {activeTab === 'inv' && (
          <InvoicesView
            invoices={invoices}
            maskAmounts={maskAmounts}
            onSelectInvoice={setSelectedInvoice}
            selectedEntity={selectedEntity}
            onSelectEntity={setSelectedEntity}
            roleMode={roleMode}
            onEditInvoice={handleOpenEditInvoice}
          />
        )}

        {/* Tab 3: API Invoices (Inbound AP Action Hub) */}
        {(activeTab === 'api_inv' || activeTab === 'ap_inv') && (
          <ApiInvoicesView
            invoices={invoices}
            onSelectInvoice={setSelectedInvoice}
            onApproveAp={handleApproveAp}
            maskAmounts={maskAmounts}
          />
        )}

        {/* Tab 4: Create Invoice (Quick Invoice & PINT-OM 73-Field Engine) */}
        {activeTab === 'new' && (
          <CreateInvoiceView onSubmitInvoice={handleCreateInvoiceSubmit} />
        )}

        {/* Tab 5: Upload & Batch */}
        {(activeTab === 'up' || activeTab === 'up_batch') && (
          <UploadBatchView onBatchParsed={handleBatchParsed} activeTab={activeTab} />
        )}

        {/* Tab 6: Data Sources & Client Connectors */}
        {activeTab === 'connectors' && (
          <DataConnectorsView />
        )}

        {/* Tab 7: TDD & MLS */}
        {activeTab === 'tdd' && (
          <TddMlsView
            invoices={invoices}
            onTriggerTddSubmit={handleTriggerTddSubmit}
            onSaveAndResendInvoice={handleSaveAndResendInvoice}
          />
        )}

        {/* Tab 8: Reconciliation */}
        {activeTab === 'rec' && <ReconciliationView />}

        {/* Tab 9: Reports & Archive & Audit Logs */}
        {(activeTab === 'rep' || activeTab === 'audit_logs') && <ReportsView activeTab={activeTab} />}

        {/* Tab 10: Onboarding & SMP */}
        {activeTab === 'onb' && <OnboardingView />}

        {/* Tab 11: Security */}
        {activeTab === 'sec' && <SecurityView />}

        {/* Tab 12: Administration & System Setup */}
        {(activeTab === 'adm' || activeTab === 'sys_logs' || activeTab === 'sys_setup' || activeTab === 'gen_cfg') && (
          <AdministrationView
            roleMode={roleMode}
            onChangeRoleMode={setRoleMode}
            maskAmounts={maskAmounts}
            onToggleMaskAmounts={() => setMaskAmounts(!maskAmounts)}
            users={users}
            onAddUser={handleAddUser}
            onToggleUserStatus={handleToggleUserStatus}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Tab 13: Why Faturathi */}
        {activeTab === 'cmp' && <WhyFaturathiView />}
      </main>

      {/* Slide-In Invoice Detail Drawer */}
      <InvoiceDrawer
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        maskAmounts={maskAmounts}
        roleMode={roleMode}
        onApproveAp={handleApproveAp}
        onResendInvoice={handleResendInvoice}
        onEditInvoice={handleOpenEditInvoice}
      />

      {/* Edit Invoice & Re-submit Modal */}
      <EditInvoiceModal
        invoice={editingInvoice}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaveAndResend={handleSaveAndResendInvoice}
      />

      {/* Corporate Footer */}
      <Footer />

      {/* Certificate Warning Landing Modal */}
      <CertificateWarningModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        onCertificateInstalled={() => setCertVerified(true)}
      />
    </div>
  );
}
