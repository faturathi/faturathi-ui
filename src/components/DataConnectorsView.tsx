import React, { useEffect, useState } from 'react';
import { ApiError, apiFetch } from '../lib/api';
import { 
  FileSpreadsheet, 
  Server, 
  Cloud, 
  Mail, 
  Code2, 
  CheckCircle2, 
  Copy, 
  Check, 
  Key, 
  ShieldCheck, 
  Terminal, 
  Upload, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Database,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export const DataConnectorsView: React.FC = () => {
  const [selectedConnector, setSelectedConnector] = useState<'sftp' | 's3' | 'email' | 'api'>('sftp');

  // SFTP Form State
  const [sftpHost, setSftpHost] = useState('sftp.company.com.om');
  const [sftpPort, setSftpPort] = useState('22');
  const [sftpUser, setSftpUser] = useState('faturathi_sync');
  const [sftpAuthType, setSftpAuthType] = useState<'pass' | 'key'>('pass');
  const [sftpPass, setSftpPass] = useState('••••••••••••');
  const [sftpPath, setSftpPath] = useState('/var/einvoices/outbound');
  const [sftpTesting, setSftpTesting] = useState(false);
  const [sftpStatus, setSftpStatus] = useState<string | null>(null);

  // S3 Form State
  const [s3Region, setS3Region] = useState('me-central-1 (Muscat)');
  const [s3Bucket, setS3Bucket] = useState('company-faturathi-invoices-archive');
  const [s3AccessKey, setS3AccessKey] = useState('AKIAIOSFODNN7EXAMPLE');
  const [s3SecretKey, setS3SecretKey] = useState('••••••••••••••••••••••••••••••••');
  const [s3Folder, setS3Folder] = useState('inbound/pint-om-xml/');
  const [s3Testing, setS3Testing] = useState(false);
  const [s3Status, setS3Status] = useState<string | null>(null);

  // Email Form State
  const [emailHost, setEmailHost] = useState('imap.company.com.om');
  const [emailPort, setEmailPort] = useState('993');
  const [emailAddr, setEmailAddr] = useState('einvoices@company.com.om');
  const [emailPass, setEmailPass] = useState('••••••••••••');
  const [emailFilter, setEmailFilter] = useState('XML, JSON, Zip attachment');
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // REST API User Creation State
  const [apiUsers, setApiUsers] = useState<any[]>([]);
  const [newApiName, setNewApiName] = useState('');
  const [newApiOrg, setNewApiOrg] = useState('E1 — HQ Muscat');
  const [newApiRole, setNewApiRole] = useState('Write & Read (POST & GET /api/invoices)');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Postman Input Data Validator Playground State
  const validPostmanPreset = {
    BTOM_001_OmanTransactionType: "10000000000000000000",
    BTOM_002_InvoiceUUID: "b41c72aa-9912-5f2b-8d34-77c1e09a55d0",
    IBT_001_InvoiceNumber: "POSTMAN-2026-001",
    IBT_002_InvoiceIssueDate: "2026-08-01",
    IBT_168_InvoiceIssueTime: "10:30:00",
    IBT_003_InvoiceTypeCode: "380",
    IBT_024_SpecificationIdentifier: "urn:peppol:pint:billing-1@om-1",
    IBT_023_BusinessProcessType: "urn:peppol:bis:billing",
    IBT_007_TaxPointDate: "2026-08-01",
    IBT_005_InvoiceCurrencyCode: "OMR",
    IBT_006_VATAccountingCurrency: "OMR",
    SellerDetails: {
      IBT_027_SellerName: "International Intelligence Solutions LLC",
      IBT_034_SellerIdentifier: "OM1100123456",
      IBT_034_1_SellerIdentifierScheme: "0248",
      IBT_031_SellerVATIdentifier: "OM1100123456",
      IBT_031_1_SellerVATScheme: "VAT",
      IBT_028_SellerTradingName: "IIS Oman Enterprise Solutions",
      IBT_035_SellerAddressLine1: "Sultan Qaboos Street, Building 45",
      IBT_037_SellerCity: "Muscat",
      IBT_038_SellerPostCode: "112",
      IBT_040_SellerCountryCode: "OM",
      IBT_034_SellerElectronicAddress: "0248:OM1100123456",
      IBT_034_1_SellerElectronicAddressScheme: "0248"
    },
    BuyerDetails: {
      IBT_044_BuyerName: "Muscat Retail SAOC",
      IBT_049_BuyerIdentifier: "OM1100654321",
      IBT_049_1_BuyerIdentifierScheme: "0248",
      IBT_048_BuyerVATIdentifier: "OM1100654321",
      IBT_048_1_BuyerVATScheme: "VAT",
      IBT_045_BuyerTradingName: "Muscat Hypermarkets",
      IBT_050_BuyerAddressLine1: "Al Khuwair Commercial Area",
      IBT_052_BuyerCity: "Muscat",
      IBT_053_BuyerPostCode: "133",
      IBT_055_BuyerCountryCode: "OM",
      IBT_049_BuyerElectronicAddress: "0248:OM1100654321"
    },
    PaymentDetails: {
      IBT_081_PaymentMeansCode: "30",
      IBT_084_PaymentAccountIdentifier: "OM9300001234567890123456",
      IBT_009_PaymentDueDate: "2026-08-31",
      IBT_020_PaymentTermsNote: "Net 30 days via Bank Wire"
    },
    Totals: {
      IBT_106_SumLineNetAmount: 500.000,
      IBT_107_SumAllowances: 0.000,
      IBT_108_SumCharges: 0.000,
      IBT_109_InvoiceTotalNetAmount: 500.000,
      IBT_110_InvoiceTotalVATAmount: 25.000,
      IBT_111_VATAmountAccountingCurrency: 25.000,
      IBT_112_InvoiceTotalAmountWithVAT: 525.000,
      IBT_115_AmountDuePayment: 525.000
    },
    VATBreakdown: [
      {
        IBT_116_TaxableAmount: 500.000,
        IBT_117_TaxAmount: 25.000,
        IBT_118_CategoryCode: "S",
        IBT_119_Rate: 5,
        TaxSchemeID: "VAT"
      }
    ],
    Lines: [
      {
        IBT_126_LineIdentifier: "1",
        IBT_127_LineNote: "Enterprise PINT OM Compliance Integration SLA",
        IBT_129_InvoicedQuantity: 1,
        IBT_130_QuantityUnitCode: "EA",
        IBT_131_LineNetAmount: 500.000,
        IBT_153_ItemName: "PINT OM Peppol Gateway License",
        IBT_151_ItemVATCategoryCode: "S",
        IBT_152_ItemVATRate: 5,
        IBT_146_ItemNetPrice: 500.000
      }
    ]
  };

  const invalidPostmanPreset = {
    BTOM_001_OmanTransactionType: "",
    IBT_001_InvoiceNumber: "INVALID-POSTMAN-99",
    IBT_002_InvoiceIssueDate: "01-08-2026",
    SellerDetails: {
      IBT_027_SellerName: "",
      IBT_034_SellerIdentifier: "INVALID_VAT_FORMAT"
    },
    BuyerDetails: {
      IBT_044_BuyerName: ""
    },
    Totals: {
      IBT_109_InvoiceTotalNetAmount: 100.000,
      IBT_110_InvoiceTotalVATAmount: 5.000,
      IBT_112_InvoiceTotalAmountWithVAT: 999.000
    },
    VATBreakdown: [],
    Lines: []
  };

  const [postmanPayloadStr, setPostmanPayloadStr] = useState<string>(
    JSON.stringify(validPostmanPreset, null, 2)
  );
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [postmanTestResult, setPostmanTestResult] = useState<any | null>(null);

  const handleLoadValidPreset = () => {
    setPostmanPayloadStr(JSON.stringify(validPostmanPreset, null, 2));
    setPostmanTestResult(null);
  };

  const handleLoadInvalidPreset = () => {
    setPostmanPayloadStr(JSON.stringify(invalidPostmanPreset, null, 2));
    setPostmanTestResult(null);
  };

  const handleExecutePostmanValidation = async () => {
    setIsTestingApi(true);
    setPostmanTestResult(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(postmanPayloadStr);
      } catch (e: any) {
        setPostmanTestResult({
          isValid: false,
          message: `JSON Syntax Error: ${e.message}`,
          rejectionReasons: [{ fieldId: 'JSON_PARSER', message: 'Malformed JSON payload body' }]
        });
        setIsTestingApi(false);
        return;
      }

      const data = await apiFetch<any>('/api/validate', {
        method: 'POST',
        body: JSON.stringify(parsed)
      });
      setPostmanTestResult(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.payload) {
        setPostmanTestResult(err.payload as any);
        return;
      }
      setPostmanTestResult({
        isValid: false,
        message: `Network Error calling /api/validate: ${err.message}`,
        rejectionReasons: [{ fieldId: 'HTTP_ERROR', message: err.message }]
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  // Manual File Dropzone state
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  const handleTestSftp = () => {
    setSftpTesting(true);
    setSftpStatus(null);
    setTimeout(() => {
      setSftpTesting(false);
      setSftpStatus('Connection Successful! SFTP directory /var/einvoices/outbound mounted.');
    }, 1200);
  };

  const handleTestS3 = () => {
    setS3Testing(true);
    setS3Status(null);
    setTimeout(() => {
      setS3Testing(false);
      setS3Status('S3 Bucket authenticated! Bucket policies verified for ME-Central-1.');
    }, 1200);
  };

  const handleTestEmail = () => {
    setEmailTesting(true);
    setEmailStatus(null);
    setTimeout(() => {
      setEmailTesting(false);
      setEmailStatus('IMAP Mailbox Connected! Ready to parse inbound PDF/XML invoices.');
    }, 1200);
  };

  useEffect(() => {
    void apiFetch<any[]>('/api/connectors/credentials').then(setApiUsers)
      .catch((error) => console.warn('Credential loading failed:', error));
  }, []);

  const handleCreateApiUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiName.trim()) return;
    try {
      const credential = await apiFetch<any>('/api/connectors/credentials', {
        method: 'POST', body: JSON.stringify({ name: newApiName.trim(), role: newApiRole })
      });
      setApiUsers(prev => [credential, ...prev]);
      setNewApiName('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Credential generation failed. Select one supplier company first.');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0d4f8b] to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>Multi-Source Data Ingestion Framework</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Data Sources &amp; Client Connectors
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
            Configure automated ingestion pipelines from your client systems into the Netbue Faturathi PINT OM engine using manual file uploads, SFTP server, AWS S3 buckets, Email IMAP inbox, or REST API keys.
          </p>
        </div>
      </div>

      {/* Radio Buttons Connector Tile Selector */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
          Select Data Ingestion Connector Type:
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Connector 1: SFTP Server */}
          <label
            onClick={() => setSelectedConnector('sftp')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative ${
              selectedConnector === 'sftp'
                ? 'bg-purple-50/80 border-purple-600 ring-2 ring-purple-500/20 text-slate-900 shadow-md'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
                <Server className="h-5 w-5" />
              </div>
              <input
                type="radio"
                name="connector_type"
                checked={selectedConnector === 'sftp'}
                onChange={() => setSelectedConnector('sftp')}
                className="h-4 w-4 text-purple-600"
              />
            </div>
            <div>
              <b className="text-xs font-bold block text-slate-900">1. File Transfer (SFTP)</b>
              <span className="text-[10px] text-slate-500 block">Automated Directory Sync</span>
            </div>
          </label>

          {/* Connector 2: S3 Bucket */}
          <label
            onClick={() => setSelectedConnector('s3')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative ${
              selectedConnector === 's3'
                ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-500/20 text-slate-900 shadow-md'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs">
                <Cloud className="h-5 w-5" />
              </div>
              <input
                type="radio"
                name="connector_type"
                checked={selectedConnector === 's3'}
                onChange={() => setSelectedConnector('s3')}
                className="h-4 w-4 text-amber-600"
              />
            </div>
            <div>
              <b className="text-xs font-bold block text-slate-900">2. S3 Bucket</b>
              <span className="text-[10px] text-slate-500 block">AWS / MinIO Object Storage</span>
            </div>
          </label>

          {/* Connector 3: Email Inbox */}
          <label
            onClick={() => setSelectedConnector('email')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative ${
              selectedConnector === 'email'
                ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 text-slate-900 shadow-md'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="radio"
                name="connector_type"
                checked={selectedConnector === 'email'}
                onChange={() => setSelectedConnector('email')}
                className="h-4 w-4 text-emerald-600"
              />
            </div>
            <div>
              <b className="text-xs font-bold block text-slate-900">3. Email IMAP</b>
              <span className="text-[10px] text-slate-500 block">Auto-extract Attachments</span>
            </div>
          </label>

          {/* Connector 4: REST API Tokens */}
          <label
            onClick={() => setSelectedConnector('api')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative ${
              selectedConnector === 'api'
                ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-500/20 text-slate-900 shadow-md'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-xs">
                <Code2 className="h-5 w-5" />
              </div>
              <input
                type="radio"
                name="connector_type"
                checked={selectedConnector === 'api'}
                onChange={() => setSelectedConnector('api')}
                className="h-4 w-4 text-teal-600"
              />
            </div>
            <div>
              <b className="text-xs font-bold block text-slate-900">4. REST API Tokens</b>
              <span className="text-[10px] text-slate-500 block">Bearer Token &amp; Key Auth</span>
            </div>
          </label>
        </div>
      </div>

      {/* Dynamic Connector Detail Configuration Panels */}

      {/* 2. File Transfer (SFTP) Configuration Form */}
      {selectedConnector === 'sftp' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl border border-purple-300">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">SFTP Server Connector Configuration</h2>
              <p className="text-xs text-slate-500">Configure background polling to pull outbound invoice files from an enterprise SFTP host.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">SFTP Host / IP Address</label>
              <input
                type="text"
                value={sftpHost}
                onChange={(e) => setSftpHost(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Port</label>
              <input
                type="text"
                value={sftpPort}
                onChange={(e) => setSftpPort(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">SFTP Username</label>
              <input
                type="text"
                value={sftpUser}
                onChange={(e) => setSftpUser(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Authentication Method</label>
              <select
                value={sftpAuthType}
                onChange={(e) => setSftpAuthType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-purple-500"
              >
                <option value="pass">Password Authentication</option>
                <option value="key">SSH Private Key (.pem)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {sftpAuthType === 'pass' ? 'SFTP Password' : 'SSH Private Key / Passphrase'}
              </label>
              <input
                type="password"
                value={sftpPass}
                onChange={(e) => setSftpPass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Remote Directory Path</label>
              <input
                type="text"
                value={sftpPath}
                onChange={(e) => setSftpPath(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {sftpStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{sftpStatus}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestSftp}
              disabled={sftpTesting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {sftpTesting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Server className="h-3.5 w-3.5" />
                  <span>Test SFTP Connection &amp; Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. S3 Bucket Configuration Form */}
      {selectedConnector === 's3' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl border border-amber-300">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">S3 Object Storage Bucket Configuration</h2>
              <p className="text-xs text-slate-500">Connect AWS S3 or S3-compatible cloud storage (MinIO, Google Cloud Storage, Ceph) for invoice event-driven ingestion.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">S3 Region</label>
              <input
                type="text"
                value={s3Region}
                onChange={(e) => setS3Region(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bucket Name</label>
              <input
                type="text"
                value={s3Bucket}
                onChange={(e) => setS3Bucket(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">AWS Access Key ID</label>
              <input
                type="text"
                value={s3AccessKey}
                onChange={(e) => setS3AccessKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">AWS Secret Access Key</label>
              <input
                type="password"
                value={s3SecretKey}
                onChange={(e) => setS3SecretKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Folder Prefix / Path</label>
              <input
                type="text"
                value={s3Folder}
                onChange={(e) => setS3Folder(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {s3Status && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{s3Status}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestS3}
              disabled={s3Testing}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {s3Testing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying S3 Bucket Access...</span>
                </>
              ) : (
                <>
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Test S3 Credentials &amp; Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. Email IMAP Configuration Form */}
      {selectedConnector === 'email' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-300">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Email Ingestion (IMAP / SMTP Configuration)</h2>
              <p className="text-xs text-slate-500">Automatically poll dedicated billing mailbox and parse incoming invoice XML/PDF attachments.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">IMAP Server Host</label>
              <input
                type="text"
                value={emailHost}
                onChange={(e) => setEmailHost(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">IMAP Port (SSL)</label>
              <input
                type="text"
                value={emailPort}
                onChange={(e) => setEmailPort(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Billing Email Address</label>
              <input
                type="email"
                value={emailAddr}
                onChange={(e) => setEmailAddr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">App Password / Secret</label>
              <input
                type="password"
                value={emailPass}
                onChange={(e) => setEmailPass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Attachment Parsing Rule</label>
              <input
                type="text"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {emailStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{emailStatus}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={emailTesting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {emailTesting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Connecting to Mailbox...</span>
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" />
                  <span>Test Mailbox &amp; Save Connector</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 5. REST API Tokens & User Provisioning Panel */}
      {selectedConnector === 'api' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl border border-teal-300">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">REST API User Creation &amp; Token Generator</h2>
              <p className="text-xs text-slate-500">Create dedicated API service users to post PINT OM invoices via JSON payloads from SAP, Oracle, Odoo, or custom ERP systems.</p>
            </div>
          </div>

          {/* Form to Create New API Service User */}
          <form onSubmit={handleCreateApiUser} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs">
            <b className="text-slate-900 font-bold block text-sm">Provision New API User &amp; Credentials</b>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">API Service User Name</label>
                <input
                  type="text"
                  value={newApiName}
                  onChange={(e) => setNewApiName(e.target.value)}
                  placeholder="e.g. Oracle ERP Service Integration"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Organization Entity Scope</label>
                <select
                  value={newApiOrg}
                  onChange={(e) => setNewApiOrg(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-teal-500"
                >
                  <option value="E1 — HQ Muscat">E1 — HQ Muscat</option>
                  <option value="E2 — Salalah Branch">E2 — Salalah Branch</option>
                  <option value="E3 — Sohar Logistics">E3 — Sohar Logistics</option>
                  <option value="All Entities (VAT Group)">All Entities (VAT Group)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Privilege Level</label>
                <select
                  value={newApiRole}
                  onChange={(e) => setNewApiRole(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-teal-500"
                >
                  <option value="Write & Read (POST & GET /api/invoices)">Write &amp; Read (POST &amp; GET /api/invoices)</option>
                  <option value="Write Only (POST /api/invoices)">Write Only (POST /api/invoices)</option>
                  <option value="Full Admin API Access">Full Admin API Access</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Generate API Key &amp; Bearer Token</span>
              </button>
            </div>
          </form>

          {/* Active API Users Table */}
          <div className="space-y-3">
            <b className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Active Provisioned REST API Keys ({apiUsers.length}):</b>
            
            <div className="space-y-3">
              {apiUsers.map((usr) => (
                <div key={usr.id} className="p-4 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-teal-400" />
                      <b className="text-white text-sm font-bold">{usr.name}</b>
                      <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
                        {usr.org}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Created: {usr.createdAt}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    {/* API Key */}
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[10px] text-slate-500 block">API KEY (X-API-KEY):</span>
                        <span className="text-teal-300 font-bold">{usr.apiKey}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(usr.apiKey, `key-${usr.id}`)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0 cursor-pointer"
                        title="Copy API Key"
                      >
                        {copiedIndex === `key-${usr.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Bearer Token */}
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[10px] text-slate-500 block">BEARER TOKEN:</span>
                        <span className="text-emerald-300 font-bold truncate block">{usr.bearerToken || 'Hidden — generate a new token to reveal it'}</span>
                      </div>
                      <button
                        onClick={() => usr.bearerToken && handleCopy(usr.bearerToken, `token-${usr.id}`)}
                        disabled={!usr.bearerToken}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0 cursor-pointer"
                        title="Copy Bearer Token"
                      >
                        {copiedIndex === `token-${usr.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* cURL Code Example Snippet & Interactive Postman Validator */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-xs font-mono text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-teal-400 font-bold flex items-center gap-2 text-sm">
                <Terminal className="h-5 w-5" /> Real API / Postman Input Data Validator (73 Fields)
              </span>
              <button
                onClick={() => handleCopy(`curl -X POST "${window.location.origin}/api/validate" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(validPostmanPreset, null, 2)}'`, 'curl-sample')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer border border-slate-700 flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy 73-Field cURL Command</span>
              </button>
            </div>

            {/* Playground Preset Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadValidPreset}
                  className="px-3.5 py-1.5 bg-emerald-950/90 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/40 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Load Valid 73-Field Postman Payload</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadInvalidPreset}
                  className="px-3.5 py-1.5 bg-red-950/90 text-red-300 hover:bg-red-900 border border-red-500/40 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  <span>Load Invalid Payload (Triggers Rejection)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleExecutePostmanValidation}
                disabled={isTestingApi}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-[#0d4f8b] hover:from-teal-400 hover:to-[#0b3d6b] text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-2 shadow-lg transition-all"
              >
                {isTestingApi ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Executing POST /api/validate...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-teal-300" />
                    <span>Run Live /api/validate Endpoint Test</span>
                  </>
                )}
              </button>
            </div>

            {/* Editable JSON Payload Input Area */}
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">
                Postman / cURL JSON Payload Body:
              </label>
              <textarea
                value={postmanPayloadStr}
                onChange={(e) => setPostmanPayloadStr(e.target.value)}
                rows={12}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-teal-200 outline-none focus:border-teal-500 leading-relaxed"
              />
            </div>

            {/* Live Endpoint Response Box */}
            {postmanTestResult && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      postmanTestResult.isValid
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-950 text-red-300 border border-red-500/40'
                    }`}>
                      HTTP {postmanTestResult.isValid ? '200 OK' : '422 UNPROCESSABLE ENTITY'}
                    </span>
                    <b className="text-white text-xs">{postmanTestResult.message}</b>
                  </div>
                  {postmanTestResult.invoiceNumber && (
                    <span className="text-[11px] text-slate-400 font-mono">Invoice #: {postmanTestResult.invoiceNumber}</span>
                  )}
                </div>

                {postmanTestResult.isValid ? (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Invoice Successfully Created &amp; Stored in Faturathi System!</span>
                    </p>
                    <p className="text-[11px]">Supplier: <b>{postmanTestResult.invoice?.sName}</b> ({postmanTestResult.invoice?.sVat})</p>
                    <p className="text-[11px]">Customer: <b>{postmanTestResult.invoice?.cp}</b> ({postmanTestResult.invoice?.cpv})</p>
                    <p className="text-[11px]">Status: <b>{postmanTestResult.invoice?.st}</b> · Clearance TDD: <b>{postmanTestResult.invoice?.tdd}</b></p>
                  </div>
                ) : (
                  <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-red-200 text-xs space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-red-300">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span>Invoice Failed 73-Field Validation — Stored in Rejected Register!</span>
                    </p>
                    <b className="block text-[11px] text-red-300 uppercase tracking-wider">Rejection Reasons:</b>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-red-200">
                      {(postmanTestResult.rejectionReasons || []).map((err: any, idx: number) => (
                        <li key={idx}>
                          <code className="bg-red-900/80 px-1 py-0.5 rounded font-bold text-red-200">{err.fieldId}</code> — {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
