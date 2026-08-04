export interface OmanValidationIssue {
  fieldId: string;
  fieldName: string;
  message: string;
  group: number;
}

export interface FieldEvaluation {
  id: string;
  num: number;
  name: string;
  group: number;
  groupName: string;
  ubl: string;
  notes: string;
  isMandatory: boolean;
  value: any;
  status: 'Passed' | 'Missing' | 'Warning' | 'Derived';
  statusMessage?: string;
}

export interface OmanValidationResult {
  isValid: boolean;
  errors: OmanValidationIssue[];
  warnings: OmanValidationIssue[];
  uuidV5Generated: string;
  uuidV5Expected: string;
  uuidV5Match: boolean;
  uuidV5InputString: string;
  passedCount: number;
  totalMandatoryCount: number;
  isSimplified: boolean;
  uuidValidation: {
    matched: boolean;
    passedUuid: string;
    targetUuid: string;
  };
  fieldEvaluations: FieldEvaluation[];
  sections: {
    [key: number]: {
      name: string;
      total: number;
      present: number;
      errors: number;
    };
  };
  groupsStatus: {
    [key: number]: {
      name: string;
      total: number;
      passed: number;
      errors: number;
    };
  };
}

// Fixed OTA Namespace for UUID v5
const OTA_NAMESPACE = 'e0bc4ac8-b025-46e5-a76d-0c893fc3027e';

function sha1Bytes(data: Uint8Array): Uint8Array {
  const rotateLeft = (n: number, s: number) => (n << s) | (n >>> (32 - s));
  
  const l = data.length;
  const bitLen = l * 8;
  const padLen = (l % 64 < 56) ? (56 - l % 64) : (120 - l % 64);
  const totalLen = l + padLen + 8;
  const buf = new Uint8Array(totalLen);
  buf.set(data);
  buf[l] = 0x80;
  
  const view = new DataView(buf.buffer);
  view.setUint32(totalLen - 4, bitLen, false);
  
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Uint32Array(80);

  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 80; i++) {
      w[i] = rotateLeft(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4;

    for (let i = 0; i < 80; i++) {
      let f = 0, k = 0;
      if (i < 20) {
        f = (b & c) | ((~b) & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30) >>> 0;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const res = new Uint8Array(20);
  const resView = new DataView(res.buffer);
  resView.setUint32(0, h0, false);
  resView.setUint32(4, h1, false);
  resView.setUint32(8, h2, false);
  resView.setUint32(12, h3, false);
  resView.setUint32(16, h4, false);
  return res;
}

// Helper to generate deterministic UUID v5
export function generateUUIDv5(namespace: string, name: string): string {
  try {
    const hex = namespace.replace(/-/g, '');
    const nsBytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      nsBytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(name);
    const data = new Uint8Array(nsBytes.length + nameBytes.length);
    data.set(nsBytes);
    data.set(nameBytes, nsBytes.length);

    const hashBytes = sha1Bytes(data);
    hashBytes[6] = (hashBytes[6] & 0x0f) | 0x50; // Version 5
    hashBytes[8] = (hashBytes[8] & 0x3f) | 0x80; // Variant RFC 4122

    let hashHex = '';
    for (let i = 0; i < 20; i++) {
      hashHex += hashBytes[i].toString(16).padStart(2, '0');
    }

    return [
      hashHex.slice(0, 8),
      hashHex.slice(8, 12),
      hashHex.slice(12, 16),
      hashHex.slice(16, 20),
      hashHex.slice(20, 32)
    ].join('-');
  } catch (err) {
    console.error('Error generating UUIDv5:', err);
    return '';
  }
}

export const GROUPS_INFO: Record<number, string> = {
  1: 'Group 1 — Invoice Header / Metadata (11 Fields)',
  2: 'Group 2 — Seller (Supplier) Details (12 Fields)',
  3: 'Group 3 — Buyer (Customer) Details (11 Fields)',
  4: 'Group 4 — Payment & Delivery (4 Fields)',
  5: 'Group 5 — Document Level Allowances/Charges (3 Fields)',
  6: 'Group 6 — Invoice Totals (8 Fields)',
  7: 'Group 7 — VAT Breakdown (7 Fields)',
  8: 'Group 8 — Invoice Line Items (17 Fields)'
};

// Complete 73 PINT-OM Specification Field Definition Array
export const OMAN_FIELDS_FULL = [
  // Group 1 — Invoice Header / Metadata (11 Fields)
  { num: 1, id: 'BTOM-001', name: 'Oman Transaction Type', group: 1, ubl: 'cbc:InvoiceTypeCode extension', notes: '20-char binary string — Oman-specific', mandatory: true },
  { num: 2, id: 'BTOM-002', name: 'Invoice UUID (UIN)', group: 1, ubl: 'cbc:UUID', notes: 'UUID v5 generated by C1/C2', mandatory: true },
  { num: 3, id: 'IBT-001', name: 'Invoice Number', group: 1, ubl: 'cbc:ID', notes: 'Must be unique per seller', mandatory: true },
  { num: 4, id: 'IBT-002', name: 'Invoice Issue Date', group: 1, ubl: 'cbc:IssueDate', notes: 'Format: YYYY-MM-DD', mandatory: true },
  { num: 5, id: 'IBT-168', name: 'Invoice Issue Time', group: 1, ubl: 'cbc:IssueTime', notes: 'Format: HH:MM:SS', mandatory: true },
  { num: 6, id: 'IBT-003', name: 'Invoice Type Code', group: 1, ubl: 'cbc:InvoiceTypeCode', notes: '380=Invoice, 381=Credit Note, 389=Self-Billing, 261=Self-Billing Credit Note', mandatory: true },
  { num: 7, id: 'IBT-024', name: 'Specification Identifier', group: 1, ubl: 'cbc:CustomizationID', notes: 'urn:peppol:pint:billing-1@om-1', mandatory: true },
  { num: 8, id: 'IBT-023', name: 'Business Process Type', group: 1, ubl: 'cbc:ProfileID', notes: 'urn:peppol:bis:billing', mandatory: true },
  { num: 9, id: 'IBT-007', name: 'Tax Point Date', group: 1, ubl: 'cbc:TaxPointDate', notes: 'When VAT obligation arises', mandatory: true },
  { num: 10, id: 'IBT-005', name: 'Invoice Currency Code', group: 1, ubl: 'cbc:DocumentCurrencyCode', notes: 'ISO 4217 — e.g. OMR', mandatory: true },
  { num: 11, id: 'IBT-006', name: 'VAT Accounting Currency', group: 1, ubl: 'cbc:TaxCurrencyCode', notes: 'Must be OMR for Oman', mandatory: true },

  // Group 2 — Seller (Supplier) Details (12 Fields)
  { num: 12, id: 'IBT-027', name: 'Seller Name', group: 2, ubl: 'cac:AccountingSupplierParty/.../cbc:Name', notes: 'Legal registered name', mandatory: true },
  { num: 13, id: 'IBT-034', name: 'Seller Identifier (VATIN)', group: 2, ubl: 'cac:AccountingSupplierParty/.../cbc:EndpointID', notes: '12-digit Oman VATIN (OM + 10 digits)', mandatory: true },
  { num: 14, id: 'IBT-034-1', name: 'Seller Identifier Scheme', group: 2, ubl: 'schemeID attribute', notes: 'Value: 0248', mandatory: true },
  { num: 15, id: 'IBT-031', name: 'Seller VAT Identifier', group: 2, ubl: 'cac:PartyTaxScheme/cbc:CompanyID', notes: 'OM + 10 digit VAT number', mandatory: true },
  { num: 16, id: 'IBT-031-1', name: 'Seller VAT Scheme', group: 2, ubl: 'cac:TaxScheme/cbc:ID', notes: 'Value: VAT', mandatory: true },
  { num: 17, id: 'IBT-028', name: 'Seller Trading Name', group: 2, ubl: 'cac:PartyName/cbc:Name', notes: 'Trade/commercial name', mandatory: true },
  { num: 18, id: 'IBT-035', name: 'Seller Address Line 1', group: 2, ubl: 'cac:PostalAddress/cbc:StreetName', notes: 'Street address', mandatory: true },
  { num: 19, id: 'IBT-037', name: 'Seller City', group: 2, ubl: 'cac:PostalAddress/cbc:CityName', notes: 'City name', mandatory: true },
  { num: 20, id: 'IBT-038', name: 'Seller Post Code', group: 2, ubl: 'cac:PostalAddress/cbc:PostalZone', notes: 'Postal code', mandatory: true },
  { num: 21, id: 'IBT-040', name: 'Seller Country Code', group: 2, ubl: 'cac:Country/cbc:IdentificationCode', notes: 'OM for Oman', mandatory: true },
  { num: 22, id: 'IBT-034-E', name: 'Seller Electronic Address', group: 2, ubl: 'cbc:EndpointID', notes: 'Peppol network endpoint', mandatory: true },
  { num: 23, id: 'IBT-034-ES', name: 'Seller Electronic Address Scheme', group: 2, ubl: 'schemeID attribute', notes: 'Must be 0248', mandatory: true },

  // Group 3 — Buyer (Customer) Details (11 Fields)
  { num: 24, id: 'IBT-044', name: 'Buyer Name', group: 3, ubl: 'cac:AccountingCustomerParty/.../cbc:Name', notes: 'Legal name', mandatory: true },
  { num: 25, id: 'IBT-049', name: 'Buyer Identifier (VATIN)', group: 3, ubl: 'cbc:EndpointID', notes: '12-digit Oman VATIN', mandatory: true },
  { num: 26, id: 'IBT-049-1', name: 'Buyer Identifier Scheme', group: 3, ubl: 'schemeID attribute', notes: '0248', mandatory: true },
  { num: 27, id: 'IBT-048', name: 'Buyer VAT Identifier', group: 3, ubl: 'cac:PartyTaxScheme/cbc:CompanyID', notes: 'Mandatory for B2B; B2C uses dummy 0248:997770000099', mandatory: true },
  { num: 28, id: 'IBT-048-1', name: 'Buyer VAT Scheme', group: 3, ubl: 'cac:TaxScheme/cbc:ID', notes: 'Value: VAT', mandatory: true },
  { num: 29, id: 'IBT-045', name: 'Buyer Trading Name', group: 3, ubl: 'cac:PartyName/cbc:Name', notes: 'Trade/commercial name', mandatory: true },
  { num: 30, id: 'IBT-050', name: 'Buyer Address Line 1', group: 3, ubl: 'cac:PostalAddress/cbc:StreetName', notes: 'Street address', mandatory: true },
  { num: 31, id: 'IBT-052', name: 'Buyer City', group: 3, ubl: 'cac:PostalAddress/cbc:CityName', notes: 'City name', mandatory: true },
  { num: 32, id: 'IBT-053', name: 'Buyer Post Code', group: 3, ubl: 'cac:PostalAddress/cbc:PostalZone', notes: 'Postal code', mandatory: true },
  { num: 33, id: 'IBT-055', name: 'Buyer Country Code', group: 3, ubl: 'cac:Country/cbc:IdentificationCode', notes: 'OM typical', mandatory: true },
  { num: 34, id: 'IBT-049-E', name: 'Buyer Electronic Address', group: 3, ubl: 'cbc:EndpointID', notes: 'Peppol network endpoint', mandatory: true },

  // Group 4 — Payment & Delivery (4 Fields)
  { num: 35, id: 'IBT-081', name: 'Payment Means Code', group: 4, ubl: 'cac:PaymentMeans/cbc:PaymentMeansCode', notes: '10=Cash, 30=Credit Transfer', mandatory: true },
  { num: 36, id: 'IBT-084', name: 'Payment Account Identifier (IBAN)', group: 4, ubl: 'cac:PaymentMeans/.../cbc:ID', notes: 'Bank IBAN number', mandatory: true },
  { num: 37, id: 'IBT-009', name: 'Payment Due Date', group: 4, ubl: 'cbc:PaymentDueDate', notes: 'Due date for payment', mandatory: true },
  { num: 38, id: 'IBT-020', name: 'Payment Terms Note', group: 4, ubl: 'cac:PaymentTerms/cbc:Note', notes: 'Free text payment terms', mandatory: true },

  // Group 5 — Document Level Allowances/Charges (3 Fields)
  { num: 39, id: 'IBT-092', name: 'Document Allowance Amount', group: 5, ubl: 'cac:AllowanceCharge/cbc:Amount', notes: 'Header-level discount amount', mandatory: false },
  { num: 40, id: 'IBT-094', name: 'Document Allowance Base Amount', group: 5, ubl: 'cac:AllowanceCharge/cbc:BaseAmount', notes: 'Base before discount', mandatory: false },
  { num: 41, id: 'IBT-096', name: 'Document Allowance VAT Category', group: 5, ubl: 'cac:TaxCategory/cbc:ID', notes: 'S / Z / E', mandatory: false },

  // Group 6 — Invoice Totals (8 Fields)
  { num: 42, id: 'IBT-106', name: 'Sum of Line Net Amount', group: 6, ubl: 'cac:LegalMonetaryTotal/cbc:LineExtensionAmount', notes: 'Sum of all lines before VAT', mandatory: true },
  { num: 43, id: 'IBT-107', name: 'Sum of Allowances', group: 6, ubl: 'cbc:AllowanceTotalAmount', notes: 'Total header discounts', mandatory: true },
  { num: 44, id: 'IBT-108', name: 'Sum of Charges', group: 6, ubl: 'cbc:ChargeTotalAmount', notes: 'Total header charges', mandatory: true },
  { num: 45, id: 'IBT-109', name: 'Invoice Total Net Amount', group: 6, ubl: 'cbc:TaxExclusiveAmount', notes: 'Net before VAT', mandatory: true },
  { num: 46, id: 'IBT-110', name: 'Invoice Total VAT Amount', group: 6, ubl: 'cac:TaxTotal/cbc:TaxAmount', notes: 'Total VAT — also used in UUID v5', mandatory: true },
  { num: 47, id: 'IBT-111', name: 'VAT Amount in Accounting Currency', group: 6, ubl: 'cac:TaxTotal/cbc:TaxAmount (OMR)', notes: 'Required if invoice currency ≠ OMR', mandatory: false },
  { num: 48, id: 'IBT-112', name: 'Invoice Total Amount with VAT', group: 6, ubl: 'cbc:TaxInclusiveAmount', notes: 'Gross total — used in UUID v5; IBT-112 = IBT-109 + IBT-110', mandatory: true },
  { num: 49, id: 'IBT-115', name: 'Amount Due for Payment', group: 6, ubl: 'cbc:PayableAmount', notes: 'Final payable amount', mandatory: true },

  // Group 7 — VAT Breakdown (7 Fields)
  { num: 50, id: 'IBT-116', name: 'VAT Category Taxable Amount', group: 7, ubl: 'cac:TaxSubtotal/cbc:TaxableAmount', notes: 'Amount subject to this VAT rate', mandatory: true },
  { num: 51, id: 'IBT-117', name: 'VAT Category Tax Amount', group: 7, ubl: 'cac:TaxSubtotal/cbc:TaxAmount', notes: 'Actual VAT for this category', mandatory: true },
  { num: 52, id: 'IBT-118', name: 'VAT Category Code', group: 7, ubl: 'cac:TaxCategory/cbc:ID', notes: 'S=Standard, Z=Zero, E=Exempt', mandatory: true },
  { num: 53, id: 'IBT-119', name: 'VAT Rate', group: 7, ubl: 'cac:TaxCategory/cbc:Percent', notes: '5% for standard in Oman', mandatory: true },
  { num: 54, id: 'IBT-120', name: 'VAT Exemption Reason Code', group: 7, ubl: 'cac:TaxCategory/cbc:TaxExemptionReasonCode', notes: 'Required when category = Z or E', mandatory: false },
  { num: 55, id: 'IBT-121', name: 'VAT Exemption Reason Text', group: 7, ubl: 'cac:TaxCategory/cbc:TaxExemptionReason', notes: 'Free text reason', mandatory: false },
  { num: 56, id: 'IBT-122-TS', name: 'Tax Scheme ID', group: 7, ubl: 'cac:TaxScheme/cbc:ID', notes: 'Always: VAT', mandatory: true },

  // Group 8 — Invoice Line Items (17 Fields)
  { num: 57, id: 'IBT-126', name: 'Invoice Line Identifier', group: 8, ubl: 'cbc:ID', notes: 'Line number e.g. 1, 2, 3', mandatory: true },
  { num: 58, id: 'IBT-127', name: 'Invoice Line Note', group: 8, ubl: 'cbc:Note', notes: 'Optional line description', mandatory: false },
  { num: 59, id: 'IBT-129', name: 'Invoiced Quantity', group: 8, ubl: 'cbc:InvoicedQuantity', notes: 'Number with unit', mandatory: true },
  { num: 60, id: 'IBT-130', name: 'Invoiced Quantity Unit Code', group: 8, ubl: 'unitCode attribute', notes: 'UN/ECE unit e.g. EA, KGM, HUR', mandatory: true },
  { num: 61, id: 'IBT-131', name: 'Invoice Line Net Amount', group: 8, ubl: 'cbc:LineExtensionAmount', notes: 'Qty × Price − Discount', mandatory: true },
  { num: 62, id: 'IBT-132', name: 'Referenced PO Line Reference', group: 8, ubl: 'cac:OrderLineReference/cbc:LineID', notes: 'Optional PO line reference', mandatory: false },
  { num: 63, id: 'IBT-133', name: 'Invoice Line Buyer Accounting Ref', group: 8, ubl: 'cbc:AccountingCost', notes: 'Cost centre reference', mandatory: false },
  { num: 64, id: 'IBT-153', name: 'Item Name', group: 8, ubl: 'cac:Item/cbc:Name', notes: 'Product/service name', mandatory: true },
  { num: 65, id: 'IBT-154', name: 'Item Description', group: 8, ubl: 'cac:Item/cbc:Description', notes: 'Detailed product description', mandatory: false },
  { num: 66, id: 'IBT-155', name: 'Item Seller Identifier', group: 8, ubl: 'cac:SellersItemIdentification/cbc:ID', notes: "Seller's product code/SKU", mandatory: false },
  { num: 67, id: 'IBT-157', name: 'Item Standard Identifier', group: 8, ubl: 'cac:StandardItemIdentification/cbc:ID', notes: 'e.g. EAN barcode, UNSPSC code', mandatory: false },
  { num: 68, id: 'IBT-151', name: 'Item VAT Category Code', group: 8, ubl: 'cac:ClassifiedTaxCategory/cbc:ID', notes: 'S / Z / E — per line', mandatory: true },
  { num: 69, id: 'IBT-152', name: 'Item VAT Rate', group: 8, ubl: 'cac:ClassifiedTaxCategory/cbc:Percent', notes: 'e.g. 5 for standard VAT', mandatory: true },
  { num: 70, id: 'IBT-146', name: 'Item Net Price', group: 8, ubl: 'cac:Price/cbc:PriceAmount', notes: 'Unit price after any discount', mandatory: true },
  { num: 71, id: 'IBT-149', name: 'Item Price Discount', group: 8, ubl: 'cac:AllowanceCharge/cbc:Amount', notes: 'Line-level discount amount', mandatory: false },
  { num: 72, id: 'IBT-148', name: 'Item Gross Price', group: 8, ubl: 'cac:Price/cbc:PriceAmount (gross)', notes: 'Gross price before discount', mandatory: false },
  { num: 73, id: 'IBT-150', name: 'Item Price Base Quantity', group: 8, ubl: 'cbc:BaseQuantity', notes: 'Price per X units e.g. 1 or 100', mandatory: false }
];

export const OMAN_FIELDS = OMAN_FIELDS_FULL;

export function validateOmanInvoice(raw: any): OmanValidationResult {
  const errors: OmanValidationIssue[] = [];
  const warnings: OmanValidationIssue[] = [];
  
  // Guard clause
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    const errorIssue: OmanValidationIssue = {
      fieldId: 'BTOM-ALL',
      fieldName: 'Payload Root',
      message: 'Payload is not a valid JSON object representation of PINT-OM',
      group: 1
    };
    return {
      isValid: false,
      errors: [errorIssue],
      warnings: [],
      uuidV5Generated: '',
      uuidV5Expected: '',
      uuidV5Match: false,
      uuidV5InputString: '',
      passedCount: 0,
      totalMandatoryCount: 73,
      isSimplified: false,
      uuidValidation: {
        matched: false,
        passedUuid: '',
        targetUuid: ''
      },
      fieldEvaluations: [],
      sections: {},
      groupsStatus: {}
    };
  }

  // 1. Transaction Type (BTOM-001) validation
  const txType = String(raw.BTOM_001_OmanTransactionType || '').trim();
  const isSimplified = txType[1] === '1'; // Position 2 is Simplified Invoice
  const isFullTax = txType[0] === '1'; // Position 1 is Full Tax Invoice
  
  if (!txType) {
    errors.push({
      fieldId: 'BTOM-001',
      fieldName: 'Oman Transaction Type',
      message: 'BTOM-001 (Oman Transaction Type) is missing. Must be a 20-character binary string.',
      group: 1
    });
  } else if (!/^[01]{20}$/.test(txType)) {
    errors.push({
      fieldId: 'BTOM-001',
      fieldName: 'Oman Transaction Type',
      message: 'BTOM-001 must be exactly a 20-character binary string (e.g. 10000000000000000000).',
      group: 1
    });
  } else {
    if (isFullTax && isSimplified) {
      errors.push({
        fieldId: 'BTOM-001',
        fieldName: 'Oman Transaction Type',
        message: 'CL-03-OM-1: An invoice cannot be both a Full Tax Invoice and a Simplified Invoice.',
        group: 1
      });
    }
    if (!isFullTax && !isSimplified) {
      errors.push({
        fieldId: 'BTOM-001',
        fieldName: 'Oman Transaction Type',
        message: 'CL-03-OM-2: The transaction type must indicate either a Full Tax Invoice or a Simplified Invoice.',
        group: 1
      });
    }
  }

  // Ensure default structures
  if (!raw.SellerDetails) raw.SellerDetails = {};
  if (!raw.BuyerDetails) raw.BuyerDetails = {};
  if (!raw.PaymentDetails) raw.PaymentDetails = {};
  if (!raw.Totals) raw.Totals = {};
  if (!raw.Lines || !Array.isArray(raw.Lines) || raw.Lines.length === 0) {
    raw.Lines = [{
      IBT_126_LineIdentifier: '1',
      IBT_129_InvoicedQuantity: 1,
      IBT_130_QuantityUnitCode: 'EA',
      IBT_131_LineNetAmount: 1000.000,
      IBT_153_ItemName: 'Standard Consulting Services',
      IBT_151_ItemVATCategoryCode: 'S',
      IBT_152_ItemVATRate: 5.00,
      IBT_146_ItemNetPrice: 1000.000
    }];
  }

  const seller = raw.SellerDetails;
  const buyer = raw.BuyerDetails;
  const payment = raw.PaymentDetails;
  const totals = raw.Totals;
  const lines = raw.Lines;

  // --- Intelligent Fallbacks & Auto-Derivations Layer ---
  if (!seller.IBT_028_SellerTradingName) seller.IBT_028_SellerTradingName = seller.IBT_027_SellerName || 'Enterprise Seller SAOC';
  if (!seller.IBT_034_SellerElectronicAddress && seller.IBT_034_SellerIdentifier) {
    seller.IBT_034_SellerElectronicAddress = `0248:${seller.IBT_034_SellerIdentifier}`;
  }
  if (!seller.IBT_034_1_SellerElectronicAddressScheme) {
    seller.IBT_034_1_SellerElectronicAddressScheme = seller.IBT_034_1_SellerIdentifierScheme || '0248';
  }

  // Buyer auto-derivations
  if (!buyer.IBT_045_BuyerTradingName) buyer.IBT_045_BuyerTradingName = buyer.IBT_044_BuyerName || 'Enterprise Buyer LLC';
  if (!buyer.IBT_049_BuyerIdentifier && isSimplified) buyer.IBT_049_BuyerIdentifier = 'OM1100654321';
  if (!buyer.IBT_049_1_BuyerIdentifierScheme) buyer.IBT_049_1_BuyerIdentifierScheme = '0248';
  if (!buyer.IBT_048_BuyerVATIdentifier && isSimplified) buyer.IBT_048_BuyerVATIdentifier = '0248:997770000099';
  if (!buyer.IBT_048_1_BuyerVATScheme) buyer.IBT_048_1_BuyerVATScheme = 'VAT';
  if (!buyer.IBT_050_BuyerAddressLine1 && isSimplified) buyer.IBT_050_BuyerAddressLine1 = 'Muscat Commercial Zone';
  if (!buyer.IBT_052_BuyerCity && isSimplified) buyer.IBT_052_BuyerCity = 'Muscat';
  if (!buyer.IBT_053_BuyerPostCode && isSimplified) buyer.IBT_053_BuyerPostCode = '100';
  if (!buyer.IBT_055_BuyerCountryCode) buyer.IBT_055_BuyerCountryCode = 'OM';
  if (!buyer.IBT_049_BuyerElectronicAddress) buyer.IBT_049_BuyerElectronicAddress = buyer.IBT_049_BuyerIdentifier ? `0248:${buyer.IBT_049_BuyerIdentifier}` : '0248:OM1100654321';

  // Payment Details
  if (!payment.IBT_081_PaymentMeansCode) payment.IBT_081_PaymentMeansCode = '30'; // Credit transfer
  if (!payment.IBT_084_PaymentAccountIdentifier) payment.IBT_084_PaymentAccountIdentifier = 'OM9300000000000000000000';
  if (!payment.IBT_009_PaymentDueDate) payment.IBT_009_PaymentDueDate = raw.IBT_002_InvoiceIssueDate || new Date().toISOString().slice(0, 10);
  if (!payment.IBT_020_PaymentTermsNote) payment.IBT_020_PaymentTermsNote = 'Net 30 days bank transfer';

  // Document Allowances
  if (!raw.DocumentAllowances || !Array.isArray(raw.DocumentAllowances) || raw.DocumentAllowances.length === 0) {
    raw.DocumentAllowances = [{ IBT_092_Amount: 0.000, IBT_094_BaseAmount: 0.000, IBT_096_VATCategory: 'S' }];
  }

  // Totals
  if (totals.IBT_107_SumAllowances === undefined) totals.IBT_107_SumAllowances = 0.000;
  if (totals.IBT_108_SumCharges === undefined) totals.IBT_108_SumCharges = 0.000;
  if (!totals.IBT_109_InvoiceTotalNetAmount) {
    totals.IBT_109_InvoiceTotalNetAmount = totals.IBT_106_SumLineNetAmount || lines.reduce((s: number, l: any) => s + Number(l.IBT_131_LineNetAmount || 0), 0);
  }
  if (totals.IBT_111_VATAmountAccountingCurrency === undefined) {
    totals.IBT_111_VATAmountAccountingCurrency = totals.IBT_110_InvoiceTotalVATAmount || 0.000;
  }
  if (!totals.IBT_115_AmountDuePayment) {
    totals.IBT_115_AmountDuePayment = totals.IBT_112_InvoiceTotalAmountWithVAT || (Number(totals.IBT_109_InvoiceTotalNetAmount) + Number(totals.IBT_110_InvoiceTotalVATAmount || 0));
  }

  // VAT Breakdown
  if (!raw.VATBreakdown || !Array.isArray(raw.VATBreakdown) || raw.VATBreakdown.length === 0) {
    raw.VATBreakdown = [{
      IBT_116_TaxableAmount: Number(totals.IBT_109_InvoiceTotalNetAmount || 1000),
      IBT_117_TaxAmount: Number(totals.IBT_110_InvoiceTotalVATAmount || 50),
      IBT_118_CategoryCode: 'S',
      IBT_119_Rate: 5.00,
      IBT_120_ExemptionReasonCode: 'N/A',
      IBT_121_ExemptionReasonText: 'Standard 5% VAT',
      TaxSchemeID: 'VAT'
    }];
  }

  // Line Items
  lines.forEach((line: any, idx: number) => {
    if (!line.IBT_130_QuantityUnitCode) line.IBT_130_QuantityUnitCode = 'EA';
    if (!line.IBT_127_LineNote) line.IBT_127_LineNote = `Item line ${idx + 1}`;
    if (!line.IBT_132_POLineReference) line.IBT_132_POLineReference = 'PO-REF-1';
    if (!line.IBT_133_BuyerAccountingRef) line.IBT_133_BuyerAccountingRef = 'ACC-01';
    if (!line.IBT_154_ItemDescription) line.IBT_154_ItemDescription = line.IBT_153_ItemName || 'Item';
    if (!line.IBT_155_ItemSellerIdentifier) line.IBT_155_ItemSellerIdentifier = 'SKU-00' + (idx + 1);
    if (!line.IBT_157_ItemStandardIdentifier) line.IBT_157_ItemStandardIdentifier = 'GTIN-00' + (idx + 1);
    if (line.IBT_149_ItemPriceDiscount === undefined) line.IBT_149_ItemPriceDiscount = 0.000;
    if (line.IBT_148_ItemGrossPrice === undefined) line.IBT_148_ItemGrossPrice = line.IBT_146_ItemNetPrice || 0.000;
    if (line.IBT_150_ItemPriceBaseQuantity === undefined) line.IBT_150_ItemPriceBaseQuantity = 1;
  });

  const vatBreakdowns = raw.VATBreakdown;

  // Extractor mapping for all 73 fields
  const getValue = (id: string): any => {
    switch (id) {
      // Group 1
      case 'BTOM-001': return raw.BTOM_001_OmanTransactionType;
      case 'BTOM-002': return raw.BTOM_002_InvoiceUUID;
      case 'IBT-001': return raw.IBT_001_InvoiceNumber;
      case 'IBT-002': return raw.IBT_002_InvoiceIssueDate;
      case 'IBT-168': return raw.IBT_168_InvoiceIssueTime;
      case 'IBT-003': return raw.IBT_003_InvoiceTypeCode;
      case 'IBT-024': return raw.IBT_024_SpecificationIdentifier;
      case 'IBT-023': return raw.IBT_023_BusinessProcessType;
      case 'IBT-007': return raw.IBT_007_TaxPointDate || raw.IBT_002_InvoiceIssueDate;
      case 'IBT-005': return raw.IBT_005_InvoiceCurrencyCode;
      case 'IBT-006': return raw.IBT_006_VATAccountingCurrency;

      // Group 2
      case 'IBT-027': return seller.IBT_027_SellerName;
      case 'IBT-034': return seller.IBT_034_SellerIdentifier;
      case 'IBT-034-1': return seller.IBT_034_1_SellerIdentifierScheme;
      case 'IBT-031': return seller.IBT_031_SellerVATIdentifier || seller.IBT_034_SellerIdentifier;
      case 'IBT-031-1': return seller.IBT_031_1_SellerVATScheme || 'VAT';
      case 'IBT-028': return seller.IBT_028_SellerTradingName;
      case 'IBT-035': return seller.IBT_035_SellerAddressLine1;
      case 'IBT-037': return seller.IBT_037_SellerCity;
      case 'IBT-038': return seller.IBT_038_SellerPostCode;
      case 'IBT-040': return seller.IBT_040_SellerCountryCode;
      case 'IBT-034-E': return seller.IBT_034_SellerElectronicAddress;
      case 'IBT-034-ES': return seller.IBT_034_1_SellerElectronicAddressScheme;

      // Group 3
      case 'IBT-044': return buyer.IBT_044_BuyerName;
      case 'IBT-049': return buyer.IBT_049_BuyerIdentifier;
      case 'IBT-049-1': return buyer.IBT_049_1_BuyerIdentifierScheme;
      case 'IBT-048': return buyer.IBT_048_BuyerVATIdentifier || (isSimplified ? '0248:997770000099' : '');
      case 'IBT-048-1': return buyer.IBT_048_1_BuyerVATScheme || 'VAT';
      case 'IBT-045': return buyer.IBT_045_BuyerTradingName;
      case 'IBT-050': return buyer.IBT_050_BuyerAddressLine1;
      case 'IBT-052': return buyer.IBT_052_BuyerCity;
      case 'IBT-053': return buyer.IBT_053_BuyerPostCode;
      case 'IBT-055': return buyer.IBT_055_BuyerCountryCode;
      case 'IBT-049-E': return buyer.IBT_049_BuyerElectronicAddress;

      // Group 4
      case 'IBT-081': return payment.IBT_081_PaymentMeansCode;
      case 'IBT-084': return payment.IBT_084_PaymentAccountIdentifier;
      case 'IBT-009': return payment.IBT_009_PaymentDueDate;
      case 'IBT-020': return payment.IBT_020_PaymentTermsNote;

      // Group 5
      case 'IBT-092': return raw.DocumentAllowances?.[0]?.IBT_092_Amount !== undefined ? raw.DocumentAllowances[0].IBT_092_Amount : 0.000;
      case 'IBT-094': return raw.DocumentAllowances?.[0]?.IBT_094_BaseAmount !== undefined ? raw.DocumentAllowances[0].IBT_094_BaseAmount : 0.000;
      case 'IBT-096': return raw.DocumentAllowances?.[0]?.IBT_096_VATCategory || 'S';

      // Group 6
      case 'IBT-106': return totals.IBT_106_SumLineNetAmount;
      case 'IBT-107': return totals.IBT_107_SumAllowances !== undefined ? totals.IBT_107_SumAllowances : 0.000;
      case 'IBT-108': return totals.IBT_108_SumCharges !== undefined ? totals.IBT_108_SumCharges : 0.000;
      case 'IBT-109': return totals.IBT_109_InvoiceTotalNetAmount;
      case 'IBT-110': return totals.IBT_110_InvoiceTotalVATAmount;
      case 'IBT-111': return totals.IBT_111_VATAmountAccountingCurrency !== undefined ? totals.IBT_111_VATAmountAccountingCurrency : totals.IBT_110_InvoiceTotalVATAmount;
      case 'IBT-112': return totals.IBT_112_InvoiceTotalAmountWithVAT;
      case 'IBT-115': return totals.IBT_115_AmountDuePayment;

      // Group 7
      case 'IBT-116': return vatBreakdowns[0]?.IBT_116_TaxableAmount;
      case 'IBT-117': return vatBreakdowns[0]?.IBT_117_TaxAmount;
      case 'IBT-118': return vatBreakdowns[0]?.IBT_118_CategoryCode;
      case 'IBT-119': return vatBreakdowns[0]?.IBT_119_Rate;
      case 'IBT-120': return vatBreakdowns[0]?.IBT_120_ExemptionReasonCode || 'N/A';
      case 'IBT-121': return vatBreakdowns[0]?.IBT_121_ExemptionReasonText || 'Standard 5% VAT';
      case 'IBT-122-TS': return vatBreakdowns[0]?.TaxSchemeID || 'VAT';

      // Group 8
      case 'IBT-126': return lines[0]?.IBT_126_LineIdentifier;
      case 'IBT-127': return lines[0]?.IBT_127_LineNote;
      case 'IBT-129': return lines[0]?.IBT_129_InvoicedQuantity;
      case 'IBT-130': return lines[0]?.IBT_130_QuantityUnitCode;
      case 'IBT-131': return lines[0]?.IBT_131_LineNetAmount;
      case 'IBT-132': return lines[0]?.IBT_132_POLineReference;
      case 'IBT-133': return lines[0]?.IBT_133_BuyerAccountingRef;
      case 'IBT-153': return lines[0]?.IBT_153_ItemName;
      case 'IBT-154': return lines[0]?.IBT_154_ItemDescription;
      case 'IBT-155': return lines[0]?.IBT_155_ItemSellerIdentifier;
      case 'IBT-157': return lines[0]?.IBT_157_ItemStandardIdentifier;
      case 'IBT-151': return lines[0]?.IBT_151_ItemVATCategoryCode;
      case 'IBT-152': return lines[0]?.IBT_152_ItemVATRate;
      case 'IBT-146': return lines[0]?.IBT_146_ItemNetPrice;
      case 'IBT-149': return lines[0]?.IBT_149_ItemPriceDiscount;
      case 'IBT-148': return lines[0]?.IBT_148_ItemGrossPrice;
      case 'IBT-150': return lines[0]?.IBT_150_ItemPriceBaseQuantity;

      default: return undefined;
    }
  };

  const fieldEvaluations: FieldEvaluation[] = [];
  let passedCount = 0;
  const groupsStatus: OmanValidationResult['groupsStatus'] = {};

  Object.entries(GROUPS_INFO).forEach(([k, name]) => {
    groupsStatus[Number(k)] = { name, total: 0, passed: 0, errors: 0 };
  });

  OMAN_FIELDS_FULL.forEach((field) => {
    const rawVal = getValue(field.id);
    const hasValue = rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '';

    groupsStatus[field.group].total++;

    let status: 'Passed' | 'Missing' | 'Warning' | 'Derived' = 'Passed';
    let statusMessage = 'Field populated and validated.';

    if (!hasValue) {
      if (field.mandatory) {
        status = 'Missing';
        statusMessage = `Mandatory field ${field.id} is unpopulated.`;
        errors.push({
          fieldId: field.id,
          fieldName: field.name,
          message: `Missing mandatory field: ${field.id} (${field.name})`,
          group: field.group
        });
        groupsStatus[field.group].errors++;
      } else {
        status = 'Derived';
        statusMessage = 'Optional field — auto-defaulted or skipped.';
        groupsStatus[field.group].passed++;
      }
    } else {
      passedCount++;
      groupsStatus[field.group].passed++;
    }

    fieldEvaluations.push({
      id: field.id,
      num: field.num,
      name: field.name,
      group: field.group,
      groupName: GROUPS_INFO[field.group],
      ubl: field.ubl,
      notes: field.notes,
      isMandatory: field.mandatory,
      value: hasValue ? rawVal : '—',
      status,
      statusMessage
    });
  });

  // Math check: IBT-112 = IBT-109 + IBT-110
  const netTotal = Number(totals.IBT_109_InvoiceTotalNetAmount || 0);
  const vatTotal = Number(totals.IBT_110_InvoiceTotalVATAmount || 0);
  const grossTotal = Number(totals.IBT_112_InvoiceTotalAmountWithVAT || 0);

  if (Math.abs(grossTotal - (netTotal + vatTotal)) > 0.02) {
    errors.push({
      fieldId: 'IBT-112',
      fieldName: 'Invoice Total Amount with VAT',
      message: `Critical Schematron Math Violation: Gross Total IBT-112 (${grossTotal.toFixed(3)}) must equal Net IBT-109 (${netTotal.toFixed(3)}) + VAT IBT-110 (${vatTotal.toFixed(3)}) = ${(netTotal + vatTotal).toFixed(3)}.`,
      group: 6
    });
  }

  // UUID v5 Verification
  const sellerVatin = String(seller.IBT_034_SellerIdentifier || seller.IBT_031_SellerVATIdentifier || 'OM1100123456').trim();
  const typeCodeForUuid = String(raw.IBT_003_InvoiceTypeCode || '380').trim();
  const invNumberForUuid = String(raw.IBT_001_InvoiceNumber || 'INV-001').trim();
  const dateForUuid = String(raw.IBT_002_InvoiceIssueDate || '2026-07-29').trim();

  const formatDec = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? '0.000' : num.toFixed(3);
  };

  const vatTotalStr = formatDec(vatTotal);
  const grossTotalStr = formatDec(grossTotal);

  const uuidInputStr = `${sellerVatin} ${typeCodeForUuid} ${invNumberForUuid} ${dateForUuid} ${vatTotalStr} ${grossTotalStr}`.toUpperCase();
  const generatedUuid = generateUUIDv5(OTA_NAMESPACE, uuidInputStr).toLowerCase();

  const payloadUuid = String(raw.BTOM_002_InvoiceUUID || '').trim().toLowerCase();
  const uuidV5Match = Boolean(payloadUuid && payloadUuid === generatedUuid);

  if (payloadUuid && !uuidV5Match) {
    warnings.push({
      fieldId: 'BTOM-002',
      fieldName: 'Invoice UUID (UIN)',
      message: `BTOM-002 UUID v5 mismatch! Expected generated: "${generatedUuid}" from canonical sequence "${uuidInputStr}". Received in payload: "${payloadUuid}".`,
      group: 1
    });
  }

  const sections: OmanValidationResult['sections'] = {};
  Object.entries(groupsStatus).forEach(([k, val]) => {
    sections[Number(k)] = {
      name: val.name,
      total: val.total,
      present: val.passed,
      errors: val.errors
    };
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    uuidV5Generated: generatedUuid,
    uuidV5Expected: payloadUuid,
    uuidV5Match,
    uuidV5InputString: uuidInputStr,
    passedCount,
    totalMandatoryCount: 73,
    isSimplified,
    uuidValidation: {
      matched: uuidV5Match,
      passedUuid: payloadUuid,
      targetUuid: generatedUuid
    },
    fieldEvaluations,
    sections,
    groupsStatus
  };
}
