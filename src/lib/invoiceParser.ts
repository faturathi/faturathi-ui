/**
 * Flexible Invoice Parser and Validator
 * Maps Tally, ZooBoo, and Standard billing schemas to a unified structure
 * and performs deep field validation.
 */

import { validateOmanInvoice, OmanValidationResult } from './omanValidator';

export interface UnifiedInvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface UnifiedInvoice {
  invoiceNumber: string;
  date: string;
  customerName: string;
  items: UnifiedInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  detectedFormat: 'Tally' | 'ZooBoo' | 'Standard' | 'PINT-OM' | 'Unknown';
  validation: {
    isValid: boolean;
    status: 'success' | 'warning' | 'error';
    errors: string[];
    warnings: string[];
  };
  omanValidation?: OmanValidationResult;
}

// Helpers to parse numbers from strings safely
function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Clean and extract quantity (e.g., "5 Nos" -> 5)
function parseQuantity(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const match = String(val).match(/^[+-]?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : parseNumber(val);
}

// Perform flexible invoice parsing and validation
export function parseAndValidateInvoice(raw: any): UnifiedInvoice {
  const result: UnifiedInvoice = {
    invoiceNumber: '',
    date: '',
    customerName: '',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    currency: 'INR', // Default for Tally & Indian ERPs, can be overridden
    detectedFormat: 'Unknown',
    validation: {
      isValid: false,
      status: 'error',
      errors: [],
      warnings: []
    }
  };

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push('Payload is not a valid JSON object');
    result.validation.errors = errors;
    return result;
  }

  // 1. Detect Format
  const keys = Object.keys(raw);
  
  // Tally markers
  const hasTallyKeys = keys.includes('VoucherNumber') || keys.includes('PartyName') || keys.includes('InventoryEntriesList');
  // ZooBoo markers
  const hasZooBooKeys = keys.includes('billId') || keys.includes('clientDetails') || keys.includes('itemsList');
  // Oman PINT markers
  const hasOmanKeys = keys.includes('BTOM_001_OmanTransactionType') || keys.includes('BTOM_002_InvoiceUUID') || keys.includes('IBT_024_SpecificationIdentifier');
  // Standard markers
  const hasStandardKeys = keys.includes('invoiceNumber') || keys.includes('customerName') || keys.includes('items');

  if (hasOmanKeys) {
    result.detectedFormat = 'PINT-OM';
    
    // Parse Oman PINT-OM
    result.invoiceNumber = String(raw.IBT_001_InvoiceNumber || '').trim();
    result.date = String(raw.IBT_002_InvoiceIssueDate || '').trim();
    
    const buyer = raw.BuyerDetails || {};
    result.customerName = String(buyer.IBT_044_BuyerName || buyer.IBT_045_BuyerTradingName || '').trim();
    
    const lines = Array.isArray(raw.Lines) ? raw.Lines : [];
    result.items = lines.map((item: any, idx: number) => {
      const qty = parseNumber(item.IBT_129_InvoicedQuantity);
      const price = parseNumber(item.IBT_146_ItemNetPrice);
      const amount = item.IBT_131_LineNetAmount !== undefined ? parseNumber(item.IBT_131_LineNetAmount) : qty * price;
      return {
        name: String(item.IBT_153_ItemName || `Item ${idx + 1}`).trim(),
        quantity: qty,
        price: price,
        total: amount
      };
    });

    const totals = raw.Totals || {};
    result.tax = parseNumber(totals.IBT_110_InvoiceTotalVATAmount);
    result.total = parseNumber(totals.IBT_112_InvoiceTotalAmountWithVAT);
    result.currency = String(raw.IBT_005_InvoiceCurrencyCode || 'OMR');

    // Run Oman Specific Validator
    const omanResult = validateOmanInvoice(raw);
    result.omanValidation = omanResult;

    // Propagate Oman validation issues to root validation lists
    omanResult.errors.forEach(err => {
      errors.push(`[Oman PINT-OM Error] ${err.fieldId} (${err.fieldName}): ${err.message}`);
    });
    omanResult.warnings.forEach(warn => {
      warnings.push(`[Oman PINT-OM Warning] ${warn.fieldId} (${warn.fieldName}): ${warn.message}`);
    });

  } else if (hasTallyKeys) {
    result.detectedFormat = 'Tally';
    
    // Parse Tally
    result.invoiceNumber = String(raw.VoucherNumber || raw.VoucherNo || '').trim();
    result.date = String(raw.VoucherDate || raw.Date || '').trim();
    result.customerName = String(raw.PartyName || raw.LedgerName || '').trim();
    
    if (raw.InventoryEntriesList && Array.isArray(raw.InventoryEntriesList)) {
      result.items = raw.InventoryEntriesList.map((item: any, idx: number) => {
        const qty = parseQuantity(item.BilledQuantity || item.Quantity);
        const price = parseNumber(item.Rate);
        const amount = item.Amount ? parseNumber(item.Amount) : qty * price;
        return {
          name: String(item.ItemName || item.StockItemName || `Item ${idx + 1}`).trim(),
          quantity: qty,
          price: price,
          total: amount
        };
      });
    }

    // Taxes
    let tax = 0;
    if (raw.StatutoryDetails) {
      tax += parseNumber(raw.StatutoryDetails.CGST);
      tax += parseNumber(raw.StatutoryDetails.SGST);
      tax += parseNumber(raw.StatutoryDetails.IGST);
      tax += parseNumber(raw.StatutoryDetails.UTGST);
    }
    result.tax = tax;
    result.total = parseNumber(raw.TotalAmount || raw.Amount);
    
    // Extract currency
    if (raw.Rate && String(raw.Rate).includes('USD')) result.currency = 'USD';
    else if (raw.Rate && String(raw.Rate).includes('EUR')) result.currency = 'EUR';
    else result.currency = 'INR';

  } else if (hasZooBooKeys) {
    result.detectedFormat = 'ZooBoo';

    // Parse ZooBoo
    result.invoiceNumber = String(raw.billId || '').trim();
    result.date = String(raw.billDate || raw.date || '').trim();
    
    if (raw.clientDetails) {
      if (typeof raw.clientDetails === 'object') {
        result.customerName = String(raw.clientDetails.name || raw.clientDetails.customerName || '').trim();
      } else {
        result.customerName = String(raw.clientDetails).trim();
      }
    }

    if (raw.itemsList && Array.isArray(raw.itemsList)) {
      result.items = raw.itemsList.map((item: any, idx: number) => {
        const qty = parseNumber(item.qty || item.quantity);
        const price = parseNumber(item.unitPrice || item.price);
        const amount = item.totalPrice ? parseNumber(item.totalPrice) : qty * price;
        return {
          name: String(item.title || item.itemName || `Item ${idx + 1}`).trim(),
          quantity: qty,
          price: price,
          total: amount
        };
      });
    }

    result.tax = parseNumber(raw.taxAmount || raw.tax);
    result.total = parseNumber(raw.grossTotal || raw.totalAmount || raw.total);
    result.currency = raw.currency || 'INR';

  } else {
    // Treat as Standard or Generic fallback
    if (hasStandardKeys) {
      result.detectedFormat = 'Standard';
    } else {
      result.detectedFormat = 'Unknown';
      warnings.push('Format not recognized as Tally or ZooBoo. Attempting intelligent fallback parser.');
    }

    // Extract Invoice Number
    result.invoiceNumber = String(
      raw.invoiceNumber || raw.invoice_number || raw.invoiceNo || raw.invoiceId || raw.invNo || raw.billId || raw.billNo || raw.bill_no || raw.invoice_id || raw.VoucherNumber || ''
    ).trim();

    // Extract Date
    result.date = String(
      raw.date || raw.invoice_date || raw.invoiceDate || raw.billDate || raw.bill_date || raw.created || raw.createdAt || raw.voucherDate || ''
    ).trim();

    // Extract Customer Name
    if (raw.customerName || raw.customer_name || raw.customer || raw.client || raw.clientName || raw.client_name || raw.partyName || raw.PartyName) {
      const cust = raw.customerName || raw.customer_name || raw.customer || raw.client || raw.clientName || raw.client_name || raw.partyName || raw.PartyName;
      if (typeof cust === 'object') {
        result.customerName = String(cust.name || cust.customerName || cust.clientName || '').trim();
      } else {
        result.customerName = String(cust).trim();
      }
    }

    // Extract Items
    const rawItems = raw.items || raw.line_items || raw.lineItems || raw.itemsList || raw.InventoryEntriesList || raw.goods || [];
    if (Array.isArray(rawItems)) {
      result.items = rawItems.map((item: any, idx: number) => {
        const qty = parseQuantity(item.quantity || item.qty || item.qnt || item.BilledQuantity || 1);
        const price = parseNumber(item.price || item.rate || item.unitPrice || item.unit_price || item.Rate || 0);
        const amount = item.total || item.amount || item.totalPrice || item.Amount ? parseNumber(item.total || item.amount || item.totalPrice || item.Amount) : qty * price;
        return {
          name: String(item.name || item.title || item.description || item.itemName || item.ItemName || `Item ${idx + 1}`).trim(),
          quantity: qty,
          price: price,
          total: amount
        };
      });
    }

    // Extract Tax & Total
    result.tax = parseNumber(raw.tax || raw.taxAmount || raw.tax_amount || raw.gst || raw.gstAmount || raw.gst_amount || 0);
    result.total = parseNumber(raw.total || raw.totalAmount || raw.total_amount || raw.grandTotal || raw.grand_total || raw.grossTotal || raw.Amount || 0);
    result.currency = raw.currency || 'INR';
  }

  // 2. Perform Validation Checks
  if (result.detectedFormat !== 'PINT-OM') {
    // A. Check required metadata
    if (!result.invoiceNumber) {
      errors.push('Missing required field: Invoice Number (synonyms: invoiceNumber, billId, VoucherNumber, etc.)');
    }
    
    if (!result.date) {
      errors.push('Missing required field: Invoice Date (synonyms: date, billDate, VoucherDate, etc.)');
    }

    if (!result.customerName) {
      errors.push('Missing required field: Customer Name (synonyms: customerName, clientDetails, PartyName, etc.)');
    }

    // B. Check line items
    if (result.items.length === 0) {
      errors.push('Invoice contains zero line items');
    } else {
      result.items.forEach((item, index) => {
        if (!item.name) {
          warnings.push(`Line item #${index + 1} is missing a description or name.`);
        }
        if (item.quantity <= 0) {
          warnings.push(`Line item "${item.name || index + 1}" has a non-positive quantity (${item.quantity}).`);
        }
        if (item.price <= 0) {
          warnings.push(`Line item "${item.name || index + 1}" has a non-positive price/rate (${item.price}).`);
        }
        
        // Check if item total matches qty * price
        const expectedTotal = item.quantity * item.price;
        const difference = Math.abs(item.total - expectedTotal);
        if (difference > 1) { // allow small rounding diff
          warnings.push(`Line item "${item.name || index + 1}" math mismatch: Stated Total is ${item.total}, but calculated (Qty: ${item.quantity} * Price: ${item.price}) is ${expectedTotal.toFixed(2)}.`);
        }
      });
    }

    // C. Calculate Subtotal and Validate Grand Total math
    const itemsSum = result.items.reduce((sum, item) => sum + item.total, 0);
    result.subtotal = itemsSum;
    
    const expectedGrandTotal = itemsSum + result.tax;
    if (result.total <= 0) {
      errors.push('Invoice total amount is missing or must be greater than zero');
    } else {
      const totalDiff = Math.abs(result.total - expectedGrandTotal);
      if (totalDiff > 2) { // allowing minor floating point / round-off tolerance
        warnings.push(`Invoice total math mismatch: Stated Grand Total is ${result.total}, but sum of items + tax is ${expectedGrandTotal.toFixed(2)} (Subtotal: ${itemsSum.toFixed(2)}, Tax: ${result.tax.toFixed(2)}).`);
      }
    }
  } else {
    // Just calculate subtotal for PINT-OM
    result.subtotal = result.items.reduce((sum, item) => sum + item.total, 0);
  }

  // Compile final validation state
  result.validation.errors = errors;
  result.validation.warnings = warnings;
  
  if (errors.length === 0) {
    if (warnings.length === 0) {
      result.validation.isValid = true;
      result.validation.status = 'success';
    } else {
      result.validation.isValid = true;
      result.validation.status = 'warning';
    }
  } else {
    result.validation.isValid = false;
    result.validation.status = 'error';
  }

  return result;
}
