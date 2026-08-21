import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { readEnv } from './env';
import { slugify } from './slug';

export type Db = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  segment TEXT NOT NULL,
  description TEXT NOT NULL,
  slogan TEXT NOT NULL,
  color TEXT NOT NULL,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  company_label TEXT,
  logo_path TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  badge TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT,
  file_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  extension TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function openDb(path = readEnv('DATABASE_PATH') ?? 'data/cap-suite.db'): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}

let singleton: Db | null = null;

export function getDb(): Db {
  singleton ??= openDb();
  return singleton;
}

export interface AppRow {
  id: number;
  name: string;
  description: string;
  url: string;
  category: string;
  companyLabel: string | null;
  logoPath: string | null;
  featured: boolean;
  badge: string | null;
  sortOrder: number;
}

export interface AppInput {
  name: string;
  description: string;
  url: string;
  category: string;
  companyLabel: string | null;
  logoPath: string | null;
  featured: boolean;
  badge: string | null;
}

const APP_SELECT = `SELECT id, name, description, url, category,
  company_label AS companyLabel, logo_path AS logoPath,
  featured, badge, sort_order AS sortOrder FROM apps`;

type RawApp = Omit<AppRow, 'featured'> & { featured: number };

function toAppRow(raw: RawApp): AppRow {
  return { ...raw, featured: raw.featured === 1 };
}

function nextSortOrder(db: Db, table: string): number {
  const row = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM ${table}`).get() as { next: number };
  return row.next;
}

export function listApps(db: Db): AppRow[] {
  return (db.prepare(`${APP_SELECT} ORDER BY sort_order, id`).all() as RawApp[]).map(toAppRow);
}

export function getApp(db: Db, id: number): AppRow | null {
  const raw = db.prepare(`${APP_SELECT} WHERE id = ?`).get(id) as RawApp | undefined;
  return raw ? toAppRow(raw) : null;
}

export function createApp(db: Db, input: AppInput): AppRow {
  const result = db
    .prepare(`INSERT INTO apps (name, description, url, category, company_label, logo_path, featured, badge, sort_order)
      VALUES (@name, @description, @url, @category, @companyLabel, @logoPath, @featured, @badge, @sortOrder)`)
    .run({ ...input, featured: input.featured ? 1 : 0, sortOrder: nextSortOrder(db, 'apps') });
  return getApp(db, Number(result.lastInsertRowid))!;
}

export function updateApp(db: Db, id: number, input: AppInput): AppRow | null {
  db.prepare(`UPDATE apps SET name = @name, description = @description, url = @url, category = @category,
    company_label = @companyLabel, logo_path = @logoPath, featured = @featured, badge = @badge,
    updated_at = datetime('now') WHERE id = @id`)
    .run({ ...input, featured: input.featured ? 1 : 0, id });
  return getApp(db, id);
}

export function deleteApp(db: Db, id: number): AppRow | null {
  const row = getApp(db, id);
  if (row) db.prepare('DELETE FROM apps WHERE id = ?').run(id);
  return row;
}

export function setAppFeatured(db: Db, id: number, featured: boolean): void {
  db.prepare(`UPDATE apps SET featured = ?, updated_at = datetime('now') WHERE id = ?`).run(featured ? 1 : 0, id);
}

export interface ResourceRow {
  id: number;
  name: string;
  description: string;
  type: string;
  url: string | null;
  filePath: string | null;
  sortOrder: number;
}

export interface ResourceInput {
  name: string;
  description: string;
  type: string;
  url: string | null;
  filePath: string | null;
}

const RESOURCE_SELECT = `SELECT id, name, description, type, url,
  file_path AS filePath, sort_order AS sortOrder FROM resources`;

export function listResources(db: Db): ResourceRow[] {
  return db.prepare(`${RESOURCE_SELECT} ORDER BY sort_order, id`).all() as ResourceRow[];
}

export function getResource(db: Db, id: number): ResourceRow | null {
  return (db.prepare(`${RESOURCE_SELECT} WHERE id = ?`).get(id) as ResourceRow | undefined) ?? null;
}

export function createResource(db: Db, input: ResourceInput): ResourceRow {
  const result = db
    .prepare(`INSERT INTO resources (name, description, type, url, file_path, sort_order)
      VALUES (@name, @description, @type, @url, @filePath, @sortOrder)`)
    .run({ ...input, sortOrder: nextSortOrder(db, 'resources') });
  return getResource(db, Number(result.lastInsertRowid))!;
}

export function updateResource(db: Db, id: number, input: ResourceInput): ResourceRow | null {
  db.prepare(`UPDATE resources SET name = @name, description = @description, type = @type,
    url = @url, file_path = @filePath, updated_at = datetime('now') WHERE id = @id`)
    .run({ ...input, id });
  return getResource(db, id);
}

export function deleteResource(db: Db, id: number): ResourceRow | null {
  const row = getResource(db, id);
  if (row) db.prepare('DELETE FROM resources WHERE id = ?').run(id);
  return row;
}

export function listRecentResources(db: Db, limit: number): ResourceRow[] {
  return db
    .prepare(`${RESOURCE_SELECT} ORDER BY updated_at DESC, id DESC LIMIT ?`)
    .all(limit) as ResourceRow[];
}

export interface ContactRow {
  id: number;
  name: string;
  role: string;
  department: string;
  company: string;
  phone: string;
  email: string;
  extension: string | null;
  sortOrder: number;
}

export interface ContactInput {
  name: string;
  role: string;
  department: string;
  company: string;
  phone: string;
  email: string;
  extension: string | null;
}

const CONTACT_SELECT = `SELECT id, name, role, department, company, phone, email,
  extension, sort_order AS sortOrder FROM contacts`;

export function listContacts(db: Db): ContactRow[] {
  return db.prepare(`${CONTACT_SELECT} ORDER BY sort_order, id`).all() as ContactRow[];
}

export function getContact(db: Db, id: number): ContactRow | null {
  return (db.prepare(`${CONTACT_SELECT} WHERE id = ?`).get(id) as ContactRow | undefined) ?? null;
}

export function createContact(db: Db, input: ContactInput): ContactRow {
  const result = db
    .prepare(`INSERT INTO contacts (name, role, department, company, phone, email, extension, sort_order)
      VALUES (@name, @role, @department, @company, @phone, @email, @extension, @sortOrder)`)
    .run({ ...input, sortOrder: nextSortOrder(db, 'contacts') });
  return getContact(db, Number(result.lastInsertRowid))!;
}

export function updateContact(db: Db, id: number, input: ContactInput): ContactRow | null {
  db.prepare(`UPDATE contacts SET name = @name, role = @role, department = @department,
    company = @company, phone = @phone, email = @email, extension = @extension,
    updated_at = datetime('now') WHERE id = @id`)
    .run({ ...input, id });
  return getContact(db, id);
}

export function deleteContact(db: Db, id: number): ContactRow | null {
  const row = getContact(db, id);
  if (row) db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  return row;
}

export interface CompanyRow {
  id: number;
  slug: string;
  name: string;
  segment: string;
  description: string;
  slogan: string;
  color: string;
  url: string | null;
  sortOrder: number;
}

export interface CompanyInput {
  name: string;
  segment: string;
  description: string;
  slogan: string;
  color: string;
  url: string | null;
}

const COMPANY_SELECT = `SELECT id, slug, name, segment, description, slogan, color,
  url, sort_order AS sortOrder FROM companies`;

export function listCompanies(db: Db): CompanyRow[] {
  return db.prepare(`${COMPANY_SELECT} ORDER BY sort_order, id`).all() as CompanyRow[];
}

export function getCompany(db: Db, id: number): CompanyRow | null {
  return (db.prepare(`${COMPANY_SELECT} WHERE id = ?`).get(id) as CompanyRow | undefined) ?? null;
}

export function createCompany(db: Db, input: CompanyInput): CompanyRow {
  const base = slugify(input.name) || 'empresa';
  let slug = base;
  let attempt = 2;
  while (db.prepare('SELECT 1 FROM companies WHERE slug = ?').get(slug)) {
    slug = `${base}-${attempt}`;
    attempt += 1;
  }
  const result = db
    .prepare(`INSERT INTO companies (slug, name, segment, description, slogan, color, url, sort_order)
      VALUES (@slug, @name, @segment, @description, @slogan, @color, @url, @sortOrder)`)
    .run({ ...input, slug, sortOrder: nextSortOrder(db, 'companies') });
  return getCompany(db, Number(result.lastInsertRowid))!;
}

export function updateCompany(db: Db, id: number, input: CompanyInput): CompanyRow | null {
  db.prepare(`UPDATE companies SET name = @name, segment = @segment, description = @description,
    slogan = @slogan, color = @color, url = @url, updated_at = datetime('now') WHERE id = @id`)
    .run({ ...input, id });
  return getCompany(db, id);
}

export function deleteCompany(db: Db, id: number): CompanyRow | null {
  const row = getCompany(db, id);
  if (row) db.prepare('DELETE FROM companies WHERE id = ?').run(id);
  return row;
}

export function counts(db: Db) {
  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number }).total;
  return {
    apps: count('apps'),
    resources: count('resources'),
    contacts: count('contacts'),
    companies: count('companies'),
  };
}

export function companyColorFor(db: Db, label: string | null): string | null {
  if (!label) return null;
  const row = db.prepare('SELECT color FROM companies WHERE name = ?').get(label) as { color: string } | undefined;
  return row?.color ?? null;
}

const SORTABLE_TABLES = ['apps', 'resources', 'contacts', 'companies'] as const;
export type SortableTable = (typeof SORTABLE_TABLES)[number];

export function moveRow(db: Db, table: SortableTable, id: number, direction: 'up' | 'down'): void {
  if (!SORTABLE_TABLES.includes(table)) return;
  const current = db.prepare(`SELECT id, sort_order AS sortOrder FROM ${table} WHERE id = ?`).get(id) as
    | { id: number; sortOrder: number }
    | undefined;
  if (!current) return;
  const comparator = direction === 'up' ? '<' : '>';
  const ordering = direction === 'up' ? 'DESC' : 'ASC';
  const neighbor = db
    .prepare(`SELECT id, sort_order AS sortOrder FROM ${table} WHERE sort_order ${comparator} ? ORDER BY sort_order ${ordering} LIMIT 1`)
    .get(current.sortOrder) as { id: number; sortOrder: number } | undefined;
  if (!neighbor) return;
  const swap = db.transaction(() => {
    db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).run(neighbor.sortOrder, current.id);
    db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).run(current.sortOrder, neighbor.id);
  });
  swap();
}
