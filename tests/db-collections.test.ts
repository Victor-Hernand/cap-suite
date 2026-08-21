import { expect, test } from 'vitest';
import {
  openDb,
  createResource,
  listResources,
  deleteResource,
  createContact,
  listContacts,
  createCompany,
  listCompanies,
  updateCompany,
  counts,
  companyColorFor,
  listRecentResources,
  type CompanyInput,
} from '../src/lib/db';

const company: CompanyInput = {
  name: 'Inversiones S&M',
  segment: 'Importación y Distribución B2B',
  description: 'Empresa líder en importación.',
  slogan: 'Ganando Tú, Ganamos Nosotros',
  color: '#C62828',
  url: null,
};

test('createCompany genera slug único', () => {
  const db = openDb(':memory:');
  const first = createCompany(db, company);
  const second = createCompany(db, company);
  expect(first.slug).toBe('inversiones-s-m');
  expect(second.slug).toBe('inversiones-s-m-2');
});

test('companyColorFor resuelve por nombre exacto', () => {
  const db = openDb(':memory:');
  createCompany(db, company);
  expect(companyColorFor(db, 'Inversiones S&M')).toBe('#C62828');
  expect(companyColorFor(db, 'Grupo CAP')).toBeNull();
  expect(companyColorFor(db, null)).toBeNull();
});

test('resources CRUD con url o archivo', () => {
  const db = openDb(':memory:');
  const linked = createResource(db, {
    name: 'Carpeta compartida',
    description: 'SharePoint del grupo',
    type: 'folder',
    url: 'https://example.sharepoint.com',
    filePath: null,
  });
  createResource(db, {
    name: 'Manual de inducción',
    description: 'PDF de bienvenida',
    type: 'manual',
    url: null,
    filePath: 'docs/manual-abc1.pdf',
  });
  expect(listResources(db)).toHaveLength(2);
  const deleted = deleteResource(db, linked.id);
  expect(deleted?.url).toBe('https://example.sharepoint.com');
});

test('contacts CRUD y counts', () => {
  const db = openDb(':memory:');
  createContact(db, {
    name: 'Ana Cruz',
    role: 'Contadora',
    department: 'Contabilidad',
    company: 'Grupo CAP',
    phone: '+504 9999-9999',
    email: 'ana@cap.hn',
    extension: null,
  });
  createCompany(db, company);
  expect(counts(db)).toEqual({ apps: 0, resources: 0, contacts: 1, companies: 1 });
  expect(listContacts(db)[0].name).toBe('Ana Cruz');
});

test('updateCompany conserva slug y listRecentResources ordena por updated_at', () => {
  const db = openDb(':memory:');
  const created = createCompany(db, company);
  const updated = updateCompany(db, created.id, { ...company, slogan: 'Nuevo slogan' });
  expect(updated?.slug).toBe(created.slug);
  createResource(db, { name: 'Viejo', description: 'x', type: 'link', url: 'https://a.hn', filePath: null });
  db.prepare(`UPDATE resources SET updated_at = datetime('now', '-1 day') WHERE name = 'Viejo'`).run();
  createResource(db, { name: 'Nuevo', description: 'x', type: 'link', url: 'https://b.hn', filePath: null });
  expect(listRecentResources(db, 1)[0].name).toBe('Nuevo');
});
