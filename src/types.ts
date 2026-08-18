export type DocumentType = 
  | 'Full Tax Invoice (380/388)'
  | 'Simplified Invoice — B2C'
  | 'Credit Note (381)'
  | 'Debit Note (383)'
  | 'Self-Billed Invoice (selfbilling-1@om-1)'
  | 'Self-Billed Credit Note';

export type InvoiceDirection = 'Outbound (AR)' | 'Inbound (AP)';

export type InvoiceStatus = 'Draft' | 'Validated' | 'Reported' | 'Sent' | 'Pending' | 'Rejected' | 'Cancelled';

export interface InvoiceLineItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  vatCategory: string; // e.g. 'S 5%', 'Z 0%', 'E Exempt', 'O Out of scope'
}

export type ErpSystem = 'SAP S/4HANA' | 'Oracle Cloud ERP' | 'Microsoft Dynamics 365' | 'Tally Prime' | 'Odoo ERP';
export type SourceChannel = 'REST API' | 'SFTP Sync' | 'File Upload' | 'Manual Entry' | 'ERP Integration' | 'AP Inbound REST API';

export interface Invoice {
  id?: string;
  n: string; // Invoice Number (IBT-001)
  d: string; // Issue Date YYYY-MM-DD (IBT-002)
  t: string; // Issue Time HH:MM:SS (IBT-168)
  type: string; // Document Type
  dir: InvoiceDirection;
  cp: string; // Counterparty / Buyer or Seller Name
  cpv: string; // Counterparty VAT ID (OM11...)
  eas: string; // Counterparty Electronic Address (0248:...)
  net: number; // Net total amount (IBT-109)
  vat: number; // VAT total amount (IBT-110)
  st: InvoiceStatus;
  tdd: string; // TDD status e.g. 'Submit · Ack', 'Submit · In transit', 'Disregard', 'Resubmit'
  tt: string; // 20-char BTOM-001 bitmap
  uuid: string | null; // BTOM-002 UUID v5; null until validation/submission
  cat: string; // VAT Category e.g. 'S 5%'
  ent: string; // Entity ID e.g. 'E1', 'E2', 'E3'
  lines: [string, number, string, string][]; // Line item tuples for quick display: [name, qty, priceStr, cat]
  b2c?: boolean;
  cn?: string; // Preceding invoice reference
  billingReferenceNumber?: string;
  notes?: string;
  validationErrors?: Array<{ rule?: string; field?: string; code?: string; message: string }>;
  err?: string; // Error detail if rejected
  warn?: string; // Warning detail if AB
  ap?: string; // AP status e.g. 'Awaiting approval', 'Approved · posted to ERP'
  branch?: string;
  branchId?: string | null;
  branchCode?: string | null;
  branchName?: string | null;
  currency?: string;
  sVat?: string; // Seller VAT ID
  sName?: string;
  buyerName?: string;
  buyerVat?: string;
  apStatus?: string;
  createdAt?: string;
  submittedAt?: string | null;
  acknowledgedAt?: string | null;
  reportedAt?: string | null;
  erpSystem?: ErpSystem;
  sourceChannel?: SourceChannel;
  documentType?: 'STANDARD_380' | 'SIMPLIFIED_B2C' | 'CREDIT_NOTE_381' | 'DEBIT_NOTE_383' | 'SELF_BILLED_389' | 'SELF_BILLED_CN_261';
  docTypeCode?: '380' | '381' | '383' | '389' | '261';
  source?: 'MANUAL' | 'REST_API' | 'BATCH' | 'SFTP' | 'ERP' | 'AP_INBOUND';
  createdBy?: string;
  mlsStatus?: string | null;
  extra?: Record<string, unknown>;
}

export interface Entity {
  id: string;
  company_group?: string;
  short_code?: string;
  name: string;
  nameAr?: string;
  type?: string;
  crNum?: string;
  vatin: string;
  branchId?: string;
  address?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  pid: string;
  prefixes: string[];
  invoicePrefix?: string;
  invoiceSuffix?: string;
  creditNotePrefix?: string;
  creditNoteSuffix?: string;
  nextInvoiceNumber?: number;
  status: 'Registered' | 'Pending Consent' | 'Terminated';
}

export interface CompanyGroup {
  id: string;
  name: string;
  group_vatin: string;
}

export interface CompanyBranch {
  id: string;
  company: string;
  company_name: string;
  company_vatin: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  contact_email?: string;
  contact_phone?: string;
  invoice_prefix: string;
  invoice_suffix: string;
  credit_note_prefix: string;
  credit_note_suffix: string;
  next_invoice_number: number;
  is_active: boolean;
}

export interface ErpDeliveryConfig {
  id: string;
  company: string;
  company_name: string;
  branch: string | null;
  branch_code: string;
  branch_name: string;
  name: string;
  base_url: string;
  endpoint_path: string;
  http_method: 'POST' | 'PUT' | 'PATCH';
  auth_type: 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC' | 'OAUTH2';
  auth_header_name: string;
  username: string;
  custom_headers: Record<string, string>;
  payload_template: Record<string, unknown>;
  timeout_seconds: number;
  is_active: boolean;
  token_configured: boolean;
  curl_preview: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  n: string; // Name
  e: string; // Email
  r: string; // Role name
  ent: string; // Entity scope
  st: 'Active' | 'Disabled' | 'Invited'; // Status
  ll: string; // Last login
  fontRole?: string;
  email?: string;
  role?: string;
  designation?: string;
  branch?: string;
  mfa?: boolean;
}

export interface TddItem {
  id: string;
  uuid: string;
  invoiceNumber: string;
  leg: string;
  status: 'Submit · Ack' | 'Submit · In transit' | 'Disregard' | 'Resubmit';
  sla: string;
}

/**
 * Business Rule: Invoices once submitted to OTA/Peppol ("Submit · Ack" or "Submit · In transit")
 * CANNOT be edited or deleted.
 * However, Rejected invoices (or unsubmitted drafts) CAN be edited and re-submitted.
 */
export function canEditInvoice(inv: Invoice | null | undefined): boolean {
  if (!inv) return false;
  // If explicitly rejected or has errors, it CAN be edited and re-submitted
  if (inv.st === 'Rejected' || inv.tdd?.includes('Rejected') || Boolean(inv.err)) {
    return true;
  }
  // If submitted to OTA/Peppol ("Submit · Ack" or "Submit · In transit" / Reported or Sent), CANNOT edit or delete
  if (
    inv.tdd === 'Submit · Ack' ||
    inv.tdd === 'Submit · In transit' ||
    inv.st === 'Reported' ||
    inv.st === 'Sent'
  ) {
    return false;
  }
  // Otherwise (e.g. Pending, draft) it can be edited
  return true;
}

export interface MlsItem {
  id: string;
  invoiceNumber: string;
  from: string;
  mls: 'AP' | 'AB' | 'RE';
  detail: string;
}

export interface ExceptionItem {
  id: number;
  description: string;
  amount: number;
  age: string;
  category: string;
  status: string;
}

export type RoleMode = 'admin' | 'finmgr' | 'maker' | 'ops' | 'audit';

export interface RoleConfig {
  hide: string[];
  mask: boolean;
  label: string;
}
