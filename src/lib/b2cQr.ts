import QRCode from 'qrcode';
import { Invoice } from '../types';

function tlv(tag: number, value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > 255) throw new Error(`B2C QR tag ${tag} exceeds 255 bytes.`);
  return Uint8Array.from([tag, bytes.length, ...bytes]);
}

export async function buildB2cQrDataUrl(invoice: Invoice): Promise<string> {
  const sellerName = String(invoice.extra?.pint_om && (invoice.extra.pint_om as any).SellerDetails?.IBT_027_SellerName || 'Faturathi Supplier');
  const values = [
    '1', invoice.docTypeCode || '388', sellerName, invoice.sVat || '', invoice.d,
    invoice.t || '00:00:00', (invoice.net + invoice.vat).toFixed(3), invoice.vat.toFixed(3), invoice.uuid || ''
  ];
  const chunks = values.map((value, index) => tlv(index + 1, value));
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const payload = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => { payload.set(chunk, offset); offset += chunk.length; });
  let binary = '';
  payload.forEach((byte) => { binary += String.fromCharCode(byte); });
  return QRCode.toDataURL(btoa(binary), { errorCorrectionLevel: 'M', margin: 2, width: 240 });
}
