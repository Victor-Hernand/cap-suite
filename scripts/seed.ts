import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  openDb,
  createApp,
  createResource,
  createContact,
  createCompany,
  counts,
} from '../src/lib/db';
import { createPolicy } from '../src/lib/policies';
import { formats, links, notices, processes, countDepartmentContentByDepartment } from '../src/lib/departmentContent';
import { uploadsDir } from '../src/lib/uploads';
import { apps, resources, contacts, companies } from './seed-data';
import {
  policies,
  departmentProcesses,
  departmentFormats,
  departmentLinks,
  departmentNotices,
  type SeedPolicy,
} from './seed-policy-data';

const db = openDb();
const existing = counts(db);

function copyPublicLogos(): void {
  const source = 'public/logos';
  if (!existsSync(source)) return;
  const target = join(uploadsDir(), 'logos');
  mkdirSync(target, { recursive: true });
  for (const file of readdirSync(source)) {
    copyFileSync(join(source, file), join(target, file));
  }
}

function toLogoPath(logo: string | undefined): string | null {
  if (!logo) return null;
  if (logo.startsWith('http')) return logo;
  return logo.replace(/^\/logos\//, 'logos/');
}

/**
 * El mockup no trae documentos oficiales, así que el seed deja las políticas publicadas sin archivo:
 * escribe directo en la base porque «Publicar versión» exige el documento.
 */
function seedPolicy({ content, publication }: SeedPolicy): void {
  const created = createPolicy(db, content);
  db.prepare('UPDATE policies SET status = ?, version = ?, effective_date = ? WHERE id = ?').run(
    content.status,
    publication.version,
    publication.effectiveDate,
    created.id,
  );
  db.prepare('INSERT INTO policy_versions (policy_id, version, date, author, reason) VALUES (?, ?, ?, ?, ?)').run(
    created.id,
    publication.version,
    publication.effectiveDate,
    publication.author,
    publication.reason,
  );
}

function hasDepartmentContent(): boolean {
  return countDepartmentContentByDepartment(db).size > 0;
}

copyPublicLogos();

if (existing.companies === 0) {
  for (const company of companies) {
    createCompany(db, {
      name: company.name,
      segment: company.segment,
      description: company.description,
      slogan: company.slogan,
      color: company.color,
      url: company.url ?? null,
    });
  }
}

if (existing.apps === 0) {
  for (const app of apps) {
    createApp(db, {
      name: app.name,
      description: app.description,
      url: app.url,
      category: app.category,
      companyLabel: app.company ?? null,
      logoPath: toLogoPath(app.logo),
      featured: app.featured,
      badge: app.badge ?? null,
    });
  }
}

if (existing.resources === 0) {
  for (const resource of resources) {
    createResource(db, {
      name: resource.name,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      filePath: null,
    });
  }
}

if (existing.contacts === 0) {
  for (const contact of contacts) {
    createContact(db, {
      name: contact.name,
      role: contact.role,
      department: contact.department,
      company: contact.company,
      phone: contact.phone,
      email: contact.email,
      extension: contact.extension ?? null,
    });
  }
}

if (existing.policies === 0) {
  for (const policy of policies) seedPolicy(policy);
}

if (!hasDepartmentContent()) {
  for (const process of departmentProcesses) processes.create(db, process);
  for (const format of departmentFormats) formats.create(db, format);
  for (const link of departmentLinks) links.create(db, link);
  for (const notice of departmentNotices) notices.create(db, notice);
}

console.log('Seed completado:', counts(db));
