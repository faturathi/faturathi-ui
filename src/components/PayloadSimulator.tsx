import React, { useState, useEffect } from 'react';
import { Play, FileCode, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { ApiError, apiFetch } from '../lib/api';

interface PayloadSimulatorProps {
  onSimulateSuccess: () => void;
}

const TALLY_PRESET = {
  "VoucherNumber": "TL-2026-0045",
  "VoucherDate": "2026-07-12",
  "PartyName": "Nexus Supermarts Private Ltd",
  "LedgerName": "Direct Sales",
  "InventoryEntriesList": [
    {
      "ItemName": "Asus ROG Zephyrus G14 Gaming Laptop",
      "BilledQuantity": "1 Nos",
      "Rate": "145000.00 INR/Nos",
      "Amount": "145000.00"
    },
    {
      "ItemName": "Razer Basilisk V3 Wired Mouse",
      "BilledQuantity": "2 Nos",
      "Rate": "4500.00 INR/Nos",
      "Amount": "9000.00"
    }
  ],
  "StatutoryDetails": {
    "CGST": "13860.00",
    "SGST": "13860.00"
  },
  "TotalAmount": "181720.00"
};

const ZOOBOO_PRESET = {
  "billId": "ZB-99881",
  "billDate": "2026-07-12T11:45:00Z",
  "clientDetails": {
    "name": "Dr. Angela Zeigler",
    "phone": "+91 94444 88888",
    "email": "angela@overwatch.org"
  },
  "itemsList": [
    {
      "title": "Gluten-Free Almond Croissant",
      "qty": 4,
      "unitPrice": 180,
      "totalPrice": 720
    },
    {
      "title": "Organic Matcha Green Tea Latte",
      "qty": 2,
      "unitPrice": 220,
      "totalPrice": 440
    }
  ],
  "taxRate": 5,
  "taxAmount": 58,
  "grossTotal": 1218
};

const STANDARD_PRESET = {
  "invoiceNumber": "INV-2026-1024",
  "date": "2026-07-12",
  "customerName": "Steve Rogers",
  "items": [
    {
      "name": "Vibranium Shield Polish Service",
      "quantity": 1,
      "price": 12000,
      "total": 12000
    },
    {
      "name": "Heavy Duty Leather Strap Replacement",
      "quantity": 2,
      "price": 450,
      "total": 900
    }
  ],
  "tax": 2322,
  "total": 15222
};

const MATH_WARNING_PRESET = {
  "invoiceNumber": "ERR-MATH-09",
  "date": "2026-07-12",
  "customerName": "Bruce Wayne",
  "items": [
    {
      "name": "Tactical Kevlar Batsuit V3",
      "quantity": 1,
      "price": 75000,
      "total": 75000
    },
    {
      "name": "Titanium Utility Belt Clasp",
      "quantity": 1,
      "price": 1500,
      "total": 1500
    }
  ],
  "tax": 13770, // Total should be 75000 + 1500 + 13770 = 90270
  "total": 120000 // Warning: This declared total is way off the item math!
};

const ERROR_FIELD_PRESET = {
  "date": "2026-07-12",
  "items": [
    {
      "name": "Generic Unbranded Voucher Item",
      "quantity": 5,
      "price": 100,
      "total": 500
    }
  ],
  "total": 500
  // Missing required invoiceNumber and customerName!
};

const OMAN_PINT_VALID_PRESET = {
  "BTOM_001_OmanTransactionType": "10000000000000000000",
  "BTOM_002_InvoiceUUID": "0e0f4ccc-b3b2-5a91-9849-8309dcedd46e",
  "IBT_001_InvoiceNumber": "INV-2026-001",
  "IBT_002_InvoiceIssueDate": "2026-07-12",
  "IBT_168_InvoiceIssueTime": "12:30:00",
  "IBT_003_InvoiceTypeCode": "380",
  "IBT_024_SpecificationIdentifier": "urn:peppol:pint:billing-1@om-1",
  "IBT_023_BusinessProcessType": "urn:peppol:bis:billing",
  "IBT_007_TaxPointDate": "2026-07-12",
  "IBT_005_InvoiceCurrencyCode": "OMR",
  "IBT_006_VATAccountingCurrency": "OMR",
  "SellerDetails": {
    "IBT_027_SellerName": "Netbue LLC",
    "IBT_034_SellerIdentifier": "OM1234567891",
    "IBT_034_1_SellerIdentifierScheme": "0248",
    "IBT_031_SellerVATIdentifier": "OM1234567891",
    "IBT_031_1_SellerVATScheme": "VAT",
    "IBT_028_SellerTradingName": "Netbue LLC",
    "IBT_035_SellerAddressLine1": "Ruwi Street 12",
    "IBT_037_SellerCity": "Muscat",
    "IBT_038_SellerPostCode": "112",
    "IBT_040_SellerCountryCode": "OM",
    "IBT_034_SellerElectronicAddress": "OM1234567891",
    "IBT_034_1_SellerElectronicAddressScheme": "0248",
    "IBT_036_SellerAddressLine2": "Way 3421",
    "IBT_162_SellerAddressLine3": "Office 4B",
    "IBT_042_SellerTelephone": "+96899999999"
  },
  "BuyerDetails": {
    "IBT_044_BuyerName": "International Intelligence Solutions LLC",
    "IBT_049_BuyerIdentifier": "OM1100432576",
    "IBT_049_1_BuyerIdentifierScheme": "0248",
    "IBT_048_BuyerVATIdentifier": "OM1100432576",
    "IBT_048_1_BuyerVATScheme": "VAT",
    "IBT_045_BuyerTradingName": "IIS LLC",
    "IBT_050_BuyerAddressLine1": "Al Khuwair Street 4",
    "IBT_052_BuyerCity": "Muscat",
    "IBT_053_BuyerPostCode": "133",
    "IBT_055_BuyerCountryCode": "OM",
    "IBT_049_BuyerElectronicAddress": "OM1100432576",
    "IBT_051_BuyerAddressLine2": "Way 2133",
    "IBT_163_BuyerAddressLine3": "Building 5",
    "IBT_150_BuyerCountrySubdivision": "Muscat Governorate",
    "IBT_152_BuyerSpecialZoneLicense": "SZ-9988"
  },
  "PaymentDetails": {
    "IBT_081_PaymentMeansCode": "30",
    "IBT_084_PaymentAccountIdentifier": "OM730000001100432576001",
    "IBT_009_PaymentDueDate": "2026-08-12",
    "IBT_020_PaymentTermsNote": "Payable within 30 days of invoice date"
  },
  "Totals": {
    "IBT_106_SumLineNetAmount": 100.00,
    "IBT_107_SumAllowances": 0.00,
    "IBT_108_SumCharges": 0.00,
    "IBT_109_InvoiceTotalNetAmount": 100.00,
    "IBT_110_InvoiceTotalVATAmount": 5.00,
    "IBT_111_VATAmountAccountingCurrency": 5.00,
    "IBT_112_InvoiceTotalAmountWithVAT": 105.00,
    "IBT_115_AmountDuePayment": 105.00
  },
  "VATBreakdown": [
    {
      "IBT_116_TaxableAmount": 100.00,
      "IBT_117_TaxAmount": 5.00,
      "IBT_118_CategoryCode": "S",
      "IBT_119_Rate": 5.00,
      "TaxSchemeID": "VAT"
    }
  ],
  "Lines": [
    {
      "IBT_126_LineIdentifier": "1",
      "IBT_127_LineNote": "Technical consulting service",
      "IBT_129_InvoicedQuantity": 1,
      "IBT_130_QuantityUnitCode": "EA",
      "IBT_131_LineNetAmount": 100.00,
      "IBT_132_POLineReference": "PO-100-1",
      "IBT_133_BuyerAccountingRef": "CC-901",
      "IBT_153_ItemName": "Premium e-Invoicing Connector Integration",
      "IBT_154_ItemDescription": "Integration of billing system with OTA Fawtara testbed",
      "IBT_155_ItemSellerIdentifier": "SKU-NET-991",
      "IBT_157_ItemStandardIdentifier": "0160:1234567890123",
      "IBT_151_ItemVATCategoryCode": "S",
      "IBT_152_ItemVATRate": 5.00,
      "IBT_146_ItemNetPrice": 100.00,
      "IBT_149_ItemPriceDiscount": 0.00,
      "IBT_148_ItemGrossPrice": 100.00,
      "IBT_150_ItemPriceBaseQuantity": 1
    }
  ]
};

const OMAN_PINT_INVALID_PRESET = {
  "BTOM_001_OmanTransactionType": "10000000000000000000",
  "BTOM_002_InvoiceUUID": "INVALID-UUID-V5-HASH",
  "IBT_001_InvoiceNumber": "INV-2026-OM-ERR",
  "IBT_002_InvoiceIssueDate": "2026/07/12",
  "IBT_168_InvoiceIssueTime": "12:30",
  "IBT_003_InvoiceTypeCode": "380",
  "IBT_024_SpecificationIdentifier": "urn:peppol:pint:billing-1@om-1",
  "IBT_023_BusinessProcessType": "urn:peppol:bis:billing",
  "IBT_005_InvoiceCurrencyCode": "OMR",
  "IBT_006_VATAccountingCurrency": "OMR",
  "SellerDetails": {
    "IBT_027_SellerName": "",
    "IBT_034_SellerIdentifier": "WRONG-VATIN",
    "IBT_034_1_SellerIdentifierScheme": "0248",
    "IBT_035_SellerAddressLine1": "Ruwi Street 12",
    "IBT_037_SellerCity": "Muscat",
    "IBT_038_SellerPostCode": "112",
    "IBT_040_SellerCountryCode": "OM"
  },
  "BuyerDetails": {
    "IBT_044_BuyerName": "International Intelligence Solutions LLC"
  },
  "Totals": {
    "IBT_106_SumLineNetAmount": 100.00,
    "IBT_110_InvoiceTotalVATAmount": 5.00,
    "IBT_112_InvoiceTotalAmountWithVAT": 120.00
  }
};

const MALFORMED_JSON_PRESET = `{
  "invoiceNumber": "MALFORMED-JSON-99",
  "date": "2026-07-12",
  "customerName": "Incomplete Payload",
  "items": [
    { "name": "Broken Line", "quantity": 10, "price": 150, "total": 1500 }
  ],
  "tax": 270,
  "total": 1770
  // Oops! Unclosed brackets or commas trigger severe parser failure on server
`;

export default function PayloadSimulator({ onSimulateSuccess }: PayloadSimulatorProps) {
  const [activePreset, setActivePreset] = useState<string>('tally');
  const [jsonText, setJsonText] = useState<string>('');
  const [isValidJson, setIsValidJson] = useState<boolean>(true);
  const [jsonErrorMsg, setJsonErrorMsg] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  const loadPreset = (presetName: string) => {
    setActivePreset(presetName);
    setSendResult({ status: 'idle', message: '' });
    
    let content: any = '';
    switch (presetName) {
      case 'tally':
        content = JSON.stringify(TALLY_PRESET, null, 2);
        break;
      case 'zooboo':
        content = JSON.stringify(ZOOBOO_PRESET, null, 2);
        break;
      case 'standard':
        content = JSON.stringify(STANDARD_PRESET, null, 2);
        break;
      case 'warning':
        content = JSON.stringify(MATH_WARNING_PRESET, null, 2);
        break;
      case 'error':
        content = JSON.stringify(ERROR_FIELD_PRESET, null, 2);
        break;
      case 'oman_valid':
        content = JSON.stringify(OMAN_PINT_VALID_PRESET, null, 2);
        break;
      case 'oman_invalid':
        content = JSON.stringify(OMAN_PINT_INVALID_PRESET, null, 2);
        break;
      case 'malformed':
        content = MALFORMED_JSON_PRESET;
        break;
    }
    setJsonText(content);
  };

  // Load default tally preset on mount
  useEffect(() => {
    loadPreset('tally');
  }, []);

  // Validate JSON locally on change
  const handleTextChange = (text: string) => {
    setJsonText(text);
    try {
      if (activePreset === 'malformed') {
        // Known malformed string, bypass or show error
        JSON.parse(text);
      } else {
        JSON.parse(text);
      }
      setIsValidJson(true);
      setJsonErrorMsg('');
    } catch (e: any) {
      setIsValidJson(false);
      setJsonErrorMsg(e.message);
    }
  };

  const handleSendRequest = async () => {
    setIsSending(true);
    setSendResult({ status: 'idle', message: '' });

    let finalPayload: any = jsonText;
    
    // For normal JSON presets, send as object. For malformed, send raw text to test parser robust error capture
    if (activePreset !== 'malformed') {
      try {
        finalPayload = JSON.parse(jsonText);
      } catch (err) {
        // Keep as string if parsing failed
      }
    }

    try {
      const isOman = activePreset === 'oman_valid' || activePreset === 'oman_invalid';
      const endpoint = isOman ? '/api/validate-oman' : '/api/simulate';

      if (!isOman) throw new Error('Only Oman PINT-OM validation is supported by the connected backend.');
      const resData = await apiFetch<any>(endpoint, { method: 'POST', body: jsonText });
      
      if (resData.isValid || resData.status === 'success') {
        setSendResult({
          status: 'success',
          message: isOman 
            ? 'Oman PINT-OM payload processed and saved!' 
            : 'Simulated request added to Visualizer!'
        });
        onSimulateSuccess();
      } else {
        setSendResult({
          status: 'error',
          message: resData.message || 'Simulation completed but returned validation warnings/errors.'
        });
        // Still trigger reload since the server *does* record failing requests!
        onSimulateSuccess();
      }
    } catch (error: any) {
      const payload = error instanceof ApiError ? error.payload as any : null;
      setSendResult({
        status: 'error',
        message: payload?.message || `HTTP POST Failed: ${error.message}`
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="payload-simulator-container" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-brand-blue/10 text-brand-blue rounded-md">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Interactive API Simulator</h3>
            <p className="text-[11px] text-slate-500">Inject test payloads instantly from your browser</p>
          </div>
        </div>
        <button
          onClick={() => loadPreset(activePreset)}
          className="text-xs text-slate-500 hover:text-brand-blue transition-colors flex items-center space-x-1 cursor-pointer"
          title="Reset current preset"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col space-y-4">
        {/* Preset Selector */}
        <div>
          <span className="block text-xs font-semibold text-slate-600 mb-2">CHOOSE SAMPLE PRESET:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => loadPreset('tally')}
              className={`text-[11px] px-2 py-1.5 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                activePreset === 'tally'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tally (Valid)
            </button>
            <button
              onClick={() => loadPreset('zooboo')}
              className={`text-[11px] px-2 py-1.5 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                activePreset === 'zooboo'
                  ? 'bg-purple-50 border-purple-200 text-purple-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              ZooBoo (Valid)
            </button>
            <button
              onClick={() => loadPreset('standard')}
              className={`text-[11px] px-2 py-1.5 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                activePreset === 'standard'
                  ? 'bg-teal-50 border-teal-200 text-teal-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Standard (Valid)
            </button>
            <button
              onClick={() => loadPreset('warning')}
              className={`text-[11px] px-2 py-1.5 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                activePreset === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Math Error
            </button>
            <button
              onClick={() => loadPreset('error')}
              className={`text-[11px] px-2 py-1.5 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                activePreset === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Missing Fields
            </button>
            <button
              onClick={() => loadPreset('malformed')}
              className={`text-[11px] px-2 py-1.5 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                activePreset === 'malformed'
                  ? 'bg-slate-100 border-slate-300 text-slate-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Syntax Error
            </button>
            <button
              onClick={() => loadPreset('oman_valid')}
              className={`text-[11px] px-2 py-1.5 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                activePreset === 'oman_valid'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Oman PINT (Valid)
            </button>
            <button
              onClick={() => loadPreset('oman_invalid')}
              className={`text-[11px] px-2 py-1.5 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                activePreset === 'oman_invalid'
                  ? 'bg-red-50 border-red-200 text-red-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Oman PINT (Bad)
            </button>
          </div>
        </div>

        {/* Live Code Editor */}
        <div className="flex-1 flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
              <FileCode className="h-3.5 w-3.5" />
              <span>EDIT PAYLOAD JSON:</span>
            </span>
            
            {/* Syntax Validation Label */}
            {isValidJson ? (
              <span className="text-[10px] font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20 px-1.5 py-0.5 rounded">
                Valid JSON Structure
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">
                Syntax Error
              </span>
            )}
          </div>

          <div className="relative flex-1 flex flex-col">
            <textarea
              id="raw-json-textarea"
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              className={`w-full flex-1 p-3 font-mono text-[11px] bg-slate-900 text-slate-100 border rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none overflow-y-auto ${
                isValidJson ? 'border-slate-800' : 'border-red-500'
              }`}
              spellCheck={false}
            />
          </div>
          
          {!isValidJson && jsonErrorMsg && (
            <div className="text-[10px] text-red-600 font-mono mt-1 text-left">
              {jsonErrorMsg}
            </div>
          )}
        </div>

        {/* Simulation Feedback */}
        {sendResult.status !== 'idle' && (
          <div className={`p-3 rounded-lg border text-xs flex items-start space-x-2 text-left ${
            sendResult.status === 'success' 
              ? 'bg-brand-green/5 border-brand-green/20 text-brand-green' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {sendResult.status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{sendResult.message}</span>
          </div>
        )}

        {/* Trigger Button */}
        <button
          onClick={handleSendRequest}
          disabled={isSending}
          className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-xs font-semibold tracking-wider transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {isSending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>TRANSMITTING PAYLOAD...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>SEND SIMULATED HTTP POST</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
