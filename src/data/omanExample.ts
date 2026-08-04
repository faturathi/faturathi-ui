export const OMAN_PINT_EXAMPLE_JSON = {
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
    "IBT_034_1_SellerElectronicAddressScheme": "0248"
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
    "IBT_049_BuyerElectronicAddress": "OM1100432576"
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
      "IBT_153_ItemName": "Premium e-Invoicing Connector Integration",
      "IBT_151_ItemVATCategoryCode": "S",
      "IBT_152_ItemVATRate": 5.00,
      "IBT_146_ItemNetPrice": 100.00,
      "IBT_150_ItemPriceBaseQuantity": 1
    }
  ]
};
