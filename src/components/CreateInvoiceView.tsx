import React, { useEffect, useState } from 'react';
import { CompanyBranch, Entity, Invoice } from '../types';
import { apiFetch, formatApiErrors } from '../lib/api';
import { useConfirmation } from './ConfirmationDialog';
import { validateOmanInvoice, OMAN_FIELDS } from '../lib/omanValidator';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Send, 
  FileText, 
  Zap, 
  Plus, 
  Trash2, 
  Building2, 
  Calculator, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  FileCheck,
  Check,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

interface CreateInvoiceViewProps {
  onSubmitInvoice: (inv: any, validateAndSubmit?: boolean) => Promise<Invoice>;
  entities: Entity[];
  selectedEntity: string;
}

const INVALID_COMBOS: [number, number, string][] = [
  [3, 4, "Self-Billed + Third Party not allowed"],
  [3, 7, "Self-Billed + Export not allowed"],
  [5, 6, "Summary + Continuous Supply not allowed"],
  [7, 9, "Export + Import RCM not allowed"],
  [13, 12, "Import of Goods + E-Commerce not allowed"]
];

interface QuickLineItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  vatRate: number; // 0.05 or 0
  vatCat: string; // 'S 5%', 'Z 0%', 'E Exempt'
}

type QuickDocumentTypeValue = '380' | '388' | '381' | '383' | '389' | '261';
type DocumentTypeOption = { value: QuickDocumentTypeValue; icon: string; label: string; detail: string; apiKey: string };
type CustomerRecord = { id: string; company: string; name: string; vatin: string; peppol_endpoint: string; email: string; phone: string; billing_address: string; is_walkin: boolean };

const QUICK_DOCUMENT_TYPES: DocumentTypeOption[] = [
  { value: '380', icon: '📄', label: 'Standard Tax Invoice', detail: 'Code 380', apiKey: 'STANDARD_380' },
  { value: '388', icon: '🛒', label: 'Simplified Tax Invoice', detail: 'B2C profile', apiKey: 'SIMPLIFIED_B2C' },
  { value: '381', icon: '💳', label: 'Credit Note', detail: 'Code 381', apiKey: 'CREDIT_NOTE_381' },
  { value: '383', icon: '✚', label: 'Debit Note', detail: 'Code 383', apiKey: 'DEBIT_NOTE_383' },
  { value: '389', icon: '📑', label: 'Self-Billed Invoice', detail: 'Code 389', apiKey: 'SELF_BILLED_389' },
  { value: '261', icon: '↩️', label: 'Self-Billed Credit Note', detail: 'Code 261', apiKey: 'SELF_BILLED_CN_261' },
];

const TYPE_ICONS: Record<string, string> = {
  STANDARD_380: '📄', SIMPLIFIED_B2C: '🛒', CREDIT_NOTE_381: '💳',
  DEBIT_NOTE_383: '✚', SELF_BILLED_389: '📑', SELF_BILLED_CN_261: '↩️',
};

export const CreateInvoiceView: React.FC<CreateInvoiceViewProps> = ({ onSubmitInvoice, entities, selectedEntity }) => {
  const [confirmAction, confirmationDialog] = useConfirmation();
  // Section toggle: 'quick' (Zoho Books style) vs 'technical' (73-field PINT-OM validator)
  const [activeCreationMode, setActiveCreationMode] = useState<'quick' | 'technical'>('quick');
  const [quickDocumentType, setQuickDocumentType] = useState<QuickDocumentTypeValue>('380');
  const [documentTypeOptions, setDocumentTypeOptions] = useState<DocumentTypeOption[]>(QUICK_DOCUMENT_TYPES);
  const [quickBillingReference, setQuickBillingReference] = useState('');
  const [quickAdjustmentReason, setQuickAdjustmentReason] = useState('01 — Return of goods / price adjustment');
  const [quickApiErrors, setQuickApiErrors] = useState<string[]>([]);
  const [isSavingQuickDocument, setIsSavingQuickDocument] = useState(false);
  const [issuerCompany, setIssuerCompany] = useState(() => selectedEntity !== 'group' ? selectedEntity : entities[0]?.id || '');
  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const isQuickB2C = quickDocumentType === '388';
  const isQuickSelfBilled = ['389', '261'].includes(quickDocumentType);

  useEffect(() => {
    if (selectedEntity !== 'group') setIssuerCompany(selectedEntity);
    else if (!entities.some((entity) => entity.id === issuerCompany)) setIssuerCompany(entities[0]?.id || '');
  }, [selectedEntity, entities, issuerCompany]);

  useEffect(() => {
    if (!issuerCompany) {
      setBranches([]);
      setSelectedBranch('');
      return;
    }
    void apiFetch<CompanyBranch[] | { results?: CompanyBranch[] }>(
      `/api/branches?company=${encodeURIComponent(issuerCompany)}&page_size=100`
    ).then((payload) => {
      const loaded = Array.isArray(payload) ? payload : payload.results || [];
      setBranches(loaded);
      setSelectedBranch((current) => loaded.some((branch) => branch.id === current)
        ? current : loaded[0]?.id || '');
    }).catch((error) => {
      setBranches([]);
      setSelectedBranch('');
      setQuickApiErrors(formatApiErrors(error, 'Operational branches could not be loaded.'));
    });
  }, [issuerCompany]);

  useEffect(() => {
    void apiFetch<Array<{ key: string; code: string; label: string; sublabel: string }>>('/api/document-types')
      .then((catalog) => setDocumentTypeOptions(catalog.map((item) => ({
        value: (item.key === 'SIMPLIFIED_B2C' ? '388' : item.code) as QuickDocumentTypeValue,
        icon: TYPE_ICONS[item.key] || '📄', label: item.label,
        detail: item.key === 'SIMPLIFIED_B2C' ? 'B2C profile' : `Code ${item.code}`, apiKey: item.key,
      }))))
      .catch(() => setDocumentTypeOptions(QUICK_DOCUMENT_TYPES));
  }, []);

  // ==================== QUICK INVOICE STATE ====================
  // Default option is "Custom / Walk-in Customer"
  const [quickBuyerOption, setQuickBuyerOption] = useState('custom');
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [quickBuyerName, setQuickBuyerName] = useState('Custom Walk-in Retail Customer');
  const [quickBuyerVat, setQuickBuyerVat] = useState('OM1100998877');
  const [quickBuyerEas, setQuickBuyerEas] = useState('0248:997770000099');
  const [quickBuyerAddress, setQuickBuyerAddress] = useState('Way 3505, Building 14, Ruwi, Muscat');
  const [quickBuyerContact, setQuickBuyerContact] = useState('+968 9123 4567 | walkin@customer.om');
  const [quickPlaceOfDelivery, setQuickPlaceOfDelivery] = useState('Muscat Main Retail Store Counter');

  // Quick Invoice Prefix & Suffix Setup
  const [quickPrefix, setQuickPrefix] = useState('INV-2026-Q-');
  const [quickSeq, setQuickSeq] = useState('0001');
  const [quickSuffix, setQuickSuffix] = useState('/OM');

  useEffect(() => {
    const company = entities.find((entity) => entity.id === issuerCompany);
    if (!company) return;
    const branch = branches.find((item) => item.id === selectedBranch);
    const correction = ['381', '261'].includes(quickDocumentType);
    setQuickPrefix(branch
      ? (correction ? branch.credit_note_prefix : branch.invoice_prefix)
      : company.invoicePrefix || 'INV-');
    setQuickSuffix(branch
      ? (correction ? branch.credit_note_suffix : branch.invoice_suffix)
      : company.invoiceSuffix || '');
    setQuickSeq(String(branch?.next_invoice_number || company.nextInvoiceNumber || 1).padStart(4, '0'));
  }, [branches, entities, issuerCompany, quickDocumentType, selectedBranch]);

  const getQuickFullInvNumber = () => `${quickPrefix}${quickSeq}${quickSuffix}`;
  const [quickIssueDate, setQuickIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickDueDate, setQuickDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [quickLines, setQuickLines] = useState<QuickLineItem[]>([
    {
      id: 'ql-1',
      name: 'IT Infrastructure Maintenance & SLA',
      qty: 1,
      price: 450.000,
      vatRate: 0.05,
      vatCat: 'S 5%'
    },
    {
      id: 'ql-2',
      name: 'Cloud Server Managed Hosting',
      qty: 2,
      price: 120.000,
      vatRate: 0.05,
      vatCat: 'S 5%'
    }
  ]);

  const handleQuickBuyerSelect = (val: string) => {
    setQuickBuyerOption(val);
    const customer = customers.find((item) => item.id === val);
    if (customer) {
      setQuickBuyerName(customer.name); setQuickBuyerVat(customer.vatin || '');
      setQuickBuyerEas(customer.peppol_endpoint || ''); setQuickBuyerAddress(customer.billing_address || '');
      setQuickBuyerContact([customer.phone, customer.email].filter(Boolean).join(' | '));
      return;
    }
    if (val === 'custom') {
      setQuickBuyerName('Cash Customer');
      setQuickBuyerVat('');
      setQuickBuyerEas('');
      setQuickBuyerAddress('Way 3505, Building 14, Ruwi, Muscat');
      setQuickBuyerContact('+968 9123 4567 | walkin@customer.om');
      setQuickPlaceOfDelivery('Muscat Main Retail Store Counter');
    } else if (val === 'new') {
      setQuickBuyerName(''); setQuickBuyerVat(''); setQuickBuyerEas('');
      setQuickBuyerAddress(''); setQuickBuyerContact(''); setQuickPlaceOfDelivery('');
    }
  };

  const handleAddQuickLine = () => {
    setQuickLines(prev => [
      ...prev,
      {
        id: `ql-${Date.now()}`,
        name: 'Professional Consulting Services',
        qty: 1,
        price: 100.000,
        vatRate: 0.05,
        vatCat: 'S 5%'
      }
    ]);
  };

  const handleRemoveQuickLine = (id: string) => {
    if (quickLines.length === 1) return;
    setQuickLines(prev => prev.filter(l => l.id !== id));
  };

  const updateQuickLine = (id: string, field: keyof QuickLineItem, val: any) => {
    setQuickLines(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: val };
        if (field === 'vatCat') {
          if (val === 'S 5%') updated.vatRate = 0.05;
          else updated.vatRate = 0;
        }
        return updated;
      })
    );
  };

  // Quick invoice totals
  const quickSubtotalNet = quickLines.reduce((acc, l) => acc + (l.qty * l.price), 0);
  const quickVatTotal = quickLines.reduce((acc, l) => acc + (l.qty * l.price * l.vatRate), 0);
  const quickGrandTotal = quickSubtotalNet + quickVatTotal;

  const handleQuickSubmit = async (e: React.FormEvent, isDirectDispatch = false) => {
    e.preventDefault();
    setQuickApiErrors([]);
    if (!issuerCompany) {
      setQuickApiErrors(['supplier company: Select the legal company issuing or receiving this document.']);
      return;
    }
    setIsSavingQuickDocument(true);
    const formattedLines: [string, number, string, string][] = quickLines.map(l => [
      l.name,
      l.qty,
      `${l.price.toFixed(3)} OMR`,
      l.vatCat
    ]);

    const fullInvNum = getQuickFullInvNumber();

    const typeLabels: Record<string, string> = {
      '380': 'Standard Invoice', '388': 'Simplified Invoice', '381': 'Credit Note',
      '383': 'Debit Note', '389': 'Self-Billed Invoice', '261': 'Self-Billed Credit Note'
    };
    const selectedType = documentTypeOptions.find((item) => item.value === quickDocumentType) || QUICK_DOCUMENT_TYPES[0];
    const newInv = {
      n: fullInvNum,
      d: quickIssueDate,
      t: '10:00:00',
      type: typeLabels[quickDocumentType],
      document_type: selectedType.apiKey,
      doc_type: quickDocumentType === '388' ? '380' : quickDocumentType,
      billingReferenceNumber: quickBillingReference || undefined,
      notes: ['381', '383', '261'].includes(quickDocumentType) ? quickAdjustmentReason : '',
      dir: ['389', '261'].includes(quickDocumentType) ? 'Inbound (AP)' : 'Outbound (AR)',
      cp: quickBuyerName || (isQuickB2C ? 'Cash Customer' : ''),
      cpv: isQuickB2C ? '' : quickBuyerVat,
      eas: isQuickB2C ? '' : quickBuyerEas,
      net: quickSubtotalNet,
      vat: quickVatTotal,
      st_internal: 'DRAFT',
      tt: quickDocumentType === '388' ? '11000000000000000000' : ['381', '383', '261'].includes(quickDocumentType) ? '10100000000000000000' : '10000000000000000000',
      cat: quickLines[0]?.vatCat || 'S 5%',
      ent: issuerCompany,
      branch: selectedBranch || undefined,
      lines: formattedLines,
      b2c: quickDocumentType === '388'
    };
    try {
      if (isDirectDispatch && !await confirmAction({ title: 'Submit document to Peppol?', description: `${newInv.type} · ${newInv.n}`, detail: 'After successful transmission, this document cannot be edited or deleted. Verify the customer, tax totals, document profile, and line items.', confirmLabel: 'Submit to Peppol', kind: 'submit' })) return;
      await onSubmitInvoice(newInv, isDirectDispatch);
      setQuickSeq((current) => /^\d+$/.test(current)
        ? String(Number(current) + 1).padStart(current.length, '0')
        : current);
    } catch (error: any) {
      setQuickApiErrors(error?.fieldErrors?.map((item: any) => `${item.field}: ${item.message}`)
        || formatApiErrors(error, 'Document creation failed. Please review the highlighted information.'));
    } finally {
      setIsSavingQuickDocument(false);
    }
  };

  const loadCustomers = () => apiFetch<CustomerRecord[] | { results?: CustomerRecord[] }>(`/api/customers${issuerCompany ? `?company=${encodeURIComponent(issuerCompany)}` : ''}`)
    .then((payload) => setCustomers(Array.isArray(payload) ? payload : payload.results || []))
    .catch(() => setCustomers([]));

  useEffect(() => { if (issuerCompany) void loadCustomers(); }, [issuerCompany]);

  const saveCustomer = async () => {
    setCustomerSaving(true); setQuickApiErrors([]);
    try {
      const parts = quickBuyerContact.split('|').map((value) => value.trim());
      const existing = customers.find((item) => item.id === quickBuyerOption);
      const saved = await apiFetch<CustomerRecord>(existing ? `/api/customers/${existing.id}` : '/api/customers', {
        method: existing ? 'PATCH' : 'POST',
        body: JSON.stringify({ name: quickBuyerName, vatin: quickBuyerVat, peppol_endpoint: quickBuyerEas,
          phone: parts[0] || '', email: parts[1] || '', billing_address: quickBuyerAddress,
          is_walkin: isQuickB2C || quickBuyerOption === 'custom', company: issuerCompany }),
      });
      await loadCustomers(); setQuickBuyerOption(saved.id);
    } catch (error: any) { setQuickApiErrors(formatApiErrors(error, 'Customer could not be saved.')); }
    finally { setCustomerSaving(false); }
  };

  // ==================== TECHNICAL 73-FIELD ENGINE STATE ====================
  const [docType, setDocType] = useState('full');
  
  // PINT-OM Validator Prefix & Suffix Setup
  const [techPrefix, setTechPrefix] = useState('INV-2026-07-');
  const [techSeq, setTechSeq] = useState('0390');
  const [techSuffix, setTechSuffix] = useState('/PINT-OM');

  const getTechFullInvNumber = () => `${techPrefix}${techSeq}${techSuffix}`;
  const [invNum, setInvNum] = useState(`INV-2026-07-0390/PINT-OM`);
  const [issueDate, setIssueDate] = useState('2026-07-29');
  const [issueTime, setIssueTime] = useState('14:32:00');
  const [currency, setCurrency] = useState('OMR');
  const [taxCurrency, setTaxCurrency] = useState('OMR');
  const [exchangeRate, setExchangeRate] = useState('');

  // Seller details
  const [sellerName, setSellerName] = useState('');
  const [sellerVat, setSellerVat] = useState('');
  const [sellerEas, setSellerEas] = useState('');
  const [sellerCty, setSellerCty] = useState('OM');
  const [sellerTel, setSellerTel] = useState('+968 24123456');

  // Buyer details
  const [buyerName, setBuyerName] = useState('');
  const [buyerVat, setBuyerVat] = useState('');
  const [buyerEas, setBuyerEas] = useState('');
  const [buyerCty, setBuyerCty] = useState('OM');

  useEffect(() => {
    const company = entities.find((entity) => entity.id === issuerCompany);
    if (!company) return;
    setSellerName(company.name);
    setSellerVat(company.vatin);
    setSellerEas(company.pid || (company.vatin ? `0248:${company.vatin}` : ''));
  }, [entities, issuerCompany]);

  // Line item
  const [itemName, setItemName] = useState('Networking equipment — switch 24p');
  const [itemQty, setItemQty] = useState(4);
  const [itemUom, setItemUom] = useState('C62');
  const [itemPrice, setItemPrice] = useState(185.5);
  const [itemCat, setItemCat] = useState('S');

  // Conditional fields
  const [cnRef, setCnRef] = useState('INV-2026-07-0390');
  const [cnDate, setCnDate] = useState('2026-07-20');
  const [cnReason, setCnReason] = useState('01 — Return of goods');

  const [importDate, setImportDate] = useState('2026-07-15');
  const [customsDecl, setCustomsDecl] = useState('OM-CUST-2026-88412');
  const [incoterms, setIncoterms] = useState('CIF');

  const [exportCountry, setExportCountry] = useState('AE');
  const [exportDoc, setExportDoc] = useState('EXP-DOC-2026-1142');

  const [periodStart, setPeriodStart] = useState('2026-07-01');
  const [periodEnd, setPeriodEnd] = useState('2026-07-31');

  const [prepAmount, setPrepAmount] = useState('100.000');
  const [prepRef, setPrepRef] = useState('PREP-2026-07-00021');

  const [checkedBits, setCheckedBits] = useState<Record<number, boolean>>({});
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: [string, string][];
    summary?: any;
  } | null>(null);

  // 73-Field Matrix Guide State
  const [show73FieldGuide, setShow73FieldGuide] = useState(false);
  const [guideSearch, setGuideSearch] = useState('');

  const PINT_OM_73_FIELDS = [
    // Group 1: Invoice Header & Process
    { id: 'IBT-001', code: 'BT-1', name: 'Invoice Number', group: '1. Invoice Header', req: 'Mandatory', desc: 'Unique sequential invoice identifier' },
    { id: 'IBT-002', code: 'BT-2', name: 'Invoice Issue Date', group: '1. Invoice Header', req: 'Mandatory', desc: 'Date when invoice was issued (YYYY-MM-DD)' },
    { id: 'IBT-168', code: 'BT-168', name: 'Invoice Issue Time', group: '1. Invoice Header', req: 'Conditional', desc: 'Time of invoice issue for B2C QR codes (HH:MM:SS)' },
    { id: 'IBT-003', code: 'BT-3', name: 'Invoice Type Code', group: '1. Invoice Header', req: 'Mandatory', desc: 'UNCL1001 code (380 Tax Invoice, 381 Credit Note, 383 Debit Note, 388 Simplified, 389 Self-Billed)' },
    { id: 'IBT-005', code: 'BT-5', name: 'Invoice Currency Code', group: '1. Invoice Header', req: 'Mandatory', desc: 'ISO 4217 currency code (e.g. OMR)' },
    { id: 'IBT-006', code: 'BT-6', name: 'VAT Accounting Currency Code', group: '1. Invoice Header', req: 'Conditional', desc: 'Required when invoice currency is not OMR' },
    { id: 'IBT-007', code: 'BT-7', name: 'Tax Point Date', group: '1. Invoice Header', req: 'Conditional', desc: 'Date when tax becomes accountable' },
    { id: 'IBT-008', code: 'BT-9', name: 'Payment Due Date', group: '1. Invoice Header', req: 'Conditional', desc: 'Date when payment is due' },
    { id: 'IBT-010', code: 'BT-11', name: 'Buyer Reference', group: '1. Invoice Header', req: 'Conditional', desc: 'Reference identifier assigned by buyer' },
    { id: 'IBT-011', code: 'BT-12', name: 'Contract Reference', group: '1. Invoice Header', req: 'Optional', desc: 'Contract or framework agreement ID' },
    { id: 'IBT-012', code: 'BT-13', name: 'Purchase Order Reference', group: '1. Invoice Header', req: 'Optional', desc: 'Purchase order ID' },
    { id: 'IBT-018', code: 'BT-25', name: 'Preceding Invoice Reference', group: '1. Invoice Header', req: 'Conditional', desc: 'Original invoice # being adjusted (Mandatory for Credit Notes)' },

    // Group 2: Oman Specific Extensions
    { id: 'BTOM-001', code: 'BTOM-1', name: 'Oman Transaction Bitmap (20-bit)', group: '2. Oman Extensions', req: 'Mandatory', desc: '20-bit binary flag configuring tax rules & transaction context' },
    { id: 'BTOM-002', code: 'BTOM-2', name: 'Invoice UUID', group: '2. Oman Extensions', req: 'Mandatory', desc: 'RFC 4122 v5 UUID generated from canonical XML hash' },
    { id: 'BTOM-003', code: 'BTOM-3', name: 'Cryptographic Stamp Signature', group: '2. Oman Extensions', req: 'Conditional', desc: 'Digital PKI ECDSA signature generated by Faturathi OTA gateway' },
    { id: 'BTOM-004', code: 'BTOM-4', name: 'Previous Invoice Hash (PIH)', group: '2. Oman Extensions', req: 'Conditional', desc: 'SHA-256 hash of previous invoice XML for tamper-evident chain' },
    { id: 'BTOM-005', code: 'BTOM-5', name: 'OTA Clearance Response Token', group: '2. Oman Extensions', req: 'Conditional', desc: 'MLS/TDD clearance token returned by Oman Tax Authority C5 server' },

    // Group 3: Seller Party Details
    { id: 'IBT-027', code: 'BT-27', name: 'Seller Legal Name', group: '3. Seller Party', req: 'Mandatory', desc: 'Registered legal name of the seller' },
    { id: 'IBT-028', code: 'BT-28', name: 'Seller Trading Name', group: '3. Seller Party', req: 'Optional', desc: 'Commercial trading name of seller' },
    { id: 'IBT-029', code: 'BT-29', name: 'Seller Identifier (CR #)', group: '3. Seller Party', req: 'Mandatory', desc: 'Oman Commercial Registration number' },
    { id: 'IBT-030', code: 'BT-30', name: 'Seller Legal Registration Scheme', group: '3. Seller Party', req: 'Mandatory', desc: 'Scheme ID (e.g. 0248 for Oman CR)' },
    { id: 'IBT-031', code: 'BT-31', name: 'Seller VAT Identifier', group: '3. Seller Party', req: 'Mandatory', desc: 'Oman Tax Authority VAT registration # (e.g. OM1100123456)' },
    { id: 'IBT-032', code: 'BT-32', name: 'Seller Tax Scheme', group: '3. Seller Party', req: 'Mandatory', desc: 'Tax scheme code (VAT)' },
    { id: 'IBT-035', code: 'BT-35', name: 'Seller Address Line 1', group: '3. Seller Party', req: 'Mandatory', desc: 'Street address & building number' },
    { id: 'IBT-037', code: 'BT-37', name: 'Seller City', group: '3. Seller Party', req: 'Mandatory', desc: 'City name (e.g. Muscat, Salalah)' },
    { id: 'IBT-038', code: 'BT-38', name: 'Seller Postal Zone', group: '3. Seller Party', req: 'Optional', desc: 'Postal code' },
    { id: 'IBT-040', code: 'BT-40', name: 'Seller Country Code', group: '3. Seller Party', req: 'Mandatory', desc: 'ISO country code (OM)' },
    { id: 'IBT-034', code: 'BT-34', name: 'Seller Peppol Endpoint ID (EAS)', group: '3. Seller Party', req: 'Mandatory', desc: 'Peppol Electronic Address (e.g. 0248:OM1100123456)' },

    // Group 4: Buyer Party Details
    { id: 'IBT-044', code: 'BT-44', name: 'Buyer Legal Name', group: '4. Buyer Party', req: 'Mandatory', desc: 'Registered legal name of buyer (or General Customer for B2C)' },
    { id: 'IBT-045', code: 'BT-45', name: 'Buyer Trading Name', group: '4. Buyer Party', req: 'Optional', desc: 'Commercial trading name of buyer' },
    { id: 'IBT-046', code: 'BT-46', name: 'Buyer Identifier (CR #)', group: '4. Buyer Party', req: 'Conditional', desc: 'Buyer Commercial Registration number' },
    { id: 'IBT-047', code: 'BT-47', name: 'Buyer Legal Registration Scheme', group: '4. Buyer Party', req: 'Conditional', desc: 'Scheme ID (0248 for Oman CR)' },
    { id: 'IBT-048', code: 'BT-48', name: 'Buyer VAT Identifier', group: '4. Buyer Party', req: 'Conditional', desc: 'Buyer VAT registration number (Mandatory for B2B)' },
    { id: 'IBT-049', code: 'BT-49', name: 'Buyer Tax Scheme', group: '4. Buyer Party', req: 'Conditional', desc: 'Tax scheme code (VAT)' },
    { id: 'IBT-050', code: 'BT-50', name: 'Buyer Address Line 1', group: '4. Buyer Party', req: 'Conditional', desc: 'Street address of buyer' },
    { id: 'IBT-052', code: 'BT-52', name: 'Buyer City', group: '4. Buyer Party', req: 'Conditional', desc: 'City name of buyer' },
    { id: 'IBT-053', code: 'BT-53', name: 'Buyer Postal Zone', group: '4. Buyer Party', req: 'Optional', desc: 'Buyer postal code' },
    { id: 'IBT-055', code: 'BT-55', name: 'Buyer Country Code', group: '4. Buyer Party', req: 'Mandatory', desc: 'ISO country code of buyer (e.g. OM)' },
    { id: 'IBT-049-EAS', code: 'BT-49-EAS', name: 'Buyer Peppol Endpoint ID (EAS)', group: '4. Buyer Party', req: 'Conditional', desc: 'Peppol Electronic Address of buyer' },

    // Group 5: Delivery & Logistics
    { id: 'IBT-071', code: 'BT-71', name: 'Delivery Location Name', group: '5. Delivery & Period', req: 'Optional', desc: 'Name of delivery site or warehouse' },
    { id: 'IBT-072', code: 'BT-72', name: 'Actual Delivery Date', group: '5. Delivery & Period', req: 'Conditional', desc: 'Date when goods/services were delivered' },
    { id: 'IBT-073', code: 'BT-73', name: 'Invoicing Period Start Date', group: '5. Delivery & Period', req: 'Conditional', desc: 'Start date of continuous supply period' },
    { id: 'IBT-074', code: 'BT-74', name: 'Invoicing Period End Date', group: '5. Delivery & Period', req: 'Conditional', desc: 'End date of continuous supply period' },
    { id: 'IBT-077', code: 'BT-77', name: 'Delivery Country Code', group: '5. Delivery & Period', req: 'Optional', desc: 'ISO country code of destination' },

    // Group 6: Payment Means & Financial
    { id: 'IBT-081', code: 'BT-81', name: 'Payment Means Code', group: '6. Payment Details', req: 'Mandatory', desc: 'UNCL4461 code (10 Cash, 30 Credit Transfer, 48 Card, 42 Bank Draft)' },
    { id: 'IBT-082', code: 'BT-82', name: 'Payment Remittance Identifier', group: '6. Payment Details', req: 'Optional', desc: 'Remittance reference for bank reconciliation' },
    { id: 'IBT-084', code: 'BT-84', name: 'Payment Account IBAN', group: '6. Payment Details', req: 'Conditional', desc: 'Seller IBAN bank account identifier (OM...)' },
    { id: 'IBT-085', code: 'BT-85', name: 'Payment Account Name', group: '6. Payment Details', req: 'Optional', desc: 'Account holder legal name' },
    { id: 'IBT-086', code: 'BT-86', name: 'Payment Financial Service Provider BIC/SWIFT', group: '6. Payment Details', req: 'Optional', desc: 'Bank BIC / SWIFT code' },
    { id: 'IBT-089', code: 'BT-89', name: 'Payment Terms Description', group: '6. Payment Details', req: 'Optional', desc: 'Textual payment terms (e.g. Net 30 days)' },

    // Group 7: Document Totals & VAT Breakdown
    { id: 'IBT-106', code: 'BT-106', name: 'Sum of Line Net Amount', group: '7. Document Totals', req: 'Mandatory', desc: 'Total net amount of all invoice lines' },
    { id: 'IBT-107', code: 'BT-107', name: 'Sum of Document Allowances', group: '7. Document Totals', req: 'Mandatory', desc: 'Total document-level discounts' },
    { id: 'IBT-108', code: 'BT-108', name: 'Sum of Document Charges', group: '7. Document Totals', req: 'Mandatory', desc: 'Total document-level surcharges' },
    { id: 'IBT-109', code: 'BT-109', name: 'Invoice Total Net Amount', group: '7. Document Totals', req: 'Mandatory', desc: 'Sum of line net - allowances + charges' },
    { id: 'IBT-110', code: 'BT-110', name: 'Invoice Total VAT Amount', group: '7. Document Totals', req: 'Mandatory', desc: 'Total calculated VAT amount (OMR)' },
    { id: 'IBT-111', code: 'BT-111', name: 'VAT Amount in Accounting Currency', group: '7. Document Totals', req: 'Conditional', desc: 'VAT total converted to OMR if invoice in foreign currency' },
    { id: 'IBT-112', code: 'BT-112', name: 'Invoice Total Amount With VAT', group: '7. Document Totals', req: 'Mandatory', desc: 'Total payable including VAT' },
    { id: 'IBT-113', code: 'BT-113', name: 'Paid Prepayment Amount', group: '7. Document Totals', req: 'Optional', desc: 'Down payment / deposit already paid' },
    { id: 'IBT-115', code: 'BT-115', name: 'Amount Due for Payment', group: '7. Document Totals', req: 'Mandatory', desc: 'Net balance due (Total with VAT - Prepaid)' },
    { id: 'IBT-116', code: 'BT-116', name: 'Taxable Amount per VAT Category', group: '7. Document Totals', req: 'Mandatory', desc: 'Base taxable amount per VAT category' },
    { id: 'IBT-117', code: 'BT-117', name: 'Tax Amount per VAT Category', group: '7. Document Totals', req: 'Mandatory', desc: 'Calculated VAT amount for this category' },
    { id: 'IBT-118', code: 'BT-118', name: 'VAT Category Code', group: '7. Document Totals', req: 'Mandatory', desc: 'S Standard (5%), Z Zero (0%), E Exempt, O Out of scope' },
    { id: 'IBT-119', code: 'BT-119', name: 'VAT Rate Percentage', group: '7. Document Totals', req: 'Mandatory', desc: 'Percentage rate (5 or 0)' },

    // Group 8: Line Item Details
    { id: 'IBT-126', code: 'BT-126', name: 'Line Identifier', group: '8. Line Items', req: 'Mandatory', desc: 'Sequential line item number (1, 2, 3...)' },
    { id: 'IBT-127', code: 'BT-127', name: 'Line Note / Remarks', group: '8. Line Items', req: 'Optional', desc: 'Specific description or comments for line item' },
    { id: 'IBT-129', code: 'BT-129', name: 'Invoiced Quantity', group: '8. Line Items', req: 'Mandatory', desc: 'Number of units billed' },
    { id: 'IBT-130', code: 'BT-130', name: 'Invoiced Quantity Unit Code', group: '8. Line Items', req: 'Mandatory', desc: 'UN/ECE Rec 20 unit code (e.g. C62, EA, KGM, HUR)' },
    { id: 'IBT-131', code: 'BT-131', name: 'Line Net Amount', group: '8. Line Items', req: 'Mandatory', desc: 'Line quantity multiplied by net unit price minus discounts' },
    { id: 'IBT-146', code: 'BT-146', name: 'Item Net Price', group: '8. Line Items', req: 'Mandatory', desc: 'Unit price excluding VAT' },
    { id: 'IBT-151', code: 'BT-151', name: 'Item VAT Category Code', group: '8. Line Items', req: 'Mandatory', desc: 'Line VAT classification (S, Z, E, O)' },
    { id: 'IBT-152', code: 'BT-152', name: 'Item VAT Rate', group: '8. Line Items', req: 'Mandatory', desc: 'Applicable VAT percentage rate' },
    { id: 'IBT-153', code: 'BT-153', name: 'Item Name', group: '8. Line Items', req: 'Mandatory', desc: 'Product or service description' },
    { id: 'IBT-154', code: 'BT-154', name: 'Item Description', group: '8. Line Items', req: 'Optional', desc: 'Detailed specifications or technical info' }
  ];

  const getBaseBit = () => {
    if (docType === 'simplified') return 2;
    if (docType === 'sbi' || docType === 'sbcn' || docType === 'sbdn') return 3;
    return 1;
  };

  const getInvoiceTypeCode = () => {
    switch (docType) {
      case 'cn':
      case 'sbcn':
        return '381';
      case 'dn':
      case 'sbdn':
        return '383';
      case 'simplified':
        return '388';
      case 'sbi':
        return '389';
      default:
        return '388';
    }
  };

  const computeBitmap = () => {
    const bits = Array(20).fill('0');
    const b = getBaseBit();
    bits[b - 1] = '1';
    if (b === 3) bits[0] = '1';
    Object.entries(checkedBits).forEach(([bit, isChecked]) => {
      if (isChecked) bits[+bit - 1] = '1';
    });
    return bits.join('');
  };

  const bitmapString = computeBitmap();

  const checkComboWarnings = () => {
    const on = (bit: number) => bitmapString[bit - 1] === '1';
    for (const [a, c, msg] of INVALID_COMBOS) {
      if (on(a) && on(c)) return msg;
    }
    return '';
  };

  const comboWarning = checkComboWarnings();

  const toggleBit = (bit: number) => {
    setCheckedBits((prev) => ({ ...prev, [bit]: !prev[bit] }));
  };

  const handleDocTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const t = e.target.value;
    setDocType(t);
    if (t === 'simplified') {
      setBuyerName('General customer');
      setBuyerVat('');
      setBuyerEas('');
      setBuyerCty('OM');
    } else if (t === 'sbi' || t === 'sbcn') {
      const company = entities.find((entity) => entity.id === issuerCompany);
      setBuyerName(company?.name || '');
      setBuyerEas(company?.pid || '');
      setBuyerVat(company?.vatin || '');
    }
  };

  const handleLoadB2C = () => {
    setDocType('simplified');
    setBuyerName('General customer');
    setBuyerVat('');
    setBuyerEas('');
    setBuyerCty('OM');
    setItemName('Retail basket — POS MCT-01');
    setItemQty(1);
    setItemPrice(38.095);
    setValidationResult(null);
  };

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    const lineNet = itemQty * itemPrice;
    const vatRate = itemCat === 'S' ? 0.05 : 0;
    const vatAmt = lineNet * vatRate;

    const rawPayload = {
      BTOM_001_OmanTransactionType: bitmapString,
      BTOM_002_InvoiceUUID: `b41c72aa-${Math.floor(1000 + Math.random() * 9000)}-5f2b-8d34-77c1e09a55d0`,
      IBT_001_InvoiceNumber: invNum,
      IBT_002_InvoiceIssueDate: issueDate,
      IBT_168_InvoiceIssueTime: issueTime,
      IBT_003_InvoiceTypeCode: getInvoiceTypeCode(),
      IBT_021_PrecedingInvoiceReference: cnRef || undefined,
      IBT_005_InvoiceCurrencyCode: 'OMR',
      IBT_006_VATAccountingCurrency: 'OMR',
      SellerDetails: {
        IBT_027_SellerName: sellerName,
        IBT_034_SellerIdentifier: sellerVat,
        IBT_031_SellerVATIdentifier: sellerVat,
        IBT_040_SellerCountryCode: sellerCty,
        IBT_034_SellerElectronicAddress: `0248:${sellerVat}`
      },
      BuyerDetails: {
        IBT_044_BuyerName: buyerName,
        IBT_049_BuyerIdentifier: buyerVat || 'OM1100654321',
        IBT_048_BuyerVATIdentifier: buyerVat,
        IBT_055_BuyerCountryCode: buyerCty,
        IBT_049_BuyerElectronicAddress: buyerEas
      },
      Totals: {
        IBT_106_SumLineNetAmount: lineNet,
        IBT_109_InvoiceTotalNetAmount: lineNet,
        IBT_110_InvoiceTotalVATAmount: vatAmt,
        IBT_112_InvoiceTotalAmountWithVAT: lineNet + vatAmt,
        IBT_115_AmountDuePayment: lineNet + vatAmt
      },
      VATBreakdown: [
        {
          IBT_116_TaxableAmount: lineNet,
          IBT_117_TaxAmount: vatAmt,
          IBT_118_CategoryCode: itemCat,
          IBT_119_Rate: itemCat === 'S' ? 5 : 0
        }
      ],
      Lines: [
        {
          IBT_126_LineIdentifier: "1",
          IBT_129_InvoicedQuantity: itemQty,
          IBT_131_LineNetAmount: lineNet,
          IBT_153_ItemName: itemName,
          IBT_151_ItemVATCategoryCode: itemCat,
          IBT_152_ItemVATRate: itemCat === 'S' ? 5 : 0,
          IBT_146_ItemNetPrice: itemPrice
        }
      ]
    };

    const res = validateOmanInvoice(rawPayload);

    if (!res.isValid) {
      const errTuples: [string, string][] = res.errors.map(e => [e.fieldId, e.message]);
      setValidationResult({ isValid: false, errors: errTuples });
    } else {
      setValidationResult({
        isValid: true,
        errors: [],
        summary: {
          customizationId: 'urn:peppol:pint:billing-1@om-1',
          net: lineNet,
          vat: vatAmt,
          total: lineNet + vatAmt,
          uuid: res.uuidV5Generated
        }
      });
    }
  };

  const handleFinalSubmit = async () => {
    if (!validationResult || !validationResult.isValid) return;

    const lineNet = itemQty * itemPrice;
    const vatRate = itemCat === 'S' ? 0.05 : 0;
    const vatAmt = lineNet * vatRate;

    const technicalTypes: Record<string, { label: string; code: string }> = {
      full: { label: 'Standard Invoice', code: '380' }, simplified: { label: 'Simplified Invoice', code: '380' },
      cn: { label: 'Credit Note', code: '381' }, dn: { label: 'Debit Note', code: '383' },
      sbi: { label: 'Self-Billed Invoice', code: '389' }, sbcn: { label: 'Self-Billed Credit Note', code: '261' },
      sbdn: { label: 'Self-Billed Debit Note', code: '383' }
    };
    const selectedType = technicalTypes[docType] || technicalTypes.full;
    const newInv = {
      n: invNum,
      d: issueDate,
      t: issueTime,
      type: selectedType.label,
      doc_type: selectedType.code,
      billingReferenceNumber: ['cn', 'dn', 'sbcn', 'sbdn'].includes(docType) ? cnRef : undefined,
      dir: 'Outbound (AR)',
      cp: buyerName,
      cpv: buyerVat,
      eas: buyerEas,
      net: lineNet,
      vat: vatAmt,
      st_internal: 'DRAFT',
      tt: bitmapString,
      cat: itemCat === 'S' ? 'S 5%' : 'Z 0%',
      ent: issuerCompany,
      branch: selectedBranch || undefined,
      lines: [[itemName, itemQty, `${itemPrice.toFixed(3)} OMR`, itemCat === 'S' ? 'S 5%' : 'Z 0%']] as [string, number, string, string][],
      b2c: docType === 'simplified'
    };

    try {
      if (!await confirmAction({ title: 'Submit document to Peppol?', description: `${newInv.type} · ${newInv.n}`, detail: 'After successful transmission, this document cannot be edited or deleted. Corrections require the formal credit/debit note workflow.', confirmLabel: 'Submit to Peppol', kind: 'submit' })) return;
      await onSubmitInvoice(newInv, true);
    } catch (error: any) {
      const errors: [string, string][] = error?.fieldErrors?.map((item: any) => [item.field || 'API', item.message])
        || [['API', error?.message || 'Document submission failed.']];
      setValidationResult({ isValid: false, errors });
    }
  };

  return (
    <div className="space-y-6">
      {confirmationDialog}
      {/* Creation Mode Segment Toggle Bar */}
      <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveCreationMode('quick')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeCreationMode === 'quick'
                ? 'bg-[#0d4f8b] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Zap className="h-4 w-4 text-emerald-400" />
            <span>Create Billing Document</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Billing workspace for accounting staff
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: QUICK INVOICE (Zoho Books Style Billing UI) */}
      {/* ========================================================================= */}
      {activeCreationMode === 'quick' && (
        <form onSubmit={handleQuickSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-[#0d4f8b] rounded-2xl border border-blue-200">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Quick Invoice Creator</h2>
                <p className="text-xs text-slate-500">Simple billing interface for accounting staff. Dispatches directly over Peppol AS4.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
              Auto 5% Oman VAT
            </span>
          </div>

          <section className="rounded-3xl border-2 border-slate-300 bg-slate-100/80 p-4 text-xs shadow-inner sm:p-5">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="h-5 w-5 text-[#0d4f8b]" />
                <h3 className="text-base font-black text-slate-950">Select Document Type:</h3>
                <span className="rounded-lg bg-[#0d4f8b] px-3 py-1 font-mono text-[11px] font-bold text-white">
                  {quickDocumentType === '388' ? 'PINT-OM B2C Profile' : `UNCL1001 Code: ${quickDocumentType}`}
                </span>
              </div>
              <span className="font-medium text-slate-500">PINT-OM e-Invoicing Specification Compliant</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6" role="radiogroup" aria-label="Document type">
              {documentTypeOptions.map((option) => {
                const selected = option.value === quickDocumentType;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => { setQuickDocumentType(option.value); setQuickApiErrors([]); }}
                    className={`relative min-h-28 rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      selected
                        ? 'border-blue-300 bg-[#155b96] text-white shadow-lg ring-2 ring-blue-300'
                        : 'border-slate-200 bg-white text-slate-950 shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <span className="block text-xl" aria-hidden="true">{option.icon}</span>
                    {selected ? <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-blue-100" aria-hidden="true" /> : null}
                    <span className="mt-3 block text-sm font-black leading-tight">{option.label}</span>
                    <span className={`mt-1 block font-mono text-[11px] ${selected ? 'text-blue-100' : 'text-slate-500'}`}>{option.detail}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="quick-document-type" className="shrink-0 font-bold text-slate-700">Document Type Selector:</label>
              <select
                id="quick-document-type"
                value={quickDocumentType}
                onChange={(e) => { setQuickDocumentType(e.target.value as typeof quickDocumentType); setQuickApiErrors([]); }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {documentTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label} — {option.detail}</option>)}
              </select>
            </div>
            {['381', '383', '261'].includes(quickDocumentType) ? (
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-black text-amber-950">Preceding Invoice Reference (BT-25) *</label>
                  <input
                    required
                    value={quickBillingReference}
                    onChange={(e) => setQuickBillingReference(e.target.value)}
                    placeholder="INV-2026-Q-9900/OM"
                    className="w-full rounded-xl border border-amber-400 bg-white px-3 py-2.5 font-mono text-sm font-bold outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  />
                  <span className="mt-1 block text-[11px] font-medium text-amber-800">Mandatory for Credit/Debit Notes under Oman Tax Law</span>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-black text-amber-950">Adjustment Reason / Explanation *</label>
                  <input
                    required
                    value={quickAdjustmentReason}
                    onChange={(e) => setQuickAdjustmentReason(e.target.value)}
                    placeholder="Explain why this corrective document is being issued"
                    className="w-full rounded-xl border border-amber-400 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            ) : null}
          </section>

          {quickApiErrors.length ? (
            <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-xs text-red-900">
              <b className="block text-sm">Document could not be processed</b>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {quickApiErrors.map((message) => <li key={message}>{message}</li>)}
              </ul>
            </div>
          ) : null}

          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs">
            <label className="mb-1.5 block font-bold text-[#0d4f8b]">
              {isQuickSelfBilled ? 'Buyer / Receiving Company *' : 'Supplier / Issuing Company *'}
            </label>
            <select value={issuerCompany} onChange={(event) => setIssuerCompany(event.target.value)} required
              className="w-full rounded-xl border border-blue-200 bg-white p-2.5 font-bold text-slate-800 outline-none focus:border-blue-500">
              <option value="">Select company</option>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name} · {entity.vatin}</option>)}
            </select>
            <p className="mt-1.5 text-[10px] text-slate-600">
              {isQuickSelfBilled ? 'This company is the buyer. The counterparty below is the supplier.' : 'Supplier name and VAT details are loaded from this company record.'}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs">
            <label className="mb-1.5 block font-bold text-emerald-900">
              Operational Branch / Outlet {branches.length ? '*' : '(company default)'}
            </label>
            <select
              value={selectedBranch}
              onChange={(event) => setSelectedBranch(event.target.value)}
              required={branches.length > 0}
              disabled={!issuerCompany || branches.length === 0}
              className="w-full rounded-xl border border-emerald-200 bg-white p-2.5 font-bold text-slate-800 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">{branches.length ? 'Select branch' : 'No branches configured — use company numbering'}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.code} — {branch.name} · {branch.invoice_prefix}####{branch.invoice_suffix}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[10px] text-slate-600">
              Branches share the selected company VATIN and Peppol participant. Only the branch code and numbering series differ.
            </p>
          </div>

          {/* Customer & Invoice Header Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Buyer Select & Details */}
            <div className="md:col-span-2 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#0d4f8b]" />
                  <span>{isQuickSelfBilled ? 'Supplier / Seller Selection:' : 'Customer / Buyer Selection:'}</span>
                </label>
                <span className="text-[10px] bg-blue-100 text-[#0d4f8b] font-bold px-2 py-0.5 rounded-md">
                  {isQuickB2C ? 'Cash customer — VAT and Peppol ID not required' : 'Select a saved party or add a new customer'}
                </span>
              </div>

              <select
                value={quickBuyerOption}
                onChange={(e) => handleQuickBuyerSelect(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 font-bold"
              >
                <option value="custom">👤 Cash / Walk-in Customer</option>
                <option value="new">＋ Add New Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name} {customer.vatin ? `(${customer.vatin})` : ''}</option>
                ))}
              </select>

              {/* Manual Customer Details (Editable when Custom/Walk-in or custom overridden) */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                <b className="text-[11px] font-bold text-slate-700 block border-b border-slate-100 pb-1">
                  {quickBuyerOption === 'custom' ? 'Cash / Walk-in Customer Details:' : quickBuyerOption === 'new' ? 'New Customer Details:' : 'Customer Account Profile Details:'}
                </b>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{isQuickSelfBilled ? 'Supplier Name' : 'Customer Name'} *</label>
                    <input
                      type="text"
                      value={quickBuyerName}
                      onChange={(e) => setQuickBuyerName(e.target.value)}
                      placeholder="e.g. Salim Al-Harthy (Walk-in)"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900"
                    />
                  </div>
                  {!isQuickB2C && <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">OM VAT ID (Tax Registration)</label>
                    <input
                      type="text"
                      value={quickBuyerVat}
                      onChange={(e) => setQuickBuyerVat(e.target.value)}
                      placeholder="OM1100998877 (Optional if consumer)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Contact Phone &amp; Email</label>
                    <input
                      type="text"
                      value={quickBuyerContact}
                      onChange={(e) => setQuickBuyerContact(e.target.value)}
                      placeholder="+968 9123 4567 | customer@walkin.om"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  {!isQuickB2C && <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Electronic Address (EAS / Peppol ID)</label>
                    <input
                      type="text"
                      value={quickBuyerEas}
                      onChange={(e) => setQuickBuyerEas(e.target.value)}
                      placeholder="0248:997770000099"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                    />
                  </div>}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Customer Billing Address</label>
                    <input
                      type="text"
                      value={quickBuyerAddress}
                      onChange={(e) => setQuickBuyerAddress(e.target.value)}
                      placeholder="Way 3505, Building 14, Ruwi, Muscat, Oman"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Place of Delivery / Destination</label>
                    <input
                      type="text"
                      value={quickPlaceOfDelivery}
                      onChange={(e) => setQuickPlaceOfDelivery(e.target.value)}
                      placeholder="Muscat Retail Main Counter / Salalah Branch Free Zone"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end border-t border-slate-100 pt-2">
                    <button type="button" onClick={saveCustomer} disabled={customerSaving}
                      className="rounded-lg bg-[#0d4f8b] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
                      {customerSaving ? 'Saving customer...' : customers.some((item) => item.id === quickBuyerOption) ? 'Update Customer' : 'Save New Customer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Prefix, Sequence, Suffix & Dates Setup */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 pb-2">
                <label className="block font-bold text-slate-800 mb-1">Invoice Numbering Series Setup:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Prefix</label>
                    <input
                      type="text"
                      value={quickPrefix}
                      onChange={(e) => setQuickPrefix(e.target.value)}
                      placeholder="INV-2026-Q-"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-[#0d4f8b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Number</label>
                    <input
                      type="text"
                      value={quickSeq}
                      onChange={(e) => setQuickSeq(e.target.value)}
                      placeholder="9941"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Suffix</label>
                    <input
                      type="text"
                      value={quickSuffix}
                      onChange={(e) => setQuickSuffix(e.target.value)}
                      placeholder="/OM"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-[#0d4f8b]"
                    />
                  </div>
                </div>
                <div className="mt-2 text-[11px] bg-blue-50/80 p-2 rounded-xl border border-blue-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Generated Invoice #:</span>
                  <b className="font-mono font-bold text-[#0d4f8b]">{getQuickFullInvNumber()}</b>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Date:</label>
                  <input
                    type="date"
                    value={quickIssueDate}
                    onChange={(e) => setQuickIssueDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date:</label>
                  <input
                    type="date"
                    value={quickDueDate}
                    onChange={(e) => setQuickDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table (Zoho Style) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <b className="text-xs font-bold text-slate-800 uppercase tracking-wider">Invoice Itemized Lines:</b>
              <button
                type="button"
                onClick={handleAddQuickLine}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0d4f8b] font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1 border border-blue-200"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Item / Service Description</th>
                    <th className="p-3 w-20">Qty</th>
                    <th className="p-3 w-32">Unit Price (OMR)</th>
                    <th className="p-3 w-32">VAT Rate</th>
                    <th className="p-3 w-32 text-right">Line Total</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {quickLines.map((line) => {
                    const lineTotal = line.qty * line.price * (1 + line.vatRate);
                    return (
                      <tr key={line.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <input
                            type="text"
                            value={line.name}
                            onChange={(e) => updateQuickLine(line.id, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                            placeholder="Enter item or service name"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            value={line.qty}
                            onChange={(e) => updateQuickLine(line.id, 'qty', parseFloat(e.target.value) || 1)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-center font-bold"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.001"
                            value={line.price}
                            onChange={(e) => updateQuickLine(line.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={line.vatCat}
                            onChange={(e) => updateQuickLine(line.id, 'vatCat', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                          >
                            <option value="S 5%">Standard 5% VAT</option>
                            <option value="Z 0%">Zero 0% VAT</option>
                            <option value="E Exempt">Exempt</option>
                          </select>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {lineTotal.toFixed(3)} OMR
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickLine(line.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Invoice Totals Box */}
          <div className="flex flex-col sm:flex-row items-end justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 space-y-1">
              <p className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="h-4 w-4" /> PINT OM XML payload auto-generated in background
              </p>
              <p>Includes standard AS4 Peppol signature &amp; 20-bit bitmap verification.</p>
            </div>

            <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <b>{quickSubtotalNet.toFixed(3)} OMR</b>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Oman 5% VAT Total:</span>
                <b className="text-emerald-700">{quickVatTotal.toFixed(3)} OMR</b>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm border-t border-slate-200 pt-2">
                <span>Grand Total Incl. VAT:</span>
                <b className="text-[#0d4f8b]">{quickGrandTotal.toFixed(3)} OMR</b>
              </div>
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={(e) => handleQuickSubmit(e, false)}
              disabled={isSavingQuickDocument}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <FileCheck className="h-4 w-4" />
              <span>{isSavingQuickDocument ? 'Saving…' : 'Save as Draft'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleQuickSubmit(e, true)}
              disabled={isSavingQuickDocument}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-[#0d4f8b] hover:from-emerald-500 hover:to-[#0b3d6b] text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{isSavingQuickDocument ? 'Processing…' : 'Validate & Submit to E-Invoice Flow'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: TECHNICAL 73-FIELD PINT OM ENGINE & VALIDATOR */}
      {/* ========================================================================= */}
      {activeCreationMode === 'technical' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          {/* Top Banner inside Tech Engine */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>PINT-OM Technical 73-Field Engine</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                  Schematron v1.0.1
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Oman Tax Authority (OTA) 20-bit transaction bitmap builder &amp; Peppol BIS PINT OM validator.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShow73FieldGuide(!show73FieldGuide)}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <HelpCircle className="h-4 w-4 text-purple-700" />
              <span>{show73FieldGuide ? 'Hide 73-Field Guide' : 'How PINT-OM 73-Fields Work & Matrix'}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${show73FieldGuide ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Interactive 73-Field Specification Guide & Matrix Drawer */}
          {show73FieldGuide && (
            <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-200 space-y-4 animate-fadeIn">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-700" />
                  <span>Why don't all 73 field input boxes appear on screen at the same time?</span>
                </h3>
                <div className="text-xs text-purple-900 space-y-2 leading-relaxed">
                  <p>
                    In the <b>Oman Tax Authority (OTA) PINT-OM Framework</b> (derived from Peppol BIS Billing 3.0), the specification defines <b>73 standard business terms &amp; rules</b> (from <code>BT-1</code> to <code>BT-165</code> plus Oman extensions <code>BTOM-001</code> to <code>BTOM-005</code>).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1">
                      <b className="text-purple-900 block font-bold">1. Mandatory Core (~18 Fields)</b>
                      <span className="text-[11px] text-slate-600 block">
                        Always required for standard B2B tax invoices: Invoice # (IBT-001), Issue Date (IBT-002), Seller VAT (IBT-031), Buyer VAT (IBT-048), Totals &amp; Line Items.
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1">
                      <b className="text-purple-900 block font-bold">2. Context-Conditional (~55 Fields)</b>
                      <span className="text-[11px] text-slate-600 block">
                        Only activate when specific transaction options are selected (e.g., Credit Note reason <code>IBT-018</code>, Import RCM Customs Ref <code>IBT-017</code>, Continuous Supply Period <code>IBT-073</code>).
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1">
                      <b className="text-purple-900 block font-bold">3. Automated 20-Bit Schematron</b>
                      <span className="text-[11px] text-slate-600 block">
                        The 20-bit transaction bitmap automatically sets all 73 values in canonical XML behind the scenes before dispatching to OTA / Peppol AS4.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 73-Field Matrix Searchable Reference Table */}
              <div className="bg-white rounded-xl border border-purple-200 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <b className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Complete PINT-OM 73-Field Compliance Specification Matrix
                  </b>
                  <input
                    type="text"
                    value={guideSearch}
                    onChange={(e) => setGuideSearch(e.target.value)}
                    placeholder="Search by BT code, field name, or group..."
                    className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="p-2 border-b">Field ID</th>
                        <th className="p-2 border-b">Peppol BT</th>
                        <th className="p-2 border-b">Field Name</th>
                        <th className="p-2 border-b">Business Group</th>
                        <th className="p-2 border-b">Rule Status</th>
                        <th className="p-2 border-b">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {PINT_OM_73_FIELDS.filter(f => 
                        !guideSearch || 
                        f.id.toLowerCase().includes(guideSearch.toLowerCase()) ||
                        f.code.toLowerCase().includes(guideSearch.toLowerCase()) ||
                        f.name.toLowerCase().includes(guideSearch.toLowerCase()) ||
                        f.group.toLowerCase().includes(guideSearch.toLowerCase())
                      ).map((field, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/40">
                          <td className="p-2 font-mono font-bold text-purple-900 whitespace-nowrap">{field.id}</td>
                          <td className="p-2 font-mono text-slate-600 whitespace-nowrap">{field.code}</td>
                          <td className="p-2 font-semibold text-slate-900 whitespace-nowrap">{field.name}</td>
                          <td className="p-2 text-slate-600 whitespace-nowrap">{field.group}</td>
                          <td className="p-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              field.req === 'Mandatory' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : field.req === 'Conditional' 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}>
                              {field.req}
                            </span>
                          </td>
                          <td className="p-2 text-slate-600 min-w-[200px]">{field.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleValidate} className="space-y-6 text-xs">
            {/* Form Fields for Technical PINT OM Engine */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Profile Type</label>
                <select
                  value={docType}
                  onChange={handleDocTypeChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="full">B2B — Standard Tax Invoice (Code 388 / 380)</option>
                  <option value="cn">Credit Note — B2B (Code 381)</option>
                  <option value="dn">Debit Note — B2B (Code 383)</option>
                  <option value="simplified">B2C — Simplified Tax Invoice (Code 388 + QR)</option>
                  <option value="sbi">Self-Billed Invoice (Code 389 - selfbilling-1@om-1)</option>
                  <option value="sbcn">Self-Billed Credit Note (Code 381 - Self Billed)</option>
                  <option value="sbdn">Self-Billed Debit Note (Code 383 - Self Billed)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Invoice Number (IBT-001)</span>
                  <span className="text-[10px] text-purple-700 font-mono">Series Config</span>
                </label>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={techPrefix}
                      onChange={(e) => {
                        const newP = e.target.value;
                        setTechPrefix(newP);
                        setInvNum(`${newP}${techSeq}${techSuffix}`);
                      }}
                      placeholder="Prefix"
                      title="Invoice Prefix"
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold text-purple-900"
                    />
                    <input
                      type="text"
                      value={techSeq}
                      onChange={(e) => {
                        const newS = e.target.value;
                        setTechSeq(newS);
                        setInvNum(`${techPrefix}${newS}${techSuffix}`);
                      }}
                      placeholder="Sequence"
                      title="Sequence Number"
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                    <input
                      type="text"
                      value={techSuffix}
                      onChange={(e) => {
                        const newSf = e.target.value;
                        setTechSuffix(newSf);
                        setInvNum(`${techPrefix}${techSeq}${newSf}`);
                      }}
                      placeholder="Suffix"
                      title="Invoice Suffix"
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold text-purple-900"
                    />
                  </div>
                  <input
                    type="text"
                    value={invNum}
                    onChange={(e) => setInvNum(e.target.value)}
                    placeholder="Combined Full Invoice #"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Date &amp; Time (IBT-002)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                  />
                  <input
                    type="text"
                    value={issueTime}
                    onChange={(e) => setIssueTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Seller & Buyer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seller Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <b className="text-slate-800 font-bold block">Seller Details (BT-Seller):</b>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Seller Legal Name (IBT-027)</label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Seller VAT ID (IBT-031)</label>
                    <input
                      type="text"
                      value={sellerVat}
                      onChange={(e) => setSellerVat(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Seller Peppol EAS Endpoint</label>
                    <input
                      type="text"
                      value={sellerEas}
                      onChange={(e) => setSellerEas(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Buyer Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <b className="text-slate-800 font-bold block">Buyer Details (BT-Buyer):</b>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Buyer Legal Name (IBT-044)</label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Buyer VAT ID (IBT-048)</label>
                    <input
                      type="text"
                      value={buyerVat}
                      onChange={(e) => setBuyerVat(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Buyer Peppol EAS Endpoint</label>
                    <input
                      type="text"
                      value={buyerEas}
                      onChange={(e) => setBuyerEas(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Item */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <b className="text-slate-800 font-bold block">Line Item Specifications:</b>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Item Description (IBT-153)</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseFloat(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Unit Price (OMR)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 20-Bit Bitmap Bar */}
            <div className="p-4 bg-purple-950 text-purple-100 rounded-2xl border border-purple-800 space-y-2 font-mono">
              <div className="flex justify-between items-center text-xs">
                <b className="text-purple-300 font-bold">20-Bit BTOM-001 Transaction Bitmap:</b>
                <span className="text-emerald-400 font-bold">{bitmapString}</span>
              </div>
              <p className="text-[11px] text-purple-300 leading-normal font-sans">
                Bitmap dynamically configures Schematron rules for Reverse Charge, Import RCM, Export, Continuous Supply, and Self-Billing.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Validate 73-Fields against PINT OM v1.0.1</span>
              </button>

              <button
                type="button"
                onClick={handleLoadB2C}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <FileText className="h-4 w-4 text-[#0d4f8b]" />
                <span>Load B2C Simplified Preset</span>
              </button>
            </div>
          </form>

          {/* Validation Output Result Panel */}
          {validationResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-3 transition-all animate-fadeIn ${
                validationResult.isValid
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-red-50/80 border-red-200 text-red-950'
              }`}
            >
              {validationResult.isValid ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Validation Passed — Compliant with PINT OM v1.0.1</span>
                  </div>
                  <div className="space-y-1 text-slate-700 font-mono">
                    <p>
                      CustomizationID: <b>{validationResult.summary?.customizationId}</b>
                    </p>
                    <p>
                      Line Net: <b>{validationResult.summary?.net.toFixed(3)} OMR</b> · VAT: <b>{validationResult.summary?.vat.toFixed(3)} OMR</b> · Total Incl. VAT: <b>{validationResult.summary?.total.toFixed(3)} OMR</b>
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleFinalSubmit}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#0d4f8b] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>Submit to Peppol Network &amp; Save to Database</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span>Validation Failed — PINT OM v1.0.1 Schematron Rules</span>
                  </div>
                  <ul className="space-y-1 text-red-900 list-disc list-inside pt-1">
                    {validationResult.errors.map((err, idx) => (
                      <li key={idx}>
                        <code className="bg-red-100/80 px-1 py-0.5 rounded font-mono text-[11px] font-bold">
                          {err[0]}
                        </code>{' '}
                        — {err[1]}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
