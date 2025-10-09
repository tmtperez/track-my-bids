// server/src/routes/import.ts
import { Router } from 'express';
import multer from 'multer';
import { parseImportCSV } from '../utils/csv.js';
import { prisma } from '../db.js';

export const importer = Router();

// In-memory upload for CSV
const upload = multer({ storage: multer.memoryStorage() });

// Disk upload for attachments
import path from 'path';
import fs from 'fs';
const uploadDisk = multer({ dest: 'uploads/' });

/* =========================
 * Helpers
 * ========================= */
function parseDateLoose(s?: string) {
  if (!s) return null;
  const t = String(s).trim();

  // ISO: YYYY-MM-DD or starts with it
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const d = new Date(t);
    return isNaN(+d) ? null : d;
  }

  // DD/MM/YYYY or MM/DD/YYYY (also supports '-')
  const m = t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);

    // Your sheets are day-first; default to DD/MM
    const day = a;
    const month = b;

    const dt = new Date(Date.UTC(y, month - 1, day));
    return isNaN(+dt) ? null : dt;
  }

  // Fallback: let JS try
  const d = new Date(t);
  return isNaN(+d) ? null : d;
}

function cleanStatus(s?: string) {
  const v = String(s ?? '').trim();
  if (!v) return undefined;
  const norm = v.toLowerCase();
  if (['pending', 'won', 'lost'].includes(norm)) {
    return (norm[0].toUpperCase() + norm.slice(1)) as 'Pending' | 'Won' | 'Lost';
  }
  return undefined;
}

function toNumberOrZero(x: any) {
  const n = Number(String(x ?? '').replace(/[, ]+/g, ''));
  return isFinite(n) ? n : 0;
}

/* =========================
 * CSV Import
 * ========================= */
importer.post('/bids', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const rows = parseImportCSV(req.file.buffer);

  // Debug: log first row columns to help troubleshoot
  if (rows.length > 0) {
    console.log('[CSV Import] Detected columns:', Object.keys(rows[0]));
  }

  // Group by projectName + clientCompany (so multiple scope lines combine into one bid)
  const grouped: Record<
    string,
    {
      projectName: string;
      clientCompany: string;
      contactName: string | null;
      estimatorEmail: string | null;
      proposalDate: string;
      dueDate: string;
      followUpOn: string;
      jobLocation: string | null;
      leadSource: string | null;
      bidStatus: string;
      scopes: Array<{ name: string; cost: number; status?: 'Pending' | 'Won' | 'Lost' }>;
    }
  > = {};

  for (const r of rows as any[]) {
    const projectName = String(r.projectName ?? '').trim();
    const clientCompany = String(r.clientCompany ?? '').trim();

    if (!projectName || !clientCompany) {
      // Skip rows missing the essential keys
      // (or collect them as errors if you prefer)
      continue;
    }

    const key = `${projectName}||${clientCompany}`;
    if (!grouped[key]) {
      // Handle various column name formats (case-insensitive, partial matches)
      const getField = (names: string[]) => {
        for (const name of names) {
          // Try exact match first
          if (r[name] !== undefined && r[name] !== null) {
            return String(r[name]).trim();
          }
          // Try case-insensitive match
          const lowerName = name.toLowerCase();
          for (const key of Object.keys(r)) {
            if (key.toLowerCase() === lowerName) {
              const value = r[key];
              if (value !== undefined && value !== null) return String(value).trim();
            }
          }
        }
        return '';
      };

      grouped[key] = {
        projectName,
        clientCompany,
        contactName: getField(['contactName', 'contact']) || null,
        estimatorEmail: getField(['estimatorEmail', 'estimator']) || null,
        proposalDate: getField(['proposalDate', 'alDate', 'proposal']),
        dueDate: getField(['dueDate', 'due']),
        followUpOn: getField(['followUpOn', 'followUp', 'follow-up', 'follow_up']),
        jobLocation: getField(['jobLocation', 'location']) || null,
        leadSource: getField(['leadSource', 'source']) || null,
        bidStatus: getField(['bidStatus', 'status']) || 'Active',
        scopes: [],
      };
    }

    grouped[key].scopes.push({
      name: String(r.scopeName ?? '').trim(),
      cost: toNumberOrZero(r.scopeCost),
      status: cleanStatus(r.scopeStatus),
    });
  }

  const results: any[] = [];
  const errors: Array<{ key: string; message: string }> = [];

  for (const key of Object.keys(grouped)) {
    const g = grouped[key];

    try {
      // Parse dates safely (DD/MM/YYYY and ISO supported) - allow null
      const proposalDate = parseDateLoose(g.proposalDate);
      const dueDate = parseDateLoose(g.dueDate);
      const followUpOn = parseDateLoose(g.followUpOn);

      // Upsert company
      let company = await prisma.company.findFirst({ where: { name: g.clientCompany } });
      if (!company) {
        company = await prisma.company.create({ data: { name: g.clientCompany } });
      }

      // Upsert contact
      let contact: { id: number } | null = null;
      if (g.contactName) {
        contact = await prisma.contact.findFirst({
          where: { name: g.contactName, companyId: company.id },
        });
        if (!contact) {
          contact = await prisma.contact.create({
            data: { name: g.contactName, companyId: company.id },
          });
        }
      }

      // Find estimator by email
      let estimator: { id: number } | null = null;
      if (g.estimatorEmail) {
        estimator = await prisma.user.findUnique({
          where: { email: g.estimatorEmail.toLowerCase() },
          select: { id: true },
        });
      }

      // Sanitize scopes
      const scopeCreates = g.scopes
        .filter((s) => s.name) // drop empty names
        .map((s) => ({
          name: s.name,
          cost: toNumberOrZero(s.cost),
          status: cleanStatus(s.status) ?? 'Pending',
        }));

      const created = await prisma.bid.create({
        data: {
          projectName: g.projectName,
          clientCompanyId: company.id,
          contactId: contact?.id ?? null,
          estimatorId: estimator?.id ?? null,
          proposalDate,
          dueDate,
          followUpOn,
          jobLocation: g.jobLocation,
          leadSource: g.leadSource,
          bidStatus: g.bidStatus || 'Active',
          scopes: { create: scopeCreates },
        },
      });

      results.push(created);
    } catch (e: any) {
      errors.push({ key, message: e?.message ?? String(e) });
    }
  }

  res.json({ imported: results.length, errors });
});

/* =========================
 * Attachment Upload
 * ========================= */
importer.post('/bids/:id/attachments', uploadDisk.single('file'), async (req, res) => {
  const id = Number(req.params.id);
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const created = await prisma.attachment.create({
    data: {
      bidId: id,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });

  res.json(created);
});
