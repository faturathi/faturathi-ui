export type DocumentType = 
  | 'Full Tax Invoice (380/388)'
  | 'Simplified Invoice — B2C'
  | 'Credit Note (381)'
  | 'Debit Note (383)'
  | 'Self-Billed Invoice (selfbilling-1@om-1)'
  | 'Self-Billed Credit Note';

export type InvoiceDirection = 'Outbound (AR)' | 'Inbound (AP)';

export type InvoiceStatus = 'Reported' | 'Sent' | 'Pending' | 'Rejected';

export interface InvoiceLineItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  vatCategory: string; // e.g. 'S 5%', 'Z 0%', 'E Exempt', 'O Out of scope'
}

export type ErpSystem = 'SAP S/4HANA' | 'Oracle Cloud ERP' | 'Microsoft Dynamics 365' | 'Tally Prime' | 'Odoo ERP';
export type SourceChannel = 'REST API' | 'SFTP Sync' | 'File Upload' | 'Manual Entry' | 'ERP Integration';

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
  uuid: string; // BTOM-002 UUID v5
  cat: string; // VAT Category e.g. 'S 5%'
  ent: string; // Entity ID e.g. 'E1', 'E2', 'E3'
  lines: [string, number, string, string][]; // Line item tuples for quick display: [name, qty, priceStr, cat]
  b2c?: boolean;
  cn?: string; // Preceding invoice reference
  err?: string; // Error detail if rejected
  warn?: string; // Warning detail if AB
  ap?: string; // AP status e.g. 'Awaiting approval', 'Approved · posted to ERP'
  branch?: string;
  currency?: string;
  sVat?: string; // Seller VAT ID
  createdAt?: string;
  erpSystem?: ErpSystem;
  sourceChannel?: SourceChannel;
}

export interface Entity {
  id: string;
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
  status: 'Registered' | 'Pending Consent' | 'Terminated';
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
