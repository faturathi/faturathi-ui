import React, { useState } from 'react';
import { Terminal, Copy, Check, Code, Settings, Link as LinkIcon } from 'lucide-react';

interface EndpointDocsProps {
  apiEndpoint: string;
}

export default function EndpointDocs({ apiEndpoint }: EndpointDocsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const curlSnippet = `curl -X POST "${apiEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "VoucherNumber": "TALLY-9988",
    "VoucherDate": "2026-07-12",
    "PartyName": "Acme Industrial Supplies Ltd",
    "InventoryEntriesList": [
      {
        "ItemName": "Premium CNC Drill Bit set",
        "BilledQuantity": "3 Nos",
        "Rate": "14500.00 INR/Nos",
        "Amount": "43500.00"
      }
    ],
    "StatutoryDetails": {
      "CGST": "3915.00",
      "SGST": "3915.00"
    },
    "TotalAmount": "51330.00"
  }'`;

  const pythonSnippet = `import requests

url = "${apiEndpoint}"
headers = {"Content-Type": "application/json"}

# ZooBoo format payload example
payload = {
    "billId": "ZB-40122",
    "billDate": "2026-07-12",
    "clientDetails": {
        "name": "Sarah Jenkins",
        "phone": "+91 91111 22222"
    },
    "itemsList": [
        {
            "title": "Double Espresso Roast Blend",
            "qty": 5,
            "unitPrice": 380,
            "totalPrice": 1900
        }
    ],
    "taxAmount": 342,
    "grossTotal": 2242
}

response = requests.post(url, json=payload, headers=headers)
print("Response:", response.status_code, response.json())`;

  const jsSnippet = `// Node.js or Browser Fetch
const url = "${apiEndpoint}";

const payload = {
  invoiceNumber: "INV-2026-X8",
  date: "2026-07-12",
  customerName: "Alex Mercer",
  items: [
    { name: "Superfluid Cooling Gel", quantity: 2, price: 1200, total: 2400 },
    { name: "Synthetic Graphene Core", quantity: 1, price: 5000, total: 5000 }
  ],
  tax: 1332,
  total: 8732
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log('Parsed result:', data))
.catch(err => console.error('Error:', err));`;

  const omanEndpoint = apiEndpoint.replace('/api/receive', '/api/validate-oman');
  const omanCurlSnippet = `curl -X POST "${omanEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "BTOM_001_OmanTransactionType": "10000000000000000000",
    "BTOM_002_InvoiceUUID": "0e0f4ccc-b3b2-5a91-9849-8309dcedd46e",
    "IBT_001_InvoiceNumber": "INV-2026-001",
    "IBT_002_InvoiceIssueDate": "2026-07-12",
    "IBT_168_InvoiceIssueTime": "12:30:00",
    "IBT_003_InvoiceTypeCode": "380",
    "IBT_024_SpecificationIdentifier": "urn:peppol:pint:billing-1@om-1",
    "IBT_023_BusinessProcessType": "urn:peppol:bis:billing",
    "IBT_005_InvoiceCurrencyCode": "OMR",
    "IBT_006_VATAccountingCurrency": "OMR",
    "SellerDetails": {
      "IBT_027_SellerName": "Netbue LLC",
      "IBT_034_SellerIdentifier": "OM1234567891",
      "IBT_034_1_SellerIdentifierScheme": "0248",
      "IBT_031_SellerVATIdentifier": "OM1234567891",
      "IBT_031_1_SellerVATScheme": "VAT",
      "IBT_035_SellerAddressLine1": "Ruwi Street 12",
      "IBT_037_SellerCity": "Muscat",
      "IBT_038_SellerPostCode": "112",
      "IBT_040_SellerCountryCode": "OM"
    },
    "BuyerDetails": {
      "IBT_044_BuyerName": "International Intelligence Solutions LLC",
      "IBT_049_BuyerIdentifier": "OM1100432576",
      "IBT_049_1_BuyerIdentifierScheme": "0248",
      "IBT_048_BuyerVATIdentifier": "OM1100432576",
      "IBT_048_1_BuyerVATScheme": "VAT",
      "IBT_050_BuyerAddressLine1": "Al Khuwair Street 4",
      "IBT_052_BuyerCity": "Muscat",
      "IBT_053_BuyerPostCode": "133",
      "IBT_055_BuyerCountryCode": "OM"
    },
    "Totals": {
      "IBT_106_SumLineNetAmount": 100.00,
      "IBT_110_InvoiceTotalVATAmount": 5.00,
      "IBT_112_InvoiceTotalAmountWithVAT": 105.00
    },
    "Lines": [
      {
        "IBT_126_LineIdentifier": "1",
        "IBT_129_InvoicedQuantity": 1,
        "IBT_131_LineNetAmount": 100.00,
        "IBT_153_ItemName": "Premium e-Invoicing Connector",
        "IBT_151_ItemVATCategoryCode": "S",
        "IBT_152_ItemVATRate": 5.00,
        "IBT_146_ItemNetPrice": 100.00
      }
    ]
  }'`;

  const docs = [
    { title: 'Terminal (cURL - Tally format)', code: curlSnippet, lang: 'bash' },
    { title: 'Oman PINT-OM (cURL - JSON)', code: omanCurlSnippet, lang: 'bash' },
    { title: 'Python Code (ZooBoo format)', code: pythonSnippet, lang: 'python' },
    { title: 'JavaScript / Node.js (Standard format)', code: jsSnippet, lang: 'javascript' }
  ];

  return (
    <div id="endpoint-docs-container" className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">External HTTP Webhook Endpoint</h2>
            <p className="text-sm text-slate-500">Post invoices from your scripts, terminals, or ERP routers</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
          <span className="text-xs font-mono font-medium text-slate-600">LIVE ENDPOINT ACTIVE</span>
        </div>
      </div>

      {/* Main Endpoint URL display */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono font-semibold tracking-wider text-brand-blue uppercase">POST WEBHOOK URL</span>
          <div className="flex items-center space-x-2 mt-1 bg-white border border-slate-200 px-3 py-2 rounded-lg font-mono text-xs sm:text-sm text-slate-700 overflow-x-auto select-all">
            <span className="text-brand-green font-bold">POST</span>
            <span className="text-slate-400">|</span>
            <span className="truncate">{apiEndpoint}</span>
          </div>
        </div>
        <button
          onClick={() => copyToClipboard(apiEndpoint, 99)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg transition-colors text-sm font-medium shrink-0 cursor-pointer"
        >
          {copiedIndex === 99 ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy URL</span>
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Instructions:</h3>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
          <li>Send any billing JSON file to this endpoint via <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono font-medium text-brand-blue">POST</code>.</li>
          <li>Our engine will inspect the structure, recognize its format, extract key fields, and render it in real-time in the dashboard above.</li>
          <li>We will validate essential fields like <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-brand-blue">Invoice Number</code>, <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-brand-blue">Invoice Date</code>, <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-brand-blue">Customer Name</code>, and check calculation totals.</li>
        </ul>
      </div>

      {/* Code Snippets tabs */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Code Snippets for Testing:</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {docs.map((doc, idx) => (
            <div key={idx} className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-200">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
                <span className="text-xs font-medium text-slate-400 font-mono flex items-center space-x-1.5">
                  <Code className="h-3.5 w-3.5 text-slate-500" />
                  <span>{doc.title}</span>
                </span>
                <button
                  onClick={() => copyToClipboard(doc.code, idx)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Code"
                >
                  {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <pre className="p-4 overflow-auto max-h-[220px] text-[11px] font-mono leading-relaxed text-left bg-slate-900 scrollbar-thin">
                <code>{doc.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
