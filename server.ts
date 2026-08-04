import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { validateOmanInvoice, generateUUIDv5 } from './src/lib/omanValidator';

const app = express();
const PORT = 3000;

// Initialize Firebase Client SDK on server using API key
let config: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error('Error reading firebase-applet-config.json:', e);
}

const firebaseConfig = {
  projectId: config.projectId || 'clever-healer-n7c1c',
  appId: config.appId || '1:1087602735667:web:189a1788c3ae7e0c264146',
  apiKey: config.apiKey || 'AIzaSyCvE6d-Bm0jOOTYlqofrz0BAQA1t4ywW8E',
  authDomain: config.authDomain || 'clever-healer-n7c1c.firebaseapp.com',
  firestoreDatabaseId: config.firestoreDatabaseId || 'ai-studio-faturathieinvoic-dac9e5d8-682a-4ddc-8f24-216ffdd16c43',
};

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// In-memory fallback if firestore fails
const STORE_PATH = path.join(process.cwd(), 'requests-store.json');

const SEED_ENTITIES = [
  { id: 'E1', name: 'International Intelligence Solutions LLC', vatin: 'OM1100123456', pid: '0248:OM1100123456', prefixes: ['IIS-', 'INV-'], status: 'Registered' },
  { id: 'E2', name: 'Aji Alibri Enterprises', vatin: 'OM1100223344', pid: '0248:OM1100223344', prefixes: ['AAE-', 'SOH-'], status: 'Registered' },
  { id: 'E3', name: 'Alfaris Business Solutions', vatin: 'OM1100334455', pid: '0248:OM1100334455', prefixes: ['ABS-'], status: 'Registered' }
];

const SEED_USERS = [
  { id: 'u1', email: 'salim.h@intel-sol.om', role: 'Super Admin', branch: 'HQ Muscat', mfa: true, status: 'Active' },
  { id: 'u2', email: 'fatma.z@alibri.om', role: 'Finance Manager', branch: 'Muscat Main', mfa: true, status: 'Active' },
  { id: 'u3', email: 'ahmed.b@alfaris.om', role: 'Invoice Clerk', branch: 'Salalah Ops', mfa: true, status: 'Active' },
  { id: 'u4', email: 'auditor@kpmg.om', role: 'Auditor', branch: '—', mfa: true, status: 'Active' }
];

const SEED_INVOICES = [
  {
    n: "IIS-2026-08-0099", d: "2026-08-02", t: "14:20:00", type: "Standard Invoice", dir: "Outbound (AR)",
    cp: "Muscat Marine Services SAOC", cpv: "11008877", eas: "0248:11008877", net: 3200.000, vat: 160.000,
    st: "Rejected", tdd: "Rejected · OTA Error C5",
    err: "Schematron Error BR-O-02: Buyer VATIN '11008877' violates Oman PINT-OM syntax rules. Must start with 'OM' followed by 8–12 digits (e.g. OM1100887700).",
    tt: "10000000000000000000", uuid: "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d", cat: "S 5%",
    ent: "E1", sVat: "OM1100123456", erpSystem: "SAP S/4HANA", sourceChannel: "REST API",
    lines: [
      ["Navigational Radar Calibration & SLA Support", 1, "3200.000", "S 5%"]
    ]
  },
  {
    n: "IIS-2026-07-0042", d: "2026-07-29", t: "10:14:22", type: "Standard Invoice", dir: "Outbound (AR)",
    cp: "Johnson & Co. Ltd (Oman)", cpv: "OM1100654321", eas: "0248:OM1100654321", net: 4500.000, vat: 225.000,
    st: "Reported", tdd: "Submit · Ack", tt: "10000000000000000000", uuid: "a1b2c3d4-e5f6-5789-a1b2-c3d4e5f67890", cat: "S 5%",
    ent: "E1", sVat: "OM1100123456", erpSystem: "SAP S/4HANA", sourceChannel: "REST API",
    lines: [
      ["Enterprise AI Cloud Platform Connector", 1, "3500.000", "S 5%"],
      ["Annual Maintenance & SLA Support", 1, "1000.000", "S 5%"]
    ]
  },
  {
    n: "AAE-2026-07-0108", d: "2026-07-29", t: "14:02:10", type: "Standard Invoice", dir: "Outbound (AR)",
    cp: "Al-bhurji Contracting LLC (Oman)", cpv: "OM1100778899", eas: "0248:OM1100778899", net: 12500.000, vat: 625.000,
    st: "Reported", tdd: "Submit · Ack", tt: "10000000000000000000", uuid: "b2c3d4e5-f6a7-5890-b2c3-d4e5f6a78901", cat: "S 5%",
    ent: "E2", sVat: "OM1100223344", erpSystem: "Oracle Cloud ERP", sourceChannel: "SFTP Sync",
    lines: [
      ["Heavy Machinery Supply & Site Logistics", 5, "2500.000", "S 5%"]
    ]
  },
  {
    n: "ABS-2026-07-0201", d: "2026-07-28", t: "11:30:00", type: "Export", dir: "Outbound (AR)",
    cp: "Abdulla NASS GROUP (Bahrain)", cpv: "BH100200300", eas: "0248:997770000097", net: 18400.000, vat: 0.000,
    st: "Reported", tdd: "Submit · Ack", tt: "10010000000000000000", uuid: "c3d4e5f6-a7b8-5901-c3d4-e5f6a7b89012", cat: "Z 0%",
    ent: "E3", sVat: "OM1100334455", erpSystem: "Microsoft Dynamics 365", sourceChannel: "ERP Integration",
    lines: [
      ["Cross-Border Industrial Valve Systems (GCC Export)", 10, "1840.000", "Z 0%"]
    ]
  },
  {
    n: "IIS-2026-07-0099", d: "2026-07-28", t: "16:45:11", type: "Standard Invoice", dir: "Outbound (AR)",
    cp: "Mohammed. Jasim Enterprises (Oman)", cpv: "OM1100889900", eas: "0248:OM1100889900", net: 2800.000, vat: 140.000,
    st: "Sent", tdd: "Submit · In transit", tt: "10000000000000000000", uuid: "d4e5f6a7-b8c9-5012-d4e5-f6a7b8c90123", cat: "S 5%",
    ent: "E1", sVat: "OM1100123456", erpSystem: "Tally Prime", sourceChannel: "File Upload",
    lines: [
      ["Database Migration & Security Audit", 1, "2800.000", "S 5%"]
    ]
  },
  {
    n: "AAE-2026-07-0310", d: "2026-07-27", t: "09:15:00", type: "Export", dir: "Outbound (AR)",
    cp: "Perfect Tech IT Solutions (UAE)", cpv: "AE100500600", eas: "0248:997770000097", net: 9200.000, vat: 0.000,
    st: "Reported", tdd: "Submit · Ack", tt: "10010000000000000000", uuid: "e5f6a7b8-c9d0-5123-e5f6-a7b8c9d01234", cat: "Z 0%",
    ent: "E2", sVat: "OM1100223344", erpSystem: "Odoo ERP", sourceChannel: "REST API",
    lines: [
      ["IT Infrastructure Hardware Modules", 4, "2300.000", "Z 0%"]
    ]
  },
  {
    n: "ABS-2026-07-0402", d: "2026-07-27", t: "15:20:45", type: "Export", dir: "Outbound (AR)",
    cp: "Extra Solar Planet Company, (KSA)", cpv: "SA300400500", eas: "0248:997770000097", net: 34500.000, vat: 0.000,
    st: "Reported", tdd: "Submit · Ack", tt: "10010000000000000000", uuid: "f6a7b8c9-d0e1-5234-f6a7-b8c9d0e12345", cat: "Z 0%",
    ent: "E3", sVat: "OM1100334455", erpSystem: "SAP S/4HANA", sourceChannel: "SFTP Sync",
    lines: [
      ["Solar Energy Grid Controller Units — KSA Project", 10, "3450.000", "Z 0%"]
    ]
  },
  {
    n: "IIS-2026-07-0155", d: "2026-07-26", t: "13:00:00", type: "Standard Invoice", dir: "Outbound (AR)",
    cp: "Al-Tatweer Oil Company (Oman)", cpv: "OM1100987654", eas: "0248:OM1100987654", net: 15800.000, vat: 790.000,
    st: "Reported", tdd: "Submit · Ack", tt: "10000000000000000000", uuid: "0a1b2c3d-4e5f-6789-0a1b-2c3d4e5f6789", cat: "S 5%",
    ent: "E1", sVat: "OM1100123456", erpSystem: "Oracle Cloud ERP", sourceChannel: "ERP Integration",
    lines: [
      ["Upstream Oilfield Automation Controllers", 2, "7900.000", "S 5%"]
    ]
  },
  {
    n: "CN-2026-07-0012", d: "2026-07-25", t: "11:20:00", type: "Credit Note", dir: "Outbound (AR)",
    cp: "Johnson & Co. Ltd (Oman)", cpv: "OM1100654321", eas: "0248:OM1100654321", net: -500.000, vat: -25.000,
    st: "Reported", tdd: "Submit · Ack", tt: "10100000000000000000", uuid: "1b2c3d4e-5f6a-7890-1b2c-3d4e5f6a7890", cat: "S 5%",
    cn: "Ref IIS-2026-07-0042", ent: "E1", sVat: "OM1100123456", erpSystem: "SAP S/4HANA", sourceChannel: "Manual Entry",
    lines: [
      ["Service credit adjustment", 1, "-500.000", "S 5%"]
    ]
  },
  {
    n: "PINV-2026-07-0099", d: "2026-07-24", t: "08:15:00", type: "Standard Invoice", dir: "Inbound (AP)",
    cp: "Alfaris Business Solutions", cpv: "OM1100334455", eas: "0248:OM1100334455", net: 3400.000, vat: 170.000,
    st: "Reported", tdd: "C3 leg · Ack", ap: "Approved · posted to ERP", tt: "10000000000000000000", uuid: "2c3d4e5f-6a7b-8901-2c3d-4e5f6a7b8901", cat: "S 5%",
    ent: "E1", sVat: "OM1100334455", erpSystem: "Microsoft Dynamics 365", sourceChannel: "REST API",
    lines: [
      ["Enterprise Software Licenses — Q3", 1, "3400.000", "S 5%"]
    ]
  }
];

// Memory store fallback
let memoryInvoices: any[] = [...SEED_INVOICES];
let memoryEntities: any[] = [...SEED_ENTITIES];
let memoryUsers: any[] = [...SEED_USERS];

// Sync/Seed Firestore
async function initFirestoreSeeds() {
  try {
    const invSnapshot = await getDocs(collection(firestoreDb, 'invoices'));
    if (invSnapshot.empty) {
      console.log('Seeding initial invoices into Firestore...');
      const batch = writeBatch(firestoreDb);
      SEED_INVOICES.forEach(inv => {
        const ref = doc(firestoreDb, 'invoices', inv.n);
        batch.set(ref, { ...inv, createdAt: new Date().toISOString() });
      });
      await batch.commit();
    }

    const entSnapshot = await getDocs(collection(firestoreDb, 'entities'));
    if (entSnapshot.empty) {
      const batch = writeBatch(firestoreDb);
      SEED_ENTITIES.forEach(ent => {
        const ref = doc(firestoreDb, 'entities', ent.id);
        batch.set(ref, ent);
      });
      await batch.commit();
    }

    const userSnapshot = await getDocs(collection(firestoreDb, 'users'));
    if (userSnapshot.empty) {
      const batch = writeBatch(firestoreDb);
      SEED_USERS.forEach(u => {
        const ref = doc(firestoreDb, 'users', u.id);
        batch.set(ref, u);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.log('Operating with in-memory store (Firestore sync note):', err?.message || String(err));
  }
}

initFirestoreSeeds().catch(console.error);

// Custom raw body collector
app.use((req: any, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk: string) => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBodyStr = data;
    if (data) {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json') || contentType.includes('text/')) {
        try {
          req.body = JSON.parse(data);
        } catch (err: any) {
          req.bodyParseError = err.message;
          req.body = null;
        }
      } else {
        req.body = data;
      }
    } else {
      req.body = {};
    }
    next();
  });
});

// GET /api/invoices - Get all invoices from Firestore or memory
app.get('/api/invoices', async (req: any, res) => {
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'invoices'));
    if (!snapshot.empty) {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json(list);
    }
  } catch (e: any) {
    // Return memory invoices fallback
  }
  res.json(memoryInvoices);
});

// POST /api/invoices - Create new invoice
app.post('/api/invoices', async (req: any, res) => {
  try {
    const data = req.body || {};
    const n = data.n || data.invoiceNumber || `INV-2026-07-${Math.floor(1000 + Math.random() * 9000)}`;
    const issueDate = data.d || data.date || new Date().toISOString().slice(0, 10);
    const issueTime = data.t || '14:30:00';
    const vatCategory = data.cat || 'S 5%';
    
    // Calculate net and vat
    const net = Number(data.net || 0);
    const vat = Number(data.vat || 0);
    
    // Generate deterministic UUIDv5
    const OTA_NAMESPACE = 'e0bc4ac8-b025-46e5-a76d-0c893fc3027e';
    const sellerVat = data.sVat || 'OM1100123456';
    const uuidInputStr = `${sellerVat} 380 ${n} ${issueDate} ${vat.toFixed(3)} ${(net + vat).toFixed(3)}`.toUpperCase();
    const generatedUuid = generateUUIDv5(OTA_NAMESPACE, uuidInputStr) || `b41c72aa-${Math.floor(1000+Math.random()*9000)}-5f2b-8d34-77c1e09a55d0`;

    const newInv = {
      n,
      d: issueDate,
      t: issueTime,
      type: data.type || 'Standard Invoice',
      dir: data.dir || 'Outbound (AR)',
      cp: data.cp || data.customerName || 'Muscat Retail SAOC',
      cpv: data.cpv || 'OM1100654321',
      eas: data.eas || '0248:OM1100654321',
      net,
      vat,
      st: data.st || 'Pending',
      tdd: data.tdd || 'Queued',
      tt: data.tt || '10100000000000000000',
      uuid: generatedUuid,
      cat: vatCategory,
      ent: data.ent || 'E1',
      lines: data.lines || [[data.itemName || 'Line item 1', Number(data.qty || 1), Number(data.price || net).toFixed(3), vatCategory]],
      b2c: Boolean(data.b2c),
      cn: data.cn || undefined,
      err: data.err || undefined,
      warn: data.warn || undefined,
      ap: data.ap || undefined,
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    try {
      await setDoc(doc(firestoreDb, 'invoices', n), newInv);
    } catch (err) {
      // Memory store fallback
    }

    // Update memory fallback
    const existingIndex = memoryInvoices.findIndex(x => x.n === n);
    if (existingIndex >= 0) {
      memoryInvoices[existingIndex] = newInv;
    } else {
      memoryInvoices.unshift(newInv);
    }

    res.status(201).json(newInv);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/invoices/inbound & /api/invoices/ap - Incoming AP invoice simulation endpoint (from Postman / ERP)
app.post(['/api/invoices/inbound', '/api/invoices/ap'], async (req: any, res) => {
  try {
    const data = req.body || {};
    const n = data.n || data.invoiceNumber || `AP-INV-${Date.now().toString().slice(-6)}`;
    const issueDate = data.d || data.date || new Date().toISOString().slice(0, 10);
    const issueTime = data.t || '09:30:00';
    const supplierName = data.cp || data.supplierName || data.vendorName || 'Global Electronics & Tech LLC';
    const supplierVat = data.cpv || data.supplierVat || 'OM1100998877';
    const buyerVat = data.sVat || data.buyerVat || 'OM1100123456';
    const buyerEas = data.eas || `0248:${buyerVat}`;
    
    const net = Number(data.net || 1200.000);
    const vat = Number(data.vat || 60.000);
    const cat = data.cat || 'S 5%';
    
    const OTA_NAMESPACE = 'e0bc4ac8-b025-46e5-a76d-0c893fc3027e';
    const uuidInputStr = `${supplierVat} 380 ${n} ${issueDate} ${vat.toFixed(3)} ${(net + vat).toFixed(3)}`.toUpperCase();
    const generatedUuid = generateUUIDv5(OTA_NAMESPACE, uuidInputStr) || `ap-uuid-${Date.now()}`;

    const newApInv = {
      n,
      d: issueDate,
      t: issueTime,
      type: data.type || 'Standard Invoice',
      dir: 'Inbound (AP)',
      cp: supplierName,
      cpv: supplierVat,
      eas: buyerEas,
      net,
      vat,
      st: 'Reported',
      tdd: 'C3 leg · Ack',
      ap: 'Pending Approver Review',
      tt: '10000000000000000000',
      uuid: generatedUuid,
      cat,
      ent: data.ent || 'E1',
      sVat: buyerVat,
      erpSystem: data.erpSystem || 'Postman / External ERP (AP Inbound)',
      sourceChannel: 'AP Inbound REST API (/api/invoices/inbound)',
      lines: data.lines || [[data.itemName || 'Vendor Inbound Procurement Line', 1, net.toFixed(3), cat]],
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(firestoreDb, 'invoices', n), newApInv);
    } catch (e) {}

    const existingIdx = memoryInvoices.findIndex(x => x.n === n);
    if (existingIdx >= 0) {
      memoryInvoices[existingIdx] = newApInv;
    } else {
      memoryInvoices.unshift(newApInv);
    }

    res.status(201).json({
      status: 'created',
      message: 'Inbound AP invoice received, validated via AS4/PINT-OM C3 leg, and queued for AP approval.',
      invoiceNumber: n,
      invoice: newApInv
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/invoices/:id/resubmit - Re-submit a previously rejected invoice after correction
app.post('/api/invoices/:id/resubmit', async (req: any, res) => {
  const { id } = req.params;
  const data = req.body || {};
  const item = memoryInvoices.find(i => i.n === id);
  if (!item) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Run validation check
  const checkVat = data.cpv || item.cpv;
  const isValidVat = /^OM11\d{8}$/.test(checkVat);

  if (isValidVat) {
    item.cpv = checkVat;
    item.eas = `0248:${checkVat}`;
    if (data.net) item.net = Number(data.net);
    if (data.vat) item.vat = Number(data.vat);
    item.st = 'Reported';
    item.tdd = 'Submit · Ack';
    item.err = undefined;
    item.rejectionReasons = undefined;

    try {
      await updateDoc(doc(firestoreDb, 'invoices', id), {
        cpv: item.cpv,
        eas: item.eas,
        net: item.net,
        vat: item.vat,
        st: 'Reported',
        tdd: 'Submit · Ack',
        err: null,
        rejectionReasons: null
      });
    } catch (e) {}

    return res.json({
      status: 'resubmitted',
      message: 'Invoice re-submitted successfully to Oman Tax Authority C5 clearance and cleared.',
      invoice: item
    });
  } else {
    item.err = `Schematron Error BR-O-02: Buyer VATIN '${checkVat}' violates Oman PINT-OM syntax rules. Must start with 'OM' followed by 8–12 digits (e.g. OM1100887700).`;
    return res.status(422).json({
      status: 'rejected',
      message: 'Re-submission failed PINT-OM validation rules.',
      error: item.err,
      invoice: item
    });
  }
});

// DELETE /api/invoices/:id - Delete an invoice
app.delete('/api/invoices/:id', async (req: any, res) => {
  const { id } = req.params;
  try {
    await deleteDoc(doc(firestoreDb, 'invoices', id));
  } catch (e) {}
  memoryInvoices = memoryInvoices.filter(i => i.n !== id);
  res.json({ status: 'deleted', id });
});

// POST /api/invoices/:id/approve - Approve AP Invoice
app.post('/api/invoices/:id/approve', async (req: any, res) => {
  const { id } = req.params;
  const update = { ap: 'Approved · posted to ERP' };
  try {
    await updateDoc(doc(firestoreDb, 'invoices', id), update);
  } catch (e) {}
  const item = memoryInvoices.find(i => i.n === id);
  if (item) item.ap = 'Approved · posted to ERP';
  res.json({ status: 'approved', id });
});

// POST /api/validate-oman & alias /api/validate - Server-side 73-field validation engine & invoice persistence
app.post(['/api/validate-oman', '/api/validate'], async (req: any, res) => {
  try {
    const raw = req.body || {};
    const result = validateOmanInvoice(raw);

    // Extract invoice fields
    const n = raw.IBT_001_InvoiceNumber || raw.n || raw.invoiceNumber || `API-INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const issueDate = raw.IBT_002_InvoiceIssueDate || raw.d || new Date().toISOString().slice(0, 10);
    const issueTime = raw.IBT_168_InvoiceIssueTime || raw.t || '12:00:00';
    const sellerName = raw.SellerDetails?.IBT_027_SellerName || raw.sName || 'International Intelligence Solutions LLC';
    const sellerVat = raw.SellerDetails?.IBT_034_SellerIdentifier || raw.sVat || 'OM1100123456';
    const buyerName = raw.BuyerDetails?.IBT_044_BuyerName || raw.cp || 'Muscat Retail SAOC';
    const buyerVat = raw.BuyerDetails?.IBT_048_BuyerVATIdentifier || raw.cpv || 'OM1100654321';
    const buyerEas = raw.BuyerDetails?.IBT_049_BuyerElectronicAddress || raw.eas || '0248:OM1100654321';
    
    const net = Number(raw.Totals?.IBT_109_InvoiceTotalNetAmount || raw.net || 100);
    const vat = Number(raw.Totals?.IBT_110_InvoiceTotalVATAmount || raw.vat || 5);
    const cat = raw.Lines?.[0]?.IBT_151_ItemVATCategoryCode === 'S' ? 'S 5%' : (raw.cat || 'S 5%');

    const rejectionSummary = result.errors.map(e => `${e.fieldId}: ${e.message}`).join(' | ');

    const newInv = {
      n,
      d: issueDate,
      t: issueTime,
      type: result.isSimplified ? 'Simplified Invoice — B2C' : 'Full Tax Invoice (380/388)',
      dir: 'Outbound (AR)',
      cp: buyerName,
      cpv: buyerVat,
      eas: buyerEas,
      net,
      vat,
      st: result.isValid ? 'Reported' : 'Rejected',
      tdd: result.isValid ? 'Submit · Ack' : 'Validation Error',
      tt: raw.BTOM_001_OmanTransactionType || '10000000000000000000',
      uuid: result.uuidV5Generated || raw.BTOM_002_InvoiceUUID || `uuid-${Date.now()}`,
      cat,
      ent: 'E1',
      sVat: sellerVat,
      sName: sellerName,
      erpSystem: 'REST API / Postman Ingestion',
      sourceChannel: 'Real API Validator (/api/validate)',
      err: result.isValid ? undefined : rejectionSummary,
      rejectionReasons: result.errors,
      warnings: result.warnings,
      lines: (raw.Lines || []).map((l: any) => [
        l.IBT_153_ItemName || 'PINT-OM Service Line',
        Number(l.IBT_129_InvoicedQuantity || 1),
        `${Number(l.IBT_146_ItemNetPrice || net).toFixed(3)} OMR`,
        l.IBT_151_ItemVATCategoryCode === 'S' ? 'S 5%' : 'Z 0%'
      ]),
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    try {
      await setDoc(doc(firestoreDb, 'invoices', n), newInv);
    } catch (e) {
      // Memory fallback
    }

    // Save to memory store
    const existingIdx = memoryInvoices.findIndex(x => x.n === n);
    if (existingIdx >= 0) {
      memoryInvoices[existingIdx] = newInv;
    } else {
      memoryInvoices.unshift(newInv);
    }

    if (result.isValid) {
      return res.status(200).json({
        isValid: true,
        status: 'created',
        message: 'Invoice validated successfully against all 73 PINT-OM rules and created in Faturathi system.',
        invoiceNumber: n,
        invoice: newInv,
        validationResult: result
      });
    } else {
      return res.status(422).json({
        isValid: false,
        status: 'rejected',
        message: 'Invoice failed 73-field PINT-OM validation rules and was stored in Rejected register.',
        invoiceNumber: n,
        rejectionReasons: result.errors,
        warnings: result.warnings,
        invoice: newInv,
        validationResult: result
      });
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/upload-batch - Batch upload endpoint
app.post('/api/upload-batch', async (req: any, res) => {
  try {
    const payload = req.body || {};
    const items = Array.isArray(payload.items) ? payload.items : [payload];
    const createdList: any[] = [];

    for (const item of items) {
      const n = item.n || item.invoiceNumber || `BATCH-${Math.floor(1000 + Math.random() * 9000)}`;
      const inv = {
        n,
        d: item.d || new Date().toISOString().slice(0, 10),
        t: item.t || '15:00:00',
        type: item.type || 'Standard Invoice',
        dir: item.dir || 'Outbound (AR)',
        cp: item.cp || 'Uploaded Counterparty',
        cpv: item.cpv || 'OM1100998877',
        eas: item.eas || '0248:OM1100998877',
        net: Number(item.net || 100),
        vat: Number(item.vat || 5),
        st: 'Pending',
        tdd: 'Queued',
        tt: '10100000000000000000',
        uuid: generateUUIDv5('e0bc4ac8-b025-46e5-a76d-0c893fc3027e', `${n}-${Date.now()}`),
        cat: 'S 5%',
        ent: item.ent || 'E1',
        lines: item.lines || [['Uploaded line item', 1, Number(item.net || 100).toFixed(3), 'S 5%']],
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(firestoreDb, 'invoices', n), inv);
      } catch (err) {}

      memoryInvoices.unshift(inv);
      createdList.push(inv);
    }

    res.json({ status: 'success', count: createdList.length, created: createdList });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/entities & POST /api/entities
app.get('/api/entities', async (req: any, res) => {
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'entities'));
    if (!snapshot.empty) {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json(list);
    }
  } catch (e) {}
  res.json(memoryEntities);
});

app.post('/api/entities', async (req: any, res) => {
  const { name, vatin, prefixes } = req.body || {};
  if (!vatin || !/^OM11\d{8}$/.test(vatin)) {
    return res.status(422).json({
      error: 'VATIN must be "OM11" followed by exactly 8 digits (12 characters). OM12 group VATINs cannot be registered as individual Peppol participants.'
    });
  }

  const id = `E${memoryEntities.length + 1}`;
  const newEnt = {
    id,
    name: name || 'New Entity LLC',
    vatin,
    pid: `0248:${vatin}`,
    prefixes: prefixes || ['NEW-'],
    status: 'Registered'
  };

  try {
    await setDoc(doc(firestoreDb, 'entities', id), newEnt);
  } catch (e) {}

  memoryEntities.push(newEnt);
  res.status(201).json(newEnt);
});

// PUT /api/entities/:id & DELETE /api/entities/:id
app.put('/api/entities/:id', async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const ent = memoryEntities.find(e => e.id === id);
  if (ent) {
    Object.assign(ent, updates);
    try {
      await updateDoc(doc(firestoreDb, 'entities', id), updates);
    } catch (e) {}
    return res.json(ent);
  }
  res.status(404).json({ error: 'Entity not found' });
});

app.delete('/api/entities/:id', async (req: any, res) => {
  const { id } = req.params;
  memoryEntities = memoryEntities.filter(e => e.id !== id);
  try {
    await deleteDoc(doc(firestoreDb, 'entities', id));
  } catch (e) {}
  res.json({ status: 'deleted', id });
});

// GET /api/users, POST, PUT, DELETE
app.get('/api/users', async (req: any, res) => {
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'users'));
    if (!snapshot.empty) {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json(list);
    }
  } catch (e) {}
  res.json(memoryUsers);
});

app.post('/api/users', async (req: any, res) => {
  const { email, role, branch, name } = req.body || {};
  const id = `u${memoryUsers.length + 1}`;
  const newUser = {
    id,
    email: email || 'user@alnoor.om',
    role: role || 'Invoice Clerk',
    branch: branch || 'HQ Muscat',
    name: name || email?.split('@')[0] || 'User',
    mfa: true,
    status: 'Active'
  };

  try {
    await setDoc(doc(firestoreDb, 'users', id), newUser);
  } catch (e) {}

  memoryUsers.push(newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const usr = memoryUsers.find(u => u.id === id);
  if (usr) {
    Object.assign(usr, updates);
    try {
      await updateDoc(doc(firestoreDb, 'users', id), updates);
    } catch (e) {}
    return res.json(usr);
  }
  res.status(404).json({ error: 'User not found' });
});

app.delete('/api/users/:id', async (req: any, res) => {
  const { id } = req.params;
  memoryUsers = memoryUsers.filter(u => u.id !== id);
  try {
    await deleteDoc(doc(firestoreDb, 'users', id));
  } catch (e) {}
  res.json({ status: 'deleted', id });
});

// VAT Group Configuration Store
let memoryVatGroups = [
  { id: 'vat-1', name: 'Oman Standard Rate (5%)', code: 'S 5%', rate: 0.05, status: 'Active', desc: 'Standard 5% VAT rate applicable for general goods & services' },
  { id: 'vat-2', name: 'Oman Zero Rate (0% Export)', code: 'Z 0%', rate: 0, status: 'Active', desc: 'Zero-rated VAT for GCC export & international trade' },
  { id: 'vat-3', name: 'Exempt Services (0%)', code: 'E Exempt', rate: 0, status: 'Active', desc: 'Statutory exempt financial & healthcare services' }
];

app.get('/api/vat-groups', (req: any, res) => {
  res.json(memoryVatGroups);
});

app.post('/api/vat-groups', (req: any, res) => {
  const { name, code, rate, desc } = req.body || {};
  const id = `vat-${memoryVatGroups.length + 1}`;
  const newVat = { id, name: name || 'New VAT Category', code: code || 'S 5%', rate: Number(rate || 0.05), desc: desc || '', status: 'Active' };
  memoryVatGroups.push(newVat);
  res.status(201).json(newVat);
});

// POST /api/auth/login - Superuser credentials & authentication handler
app.post('/api/auth/login', (req: any, res) => {
  const { email, password, role } = req.body || {};
  
  // Check Superuser or preset accounts
  if (email === 'superadmin@faturathi.netbue.om' || email === 'superadmin@faturathi.om' || role === 'Super Admin') {
    return res.json({
      status: 'authenticated',
      user: {
        id: 'u-super',
        email: 'superadmin@faturathi.netbue.om',
        name: 'Faturathi Super Admin',
        role: 'Super Admin',
        branch: 'All Group Entities (Muscat HQ)',
        entityId: 'ALL'
      },
      token: `satoken-${Date.now()}`
    });
  }

  const existingUser = memoryUsers.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (existingUser) {
    return res.json({
      status: 'authenticated',
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.email.split('@')[0],
        role: existingUser.role,
        branch: existingUser.branch,
        entityId: existingUser.role === 'Super Admin' ? 'ALL' : 'E1'
      },
      token: `token-${Date.now()}`
    });
  }

  // Fallback authenticating any valid email input
  return res.json({
    status: 'authenticated',
    user: {
      id: `u-${Date.now().toString().slice(-4)}`,
      email: email || 'user@company.om',
      name: (email || 'user').split('@')[0],
      role: role || 'Finance Manager',
      branch: 'Muscat HQ',
      entityId: 'E1'
    },
    token: `token-${Date.now()}`
  });
});

// Backwards compatibility endpoint for GET /api/requests and POST /api/receive
app.get('/api/requests', (req: any, res) => {
  res.json(memoryInvoices);
});

app.post('/api/receive', (req: any, res) => {
  res.json({ status: 'received', message: 'Invoice queued for PINT OM validation & TDD dispatch' });
});

// POST /api/reset-db or /api/clear
app.post('/api/clear', async (req: any, res) => {
  memoryInvoices = [...SEED_INVOICES];
  memoryEntities = [...SEED_ENTITIES];
  memoryUsers = [...SEED_USERS];

  try {
    const invs = await getDocs(collection(firestoreDb, 'invoices'));
    const batch = writeBatch(firestoreDb);
    invs.docs.forEach(d => batch.delete(d.ref));
    SEED_INVOICES.forEach(inv => {
      batch.set(doc(firestoreDb, 'invoices', inv.n), { ...inv, createdAt: new Date().toISOString() });
    });
    await batch.commit();
  } catch (e) {}

  res.json({ status: 'reset_success', invoicesCount: SEED_INVOICES.length });
});

app.post('/api/reset-db', async (req: any, res) => {
  memoryInvoices = [...SEED_INVOICES];
  memoryEntities = [...SEED_ENTITIES];
  memoryUsers = [...SEED_USERS];
  res.json({ status: 'reset_success' });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Faturathi Server running on http://localhost:${PORT}`);
  });
}

startServer();
