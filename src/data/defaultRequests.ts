import { parseAndValidateInvoice, UnifiedInvoice } from '../lib/invoiceParser';

export interface RecordedApiRequest {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  headers: Record<string, string>;
  rawBody: any;
  parsed: UnifiedInvoice;
}

// Generate pre-seeded API requests with mock metadata and parsed invoice contents
export const defaultRequests: RecordedApiRequest[] = [
  {
    id: "req_tally_01",
    timestamp: "2026-07-12T01:30:15.000Z",
    method: "POST",
    path: "/api/receive",
    ip: "103.54.12.88",
    headers: {
      "host": "api-invoice-visualizer.run.app",
      "user-agent": "Tally.Developer9/2.4.0-tallynet",
      "content-type": "application/json",
      "accept": "application/json",
      "x-tenant-id": "tally-prod-mumbai-04"
    },
    rawBody: {
      "VoucherNumber": "TL-2026-0042",
      "VoucherDate": "2026-07-11",
      "PartyName": "Global Technologies Ltd",
      "LedgerName": "Sales Account",
      "InventoryEntriesList": [
        {
          "ItemName": "Dell Latitude 5420 Laptop",
          "BilledQuantity": "2 Nos",
          "Rate": "65000.00 INR/Nos",
          "Amount": "130000.00"
        },
        {
          "ItemName": "Logitech Wireless Mouse M331",
          "BilledQuantity": "5 Nos",
          "Rate": "1200.00 INR/Nos",
          "Amount": "6000.00"
        }
      ],
      "StatutoryDetails": {
        "CGST": "12240.00",
        "SGST": "12240.00"
      },
      "TotalAmount": "160480.00"
    },
    get parsed() {
      return parseAndValidateInvoice(this.rawBody);
    }
  },
  {
    id: "req_zooboo_02",
    timestamp: "2026-07-12T01:15:44.000Z",
    method: "POST",
    path: "/api/receive",
    ip: "49.206.112.5",
    headers: {
      "host": "api-invoice-visualizer.run.app",
      "user-agent": "ZooBoo-Webhooks/v1.0",
      "content-type": "application/json",
      "authorization": "Bearer zb_live_token_71f82b8a"
    },
    rawBody: {
      "billId": "ZB-99812",
      "billDate": "2026-07-12T10:30:00Z",
      "clientDetails": {
        "name": "Jane Watson",
        "phone": "+91 98765 43210",
        "email": "jane@example.com"
      },
      "itemsList": [
        {
          "title": "Gourmet Coffee Beans 500g",
          "qty": 3,
          "unitPrice": 450,
          "totalPrice": 1350
        },
        {
          "title": "Chocolates Gift Box Medium",
          "qty": 1,
          "unitPrice": 850,
          "totalPrice": 850
        }
      ],
      "taxRate": 18,
      "taxAmount": 396,
      "grossTotal": 2596
    },
    get parsed() {
      return parseAndValidateInvoice(this.rawBody);
    }
  },
  {
    id: "req_custom_03",
    timestamp: "2026-07-12T00:45:10.000Z",
    method: "POST",
    path: "/api/receive",
    ip: "157.34.88.204",
    headers: {
      "host": "api-invoice-visualizer.run.app",
      "user-agent": "Custom-Billing-ERP/v4.2.1",
      "content-type": "application/json"
    },
    rawBody: {
      "invoiceNumber": "INV/2026/089",
      "date": "12-07-2026",
      "customerName": "Robert Downey Jr.",
      "items": [
        {
          "name": "Arclight Reactor Core v2",
          "quantity": 1,
          "price": 250000,
          "total": 250000
        }
      ],
      "tax": 45000,
      "grandTotal": 294990 // Added a minor 10 INR roundoff difference to test warning state
    },
    get parsed() {
      return parseAndValidateInvoice(this.rawBody);
    }
  },
  {
    id: "req_invalid_04",
    timestamp: "2026-07-11T23:55:00.000Z",
    method: "POST",
    path: "/api/receive",
    ip: "185.190.140.12",
    headers: {
      "host": "api-invoice-visualizer.run.app",
      "user-agent": "curl/7.81.0",
      "content-type": "application/json"
    },
    rawBody: {
      "date": "2026-07-11",
      "customerName": "Srinivasa Ramanujan",
      "items": [
        {
          "name": "Infinite Series Analytical Notebook",
          "quantity": 1,
          "price": 0, // Invalid Price
          "total": 0
        }
      ],
      "total": 0 // Missing Invoice Number and total is 0
    },
    get parsed() {
      return parseAndValidateInvoice(this.rawBody);
    }
  }
];
