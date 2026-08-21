import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { readEnv } from './env';

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
