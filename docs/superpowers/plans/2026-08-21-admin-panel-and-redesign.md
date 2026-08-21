# CAP Suite — Admin + Rediseño "Cabina · Plata fría" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir CAP Suite en una app Astro SSR con SQLite, un panel `/admin` protegido por contraseña para gestionar apps/recursos/contactos/empresas (con subida de archivos), y rediseñar todo el portal a la dirección "Cabina · Plata fría".

**Architecture:** Astro `output: 'server'` con `@astrojs/node` (standalone). Toda la data vive en SQLite (`better-sqlite3`) detrás de `src/lib/db.ts`; las mutaciones pasan por Astro Actions validadas; los archivos subidos viven en `uploads/` y se sirven por `/files/*`. El admin es un layout propio con un componente Vue genérico (`CollectionManager.vue`) configurado por colección.

**Tech Stack:** Astro 5, Vue 3 (`<script setup>`), Tailwind 4 (`@theme`), better-sqlite3, Vitest, @fontsource (Manrope + IBM Plex Mono), tsx.

**Spec:** `docs/superpowers/specs/2026-08-21-admin-panel-and-redesign-design.md`

## Global Constraints

- Copy de UI en español; identificadores, archivos y commits en inglés.
- Commits terminan con la línea `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Vue siempre Composition API con `<script setup>` y props tipadas.
- Sin comentarios obvios, sin código muerto, sin `console.log`.
- Tailwind 4 con tokens en `@theme`; el color de marca lo ponen las empresas (BD), no un acento propio.
- Fuentes self-hosted vía @fontsource (nunca CDN).
- Env vars: `ADMIN_PASSWORD`, `SESSION_SECRET` (obligatorias en producción), `DATABASE_PATH` (default `data/cap-suite.db`), `UPLOADS_DIR` (default `uploads`), `HOST`/`PORT`.
- Límites de subida: logos (`.png .svg .jpg .jpeg .webp`) 2 MB; documentos (`.pdf .doc .docx .xls .xlsx .ppt .pptx`) 20 MB.
- Sitio claro únicamente (sin dark mode). `prefers-reduced-motion` respetado.
- Sesión: cookie `cap_admin_session`, HttpOnly, SameSite=Lax, Secure en prod, 7 días.

---

### Task 1: Modo servidor, dependencias y configuración

**Files:**
- Modify: `astro.config.mjs`
- Modify: `package.json` (deps y scripts)
- Modify: `.gitignore`
- Create: `vitest.config.ts`
- Create: `src/lib/env.ts`

**Interfaces:**
- Produces: `readEnv(name: string): string | undefined` en `src/lib/env.ts` (usada por db, session, uploads, middleware).

- [ ] **Step 1: Instalar dependencias**

```bash
npm install @astrojs/node better-sqlite3
npm install -D vitest tsx @types/better-sqlite3 @fontsource-variable/manrope @fontsource/ibm-plex-mono
```

- [ ] **Step 2: Configurar SSR**

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Scripts y gitignore**

En `package.json` agregar a `"scripts"`:

```json
"seed": "tsx scripts/seed.ts",
"test": "vitest run"
```

En `.gitignore` agregar (crear el archivo si no existe; verificar contenido actual primero):

```
data/
uploads/
.superpowers/
```

- [ ] **Step 4: vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node' },
});
```

- [ ] **Step 5: src/lib/env.ts**

```ts
export function readEnv(name: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  if (fromProcess !== undefined && fromProcess !== '') return fromProcess;
  const meta = import.meta as { env?: Record<string, string | undefined> };
  const fromVite = meta.env?.[name];
  return fromVite !== '' ? fromVite : undefined;
}
```

- [ ] **Step 6: Verificar que el build sigue pasando**

Run: `npm run build`
Expected: build OK (las páginas actuales siguen leyendo de `src/data/*.ts`, ahora renderizadas on-demand).

- [ ] **Step 7: Commit**

```bash
git add astro.config.mjs package.json package-lock.json .gitignore vitest.config.ts src/lib/env.ts
git commit -m "feat: switch to SSR with node adapter and add test tooling"
```

---

### Task 2: Tokens de sesión (TDD)

**Files:**
- Create: `src/lib/session.ts`
- Test: `tests/session.test.ts`

**Interfaces:**
- Produces:
  - `SESSION_COOKIE = 'cap_admin_session'`
  - `SESSION_DURATION_MS: number` (7 días)
  - `createSessionToken(secret: string, nowMs?: number): string` — formato `"<expiraciónMs>.<hmacHex>"`
  - `verifySessionToken(token: string | undefined, secret: string, nowMs?: number): boolean`
  - `constantTimeEquals(a: string, b: string): boolean`

- [ ] **Step 1: Test que falla**

`tests/session.test.ts`:

```ts
import { expect, test } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
  constantTimeEquals,
  SESSION_DURATION_MS,
} from '../src/lib/session';

const SECRET = 'test-secret';

test('token válido pasa verificación', () => {
  const token = createSessionToken(SECRET, 1000);
  expect(verifySessionToken(token, SECRET, 2000)).toBe(true);
});

test('token expirado falla', () => {
  const token = createSessionToken(SECRET, 1000);
  expect(verifySessionToken(token, SECRET, 1000 + SESSION_DURATION_MS + 1)).toBe(false);
});

test('firma alterada falla', () => {
  const token = createSessionToken(SECRET, 1000);
  const [exp] = token.split('.');
  expect(verifySessionToken(`${exp}.deadbeef`, SECRET)).toBe(false);
});

test('secreto distinto falla', () => {
  const token = createSessionToken(SECRET, 1000);
  expect(verifySessionToken(token, 'otro-secreto', 2000)).toBe(false);
});

test('token vacío o malformado falla', () => {
  expect(verifySessionToken(undefined, SECRET)).toBe(false);
  expect(verifySessionToken('', SECRET)).toBe(false);
  expect(verifySessionToken('no-tiene-punto', SECRET)).toBe(false);
});

test('constantTimeEquals compara strings', () => {
  expect(constantTimeEquals('abc', 'abc')).toBe(true);
  expect(constantTimeEquals('abc', 'abd')).toBe(false);
  expect(constantTimeEquals('abc', 'abcd')).toBe(false);
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npx vitest run tests/session.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementación**

`src/lib/session.ts`:

```ts
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'cap_admin_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(secret: string, nowMs = Date.now()): string {
  const expiresAt = nowMs + SESSION_DURATION_MS;
  return `${expiresAt}.${sign(String(expiresAt), secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  nowMs = Date.now(),
): boolean {
  if (!token) return false;
  const separator = token.indexOf('.');
  if (separator <= 0) return false;
  const expiresAtRaw = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!constantTimeEquals(signature, sign(expiresAtRaw, secret))) return false;
  const expiresAt = Number(expiresAtRaw);
  return Number.isFinite(expiresAt) && expiresAt > nowMs;
}

export function constantTimeEquals(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return a.length === b.length && timingSafeEqual(hashA, hashB);
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `npx vitest run tests/session.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/session.ts tests/session.test.ts
git commit -m "feat: add HMAC-signed session tokens"
```

---

### Task 3: Capa de datos — esquema, slug y CRUD de apps (TDD)

**Files:**
- Create: `src/lib/slug.ts`
- Create: `src/lib/db.ts`
- Test: `tests/db.test.ts`

**Interfaces:**
- Consumes: `readEnv` (Task 1).
- Produces (en `src/lib/db.ts`):
  - `type Db` (alias de `Database.Database`), `openDb(path?): Db`, `getDb(): Db` (singleton).
  - `interface AppRow { id: number; name: string; description: string; url: string; category: string; companyLabel: string | null; logoPath: string | null; featured: boolean; badge: string | null; sortOrder: number }`
  - `interface AppInput { name: string; description: string; url: string; category: string; companyLabel: string | null; logoPath: string | null; featured: boolean; badge: string | null }`
  - `listApps(db): AppRow[]`, `getApp(db, id): AppRow | null`, `createApp(db, input): AppRow`, `updateApp(db, id, input): AppRow | null`, `deleteApp(db, id): AppRow | null`, `setAppFeatured(db, id, featured): void`
  - `moveRow(db, table: 'apps' | 'resources' | 'contacts' | 'companies', id: number, direction: 'up' | 'down'): void`
- Produces (en `src/lib/slug.ts`): `slugify(text: string): string` (minúsculas, sin acentos, guiones).

- [ ] **Step 1: Tests que fallan**

`tests/db.test.ts`:

```ts
import { expect, test } from 'vitest';
import {
  openDb,
  createApp,
  listApps,
  getApp,
  updateApp,
  deleteApp,
  setAppFeatured,
  moveRow,
  type AppInput,
} from '../src/lib/db';
import { slugify } from '../src/lib/slug';

const baseApp: AppInput = {
  name: 'ERP CAP',
  description: 'Sistema ERP de Grupo CAP.',
  url: 'https://cap.capgrupo.com/login',
  category: 'erp',
  companyLabel: 'Grupo CAP',
  logoPath: 'logos/fastbi.png',
  featured: true,
  badge: null,
};

test('slugify normaliza acentos y espacios', () => {
  expect(slugify('Inducción 2026 (v2)')).toBe('induccion-2026-v2');
});

test('createApp asigna sortOrder incremental y listApps respeta el orden', () => {
  const db = openDb(':memory:');
  const first = createApp(db, baseApp);
  const second = createApp(db, { ...baseApp, name: 'ERP S&M' });
  expect(first.sortOrder).toBeLessThan(second.sortOrder);
  expect(listApps(db).map((a) => a.name)).toEqual(['ERP CAP', 'ERP S&M']);
});

test('updateApp modifica y getApp devuelve null si no existe', () => {
  const db = openDb(':memory:');
  const app = createApp(db, baseApp);
  const updated = updateApp(db, app.id, { ...baseApp, name: 'ERP CAP v2', featured: false });
  expect(updated?.name).toBe('ERP CAP v2');
  expect(updated?.featured).toBe(false);
  expect(getApp(db, 9999)).toBeNull();
});

test('deleteApp devuelve la fila borrada para limpiar archivos', () => {
  const db = openDb(':memory:');
  const app = createApp(db, baseApp);
  const deleted = deleteApp(db, app.id);
  expect(deleted?.logoPath).toBe('logos/fastbi.png');
  expect(listApps(db)).toHaveLength(0);
});

test('setAppFeatured cambia el flag', () => {
  const db = openDb(':memory:');
  const app = createApp(db, { ...baseApp, featured: false });
  setAppFeatured(db, app.id, true);
  expect(getApp(db, app.id)?.featured).toBe(true);
});

test('moveRow intercambia orden con el vecino y respeta extremos', () => {
  const db = openDb(':memory:');
  const a = createApp(db, { ...baseApp, name: 'A' });
  createApp(db, { ...baseApp, name: 'B' });
  moveRow(db, 'apps', a.id, 'down');
  expect(listApps(db).map((x) => x.name)).toEqual(['B', 'A']);
  moveRow(db, 'apps', a.id, 'down');
  expect(listApps(db).map((x) => x.name)).toEqual(['B', 'A']);
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npx vitest run tests/db.test.ts`
Expected: FAIL (módulos no existen).

- [ ] **Step 3: Implementar slug.ts**

```ts
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 4: Implementar db.ts (esquema + apps)**

```ts
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
```

- [ ] **Step 5: Verificar que pasa**

Run: `npx vitest run tests/db.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/db.ts src/lib/slug.ts tests/db.test.ts
git commit -m "feat: add sqlite data layer with apps CRUD and row ordering"
```

---

### Task 4: Capa de datos — resources, contacts, companies, counts y color (TDD)

**Files:**
- Modify: `src/lib/db.ts`
- Test: `tests/db-collections.test.ts`

**Interfaces:**
- Produces (mismos patrones que apps; agregar a `src/lib/db.ts`):
  - `interface ResourceRow { id; name; description; type; url: string | null; filePath: string | null; sortOrder }` + `ResourceInput` (igual sin id/sortOrder)
  - `interface ContactRow { id; name; role; department; company; phone; email; extension: string | null; sortOrder }` + `ContactInput`
  - `interface CompanyRow { id; slug; name; segment; description; slogan; color; url: string | null; sortOrder }` + `CompanyInput` (sin slug: se genera)
  - `listResources/getResource/createResource/updateResource/deleteResource`
  - `listContacts/getContact/createContact/updateContact/deleteContact`
  - `listCompanies/getCompany/createCompany/updateCompany/deleteCompany` (create genera `slug` único con `slugify(name)`, sufijo `-2`, `-3`… si colisiona)
  - `counts(db): { apps: number; resources: number; contacts: number; companies: number }`
  - `companyColorFor(db, label: string | null): string | null` (match exacto por `name`)
  - `listRecentResources(db, limit: number): ResourceRow[]` (por `updated_at DESC`)

- [ ] **Step 1: Tests que fallan**

`tests/db-collections.test.ts`:

```ts
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
```

- [ ] **Step 2: Verificar que falla**

Run: `npx vitest run tests/db-collections.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Agregar a `src/lib/db.ts` siguiendo exactamente el patrón de apps (SELECT con alias camelCase, `nextSortOrder`, `datetime('now')` en updates). Puntos que difieren del patrón:

```ts
import { slugify } from './slug';

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

export function listRecentResources(db: Db, limit: number): ResourceRow[] {
  return db
    .prepare(`${RESOURCE_SELECT} ORDER BY updated_at DESC, id DESC LIMIT ?`)
    .all(limit) as ResourceRow[];
}
```

`updateCompany` no toca `slug`. `ResourceRow`/`ContactRow` no necesitan conversión de tipos (no tienen boolean).

- [ ] **Step 4: Verificar que pasa**

Run: `npx vitest run`
Expected: PASS (todos los archivos de test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db.ts tests/db-collections.test.ts
git commit -m "feat: add resources, contacts and companies to data layer"
```

---

### Task 5: Librería de uploads (TDD)

**Files:**
- Create: `src/lib/uploads.ts`
- Create: `src/lib/assets.ts`
- Test: `tests/uploads.test.ts`

**Interfaces:**
- Consumes: `slugify`, `readEnv`.
- Produces (en `src/lib/uploads.ts`):
  - `LOGO_MAX_BYTES = 2 * 1024 * 1024`, `DOC_MAX_BYTES = 20 * 1024 * 1024`
  - `type UploadKind = 'logos' | 'docs'`
  - `uploadsDir(): string` (absoluto, desde `UPLOADS_DIR`)
  - `validateUpload(file: File, kind: UploadKind): string | null` (mensaje de error en español o null)
  - `storeUpload(file: File, kind: UploadKind): Promise<string>` (retorna ruta relativa `logos/nombre-ab12.png`)
  - `resolveUploadPath(relativePath: string): string | null` (null si traversal o no existe)
  - `deleteUpload(relativePath: string): void` (ignora URLs http y rutas inválidas)
- Produces (en `src/lib/assets.ts`): `logoSrc(logoPath: string | null): string | undefined` — http(s) pasa igual, ruta local se vuelve `/files/<ruta>`, null → undefined.

- [ ] **Step 1: Tests que fallan**

`tests/uploads.test.ts`:

```ts
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  validateUpload,
  storeUpload,
  resolveUploadPath,
  deleteUpload,
  LOGO_MAX_BYTES,
} from '../src/lib/uploads';
import { logoSrc } from '../src/lib/assets';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cap-uploads-'));
  process.env.UPLOADS_DIR = dir;
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  delete process.env.UPLOADS_DIR;
});

function fakeFile(name: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name);
}

test('validateUpload rechaza extensión y tamaño', () => {
  expect(validateUpload(fakeFile('logo.exe', 10), 'logos')).toMatch(/no permitido/i);
  expect(validateUpload(fakeFile('logo.png', LOGO_MAX_BYTES + 1), 'logos')).toMatch(/2 MB/);
  expect(validateUpload(fakeFile('logo.png', 10), 'logos')).toBeNull();
  expect(validateUpload(fakeFile('manual.pdf', 10), 'docs')).toBeNull();
});

test('storeUpload guarda con nombre saneado y sufijo', async () => {
  const path = await storeUpload(fakeFile('Logo Ñuevo (final).png', 10), 'logos');
  expect(path).toMatch(/^logos\/logo-nuevo-final-[0-9a-f]{8}\.png$/);
  expect(resolveUploadPath(path)).not.toBeNull();
});

test('resolveUploadPath bloquea traversal', () => {
  expect(resolveUploadPath('../secreto.txt')).toBeNull();
  expect(resolveUploadPath('logos/../../etc/passwd')).toBeNull();
  expect(resolveUploadPath('logos/no-existe.png')).toBeNull();
});

test('deleteUpload borra el archivo e ignora URLs', async () => {
  const path = await storeUpload(fakeFile('a.png', 5), 'logos');
  deleteUpload(path);
  expect(resolveUploadPath(path)).toBeNull();
  deleteUpload('https://example.com/logo.png');
});

test('logoSrc distingue URL externa de archivo local', () => {
  expect(logoSrc('https://x.com/a.png')).toBe('https://x.com/a.png');
  expect(logoSrc('logos/a.png')).toBe('/files/logos/a.png');
  expect(logoSrc(null)).toBeUndefined();
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npx vitest run tests/uploads.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar uploads.ts y assets.ts**

`src/lib/uploads.ts`:

```ts
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { readEnv } from './env';
import { slugify } from './slug';

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const DOC_MAX_BYTES = 20 * 1024 * 1024;

export type UploadKind = 'logos' | 'docs';

const ALLOWED_EXTENSIONS: Record<UploadKind, Set<string>> = {
  logos: new Set(['.png', '.svg', '.jpg', '.jpeg', '.webp']),
  docs: new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']),
};

const MAX_BYTES: Record<UploadKind, number> = { logos: LOGO_MAX_BYTES, docs: DOC_MAX_BYTES };
const LIMIT_LABEL: Record<UploadKind, string> = { logos: '2 MB', docs: '20 MB' };

export function uploadsDir(): string {
  return resolve(readEnv('UPLOADS_DIR') ?? 'uploads');
}

export function validateUpload(file: File, kind: UploadKind): string | null {
  const extension = extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS[kind].has(extension)) {
    return `Tipo de archivo no permitido (${extension || 'sin extensión'}).`;
  }
  if (file.size > MAX_BYTES[kind]) {
    return `El archivo supera el límite de ${LIMIT_LABEL[kind]}.`;
  }
  return null;
}

export async function storeUpload(file: File, kind: UploadKind): Promise<string> {
  const extension = extname(file.name).toLowerCase();
  const base = slugify(file.name.slice(0, file.name.length - extension.length)) || 'archivo';
  const fileName = `${base}-${randomBytes(4).toString('hex')}${extension}`;
  const directory = join(uploadsDir(), kind);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, fileName), Buffer.from(await file.arrayBuffer()));
  return `${kind}/${fileName}`;
}

export function resolveUploadPath(relativePath: string): string | null {
  const absolute = resolve(uploadsDir(), relativePath);
  if (!absolute.startsWith(uploadsDir() + sep)) return null;
  return existsSync(absolute) ? absolute : null;
}

export function deleteUpload(relativePath: string): void {
  if (relativePath.startsWith('http')) return;
  const absolute = resolveUploadPath(relativePath);
  if (absolute) rmSync(absolute, { force: true });
}
```

`src/lib/assets.ts`:

```ts
export function logoSrc(logoPath: string | null): string | undefined {
  if (!logoPath) return undefined;
  if (logoPath.startsWith('http')) return logoPath;
  return `/files/${logoPath}`;
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/uploads.ts src/lib/assets.ts tests/uploads.test.ts
git commit -m "feat: add upload storage with sanitized names and traversal guard"
```

---

### Task 6: Seed de datos y páginas leyendo de la BD

**Files:**
- Create: `scripts/seed-data.ts` (mover los arrays actuales)
- Create: `scripts/seed.ts`
- Create: `src/data/categories.ts`
- Modify: `src/pages/index.astro`, `src/pages/apps.astro`, `src/pages/recursos.astro`, `src/pages/contactos.astro`, `src/pages/empresas.astro` (solo el frontmatter: cambiar imports de datos por lecturas de BD)
- Modify: `src/data/site.ts` (quitar `buildSearchItems` y sus imports)
- Create: `src/lib/search.ts`

**Interfaces:**
- Consumes: toda la capa db, `logoSrc`.
- Produces:
  - `src/data/categories.ts`: `appCategories` y `categoryStyles` (movidos tal cual desde `src/data/apps.ts`).
  - `src/lib/search.ts`: `buildSearchItems(db: Db): SearchItem[]` — misma lógica que el actual `buildSearchItems` de `site.ts` pero leyendo `listApps/listResources/listContacts/listCompanies`; para recursos la url es `resource.url ?? `/files/${resource.filePath}``.

- [ ] **Step 1: Mover datos a seed-data.ts**

Crear `scripts/seed-data.ts` copiando los arrays `apps`, `resources`, `contacts`, `companies` desde `src/data/{apps,resources,contacts,companies}.ts` (contenido literal, importando los tipos desde `../src/data/types`). Crear `src/data/categories.ts` con `appCategories` y `categoryStyles` copiados de `src/data/apps.ts`. No borrar aún los archivos originales (se van en Task 15).

- [ ] **Step 2: Escribir seed.ts**

```ts
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
import { uploadsDir } from '../src/lib/uploads';
import { apps, resources, contacts, companies } from './seed-data';

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

console.log('Seed completado:', counts(db));
```

(El `console.log` final es salida legítima del script CLI, no debug.)

- [ ] **Step 3: Ejecutar el seed**

Run: `npm run seed && npm run seed`
Expected: ambas corridas terminan OK; la segunda no duplica (mismos conteos). Verificar: `ls data/ uploads/logos/`.

- [ ] **Step 4: Páginas leen de la BD**

En cada página, reemplazar los imports de arrays por lecturas. Patrón (ejemplo `src/pages/apps.astro`; aplicar el equivalente en las 5 páginas — `empresas.astro` usa `listCompanies`, `recursos.astro` usa `listResources` mapeando `url: r.url ?? '/files/' + r.filePath`, `contactos.astro` usa `listContacts`):

```astro
---
import { getDb, listApps } from '../lib/db';
import { logoSrc } from '../lib/assets';
import { appCategories, categoryStyles } from '../data/categories';

const db = getDb();
const apps = listApps(db).map((app) => ({
  ...app,
  company: app.companyLabel ?? undefined,
  logo: logoSrc(app.logoPath),
  badge: app.badge as 'nuevo' | undefined,
}));
---
```

El resto del markup queda igual por ahora (el rediseño llega en Task 15). `index.astro` usa `apps.filter((a) => a.featured)` y `listCompanies(db).length` para sus conteos. En `site.ts` eliminar `buildSearchItems` y sus imports; crear `src/lib/search.ts` con la misma lógica leyendo de la BD. El componente de búsqueda actual (`SearchFilter.vue` en `Nav.astro`) recibe ahora `buildSearchItems(getDb())` desde el frontmatter de `Nav.astro`.

- [ ] **Step 5: Verificar**

Run: `npx astro check && npm run build`
Expected: sin errores.
Run: `npm run dev &` y `curl -s localhost:4321/apps | grep -o 'ERP CAP'`
Expected: la página renderiza datos desde SQLite. Matar el dev server.

- [ ] **Step 6: Commit**

```bash
git add scripts/ src/data/categories.ts src/data/site.ts src/lib/search.ts src/pages/
git commit -m "feat: seed sqlite from legacy data and read pages from db"
```

---

### Task 7: Middleware de auth, login y logout

**Files:**
- Create: `src/middleware.ts`
- Create: `src/actions/index.ts` (solo `auth` por ahora)
- Create: `src/pages/admin/login.astro`
- Create: `src/pages/admin/logout.astro`
- Create: `src/pages/admin/index.astro` (placeholder mínimo: se rediseña en Task 10)

**Interfaces:**
- Consumes: `session.ts`, `env.ts`.
- Produces:
  - `src/actions/index.ts` exporta `server = { auth: { login, logout } }` (los CRUD se agregan en Task 9).
  - Middleware: `/admin/*` (excepto `/admin/login`) y `/_actions/*` (excepto `auth.login`) exigen sesión.

- [ ] **Step 1: Middleware**

`src/middleware.ts`:

```ts
import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, verifySessionToken } from './lib/session';
import { readEnv } from './lib/env';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isProtectedAction = pathname.startsWith('/_actions/') && !pathname.includes('auth.login');
  if (!isAdminPage && !isProtectedAction) return next();

  const secret = readEnv('SESSION_SECRET');
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (secret && verifySessionToken(token, secret)) return next();

  if (isProtectedAction) return new Response('No autorizado', { status: 401 });
  return context.redirect('/admin/login');
});
```

- [ ] **Step 2: Action de login**

`src/actions/index.ts`:

```ts
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { constantTimeEquals, createSessionToken, SESSION_COOKIE, SESSION_DURATION_MS } from '../lib/session';
import { readEnv } from '../lib/env';

const delay = (ms: number) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

export const server = {
  auth: {
    login: defineAction({
      accept: 'form',
      input: z.object({ password: z.string().min(1, 'Escribe la contraseña') }),
      handler: async ({ password }, context) => {
        const adminPassword = readEnv('ADMIN_PASSWORD');
        const secret = readEnv('SESSION_SECRET');
        if (!adminPassword || !secret) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Faltan ADMIN_PASSWORD o SESSION_SECRET en el servidor.',
          });
        }
        if (!constantTimeEquals(password, adminPassword)) {
          await delay(500);
          throw new ActionError({ code: 'UNAUTHORIZED', message: 'Contraseña incorrecta.' });
        }
        context.cookies.set(SESSION_COOKIE, createSessionToken(secret), {
          httpOnly: true,
          sameSite: 'lax',
          secure: import.meta.env.PROD,
          path: '/',
          maxAge: SESSION_DURATION_MS / 1000,
        });
        return { ok: true };
      },
    }),
  },
};
```

- [ ] **Step 3: Páginas de login/logout y placeholder**

`src/pages/admin/login.astro` (estilo A2 mínimo: fondo `#EEF0F3`, tarjeta blanca centrada):

```astro
---
import { actions } from 'astro:actions';
import '../../styles/global.css';

const result = Astro.getActionResult(actions.auth.login);
if (result && !result.error) return Astro.redirect('/admin');
---

<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Acceso admin — CAP Suite</title>
  </head>
  <body class="flex min-h-screen items-center justify-center bg-base font-sans">
    <form method="POST" action={actions.auth.login} class="w-full max-w-sm rounded-2xl border border-edge bg-surface p-8 shadow-sm">
      <p class="text-sm font-bold tracking-[0.32em] text-ink">CAP&nbsp;SUITE</p>
      <h1 class="mt-4 text-xl font-extrabold text-ink">Acceso de administración</h1>
      {result?.error && <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{result.error.message}</p>}
      <label class="mt-5 block text-xs font-bold tracking-wider text-body" for="password">CONTRASEÑA</label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autofocus
        class="mt-2 w-full rounded-lg border border-edge px-3 py-2 text-ink focus:border-ink"
      />
      <button type="submit" class="mt-5 w-full rounded-lg bg-ink py-2.5 font-bold text-white">Entrar</button>
    </form>
  </body>
</html>
```

(Los tokens `bg-base`, `border-edge`, etc. existen desde Task 13; hasta entonces usar los actuales `bg-ink`→provisional: usar clases con los tokens actuales del proyecto — `bg-ink` claro actual — y Task 13 los actualiza globalmente. No inventar tokens nuevos aquí.)

`src/pages/admin/logout.astro`:

```astro
---
import { SESSION_COOKIE } from '../../lib/session';

Astro.cookies.delete(SESSION_COOKIE, { path: '/' });
return Astro.redirect('/admin/login');
---
```

`src/pages/admin/index.astro` placeholder:

```astro
---
---
<html lang="es"><body><h1>Admin</h1><a href="/admin/logout">Cerrar sesión</a></body></html>
```

- [ ] **Step 4: Verificar con curl**

```bash
ADMIN_PASSWORD=test1234 SESSION_SECRET=devsecret npm run dev &
sleep 3
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' localhost:4321/admin        # 302 → /admin/login
curl -s -o /dev/null -w '%{http_code}\n' localhost:4321/admin/login                   # 200
```

Login correcto (via navegador o curl al action) debe poner cookie y `/admin` responder 200 con ella. Matar el dev server al final.

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts src/actions/index.ts src/pages/admin/
git commit -m "feat: add admin auth with login page and session middleware"
```

---

### Task 8: Ruta de archivos `/files/*`

**Files:**
- Create: `src/pages/files/[...path].ts`

**Interfaces:**
- Consumes: `resolveUploadPath`.

- [ ] **Step 1: Implementar**

```ts
import type { APIRoute } from 'astro';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { resolveUploadPath } from '../../lib/uploads';

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export const GET: APIRoute = async ({ params }) => {
  const relativePath = params.path ?? '';
  const absolutePath = resolveUploadPath(relativePath);
  if (!absolutePath) return new Response('No encontrado', { status: 404 });
  const info = await stat(absolutePath);
  const contentType = CONTENT_TYPES[extname(absolutePath).toLowerCase()] ?? 'application/octet-stream';
  return new Response(Readable.toWeb(createReadStream(absolutePath)) as ReadableStream, {
    headers: { 'Content-Type': contentType, 'Content-Length': String(info.size) },
  });
};
```

- [ ] **Step 2: Verificar con curl**

```bash
npm run dev &
sleep 3
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' localhost:4321/files/logos/fastbi.png   # 200 image/png
curl -s -o /dev/null -w '%{http_code}\n' 'localhost:4321/files/../package.json'                   # 404
curl -s -o /dev/null -w '%{http_code}\n' localhost:4321/files/logos/nope.png                      # 404
```

Matar el dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/files/
git commit -m "feat: serve uploaded files with content types and traversal guard"
```

---

### Task 9: Actions CRUD para las cuatro colecciones

**Files:**
- Modify: `src/actions/index.ts`

**Interfaces:**
- Consumes: db CRUD (Tasks 3-4), uploads (Task 5).
- Produces: `server.apps`, `server.resources`, `server.contacts`, `server.companies`, cada uno con `create` y `update` (accept `'form'`), y `remove`, `move` (JSON). `server.apps` además `toggleFeatured` (JSON). Nombres exactos que consumirá `CollectionManager.vue` (Task 11): `create`, `update`, `remove`, `move`, `toggleFeatured`.

- [ ] **Step 1: Implementar apps**

Agregar a `src/actions/index.ts` (imports adicionales: `getDb, createApp, updateApp, deleteApp, setAppFeatured, moveRow, createResource, updateResource, deleteResource, createContact, updateContact, deleteContact, createCompany, updateCompany, deleteCompany, getApp, getResource` desde `../lib/db`; `storeUpload, validateUpload, deleteUpload` desde `../lib/uploads`; `appCategories` desde `../data/categories`):

```ts
const CATEGORY_IDS = appCategories.map((category) => category.id) as [string, ...string[]];

const idInput = z.object({ id: z.number().int().positive() });
const moveInput = idInput.extend({ direction: z.enum(['up', 'down']) });

const appFormFields = {
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  url: z.string().url('Debe ser una URL válida'),
  category: z.enum(CATEGORY_IDS),
  companyLabel: z.string().optional(),
  badge: z.string().optional(),
  featured: z.boolean().optional(),
  logo: z.instanceof(File).optional(),
  logoUrl: z.string().optional(),
};

async function resolveLogoPath(input: {
  logo?: File;
  logoUrl?: string;
  previousPath?: string | null;
}): Promise<string | null> {
  const { logo, logoUrl, previousPath } = input;
  if (logo && logo.size > 0) {
    const error = validateUpload(logo, 'logos');
    if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error });
    if (previousPath) deleteUpload(previousPath);
    return await storeUpload(logo, 'logos');
  }
  if (logoUrl && logoUrl.trim() !== '') return logoUrl.trim();
  return previousPath ?? null;
}

function toAppInput(form: {
  name: string; description: string; url: string; category: string;
  companyLabel?: string; badge?: string; featured?: boolean;
}, logoPath: string | null) {
  return {
    name: form.name,
    description: form.description,
    url: form.url,
    category: form.category,
    companyLabel: form.companyLabel?.trim() ? form.companyLabel.trim() : null,
    logoPath,
    featured: form.featured ?? false,
    badge: form.badge?.trim() ? form.badge.trim() : null,
  };
}

// dentro de export const server = { auth: {...}, apps: { ... } }
apps: {
  create: defineAction({
    accept: 'form',
    input: z.object(appFormFields),
    handler: async (form) => {
      const logoPath = await resolveLogoPath({ logo: form.logo, logoUrl: form.logoUrl });
      return createApp(getDb(), toAppInput(form, logoPath));
    },
  }),
  update: defineAction({
    accept: 'form',
    input: z.object({ ...appFormFields, id: z.number().int().positive() }),
    handler: async (form) => {
      const db = getDb();
      const existing = getApp(db, form.id);
      if (!existing) throw new ActionError({ code: 'NOT_FOUND', message: 'La aplicación no existe.' });
      const logoPath = await resolveLogoPath({
        logo: form.logo,
        logoUrl: form.logoUrl,
        previousPath: existing.logoPath,
      });
      return updateApp(db, form.id, toAppInput(form, logoPath));
    },
  }),
  remove: defineAction({
    input: idInput,
    handler: async ({ id }) => {
      const deleted = deleteApp(getDb(), id);
      if (deleted?.logoPath) deleteUpload(deleted.logoPath);
      return { ok: true };
    },
  }),
  move: defineAction({
    input: moveInput,
    handler: async ({ id, direction }) => {
      moveRow(getDb(), 'apps', id, direction);
      return { ok: true };
    },
  }),
  toggleFeatured: defineAction({
    input: idInput.extend({ featured: z.boolean() }),
    handler: async ({ id, featured }) => {
      setAppFeatured(getDb(), id, featured);
      return { ok: true };
    },
  }),
},
```

- [ ] **Step 2: Implementar resources, contacts y companies**

Mismo patrón. Detalles propios:

`resources.create/update` — campos `name, description, type: z.enum(['manual','template','folder','link']), url: z.string().optional(), file: z.instanceof(File).optional()`; regla "exactamente uno":

```ts
async function resolveResourceSource(form: { url?: string; file?: File }, previous?: { url: string | null; filePath: string | null }) {
  const hasUrl = !!form.url?.trim();
  const hasFile = !!form.file && form.file.size > 0;
  if (hasFile) {
    const error = validateUpload(form.file!, 'docs');
    if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error });
    if (previous?.filePath) deleteUpload(previous.filePath);
    return { url: null, filePath: await storeUpload(form.file!, 'docs') };
  }
  if (hasUrl) {
    if (previous?.filePath) deleteUpload(previous.filePath);
    return { url: form.url!.trim(), filePath: null };
  }
  if (previous && (previous.url || previous.filePath)) return previous;
  throw new ActionError({ code: 'BAD_REQUEST', message: 'Indica un enlace o sube un archivo.' });
}
```

`resources.remove` borra `filePath` con `deleteUpload` si existe.

`contacts.create/update` — campos `name, role, department, company, phone` (todos `z.string().min(1, ...)` con mensajes en español), `email: z.string().email('Correo inválido')`, `extension: z.string().optional()` (→ null si vacío). Sin archivos.

`companies.create/update` — campos `name, segment, description, slogan` (`z.string().min(1, ...)`), `color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido')`, `url: z.string().optional()` (→ null si vacío). `remove/move` estándar.

- [ ] **Step 3: Verificar**

Run: `npx astro check`
Expected: sin errores de tipos.

```bash
ADMIN_PASSWORD=test1234 SESSION_SECRET=devsecret npm run dev &
sleep 3
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:4321/_actions/apps.remove -H 'Content-Type: application/json' -d '{"id":1}'
```
Expected: `401` (middleware bloquea sin sesión). Matar el dev server.

- [ ] **Step 4: Commit**

```bash
git add src/actions/index.ts
git commit -m "feat: add CRUD actions with validation and file handling"
```

---

### Task 10: AdminLayout y dashboard

**Files:**
- Create: `src/layouts/AdminLayout.astro`
- Modify: `src/pages/admin/index.astro`

**Interfaces:**
- Consumes: `getDb`, `counts`, `listCompanies`.
- Produces: `AdminLayout` con props `{ title: string; active: 'dashboard' | 'apps' | 'recursos' | 'contactos' | 'empresas' }` y un `<slot />` para el contenido. Las páginas admin de Tasks 11-12 lo consumen.

- [ ] **Step 1: AdminLayout.astro**

```astro
---
import '../styles/global.css';
import { getDb, counts, listCompanies } from '../lib/db';

interface Props {
  title: string;
  active: 'dashboard' | 'apps' | 'recursos' | 'contactos' | 'empresas';
}

const { title, active } = Astro.props;
const db = getDb();
const totals = counts(db);
const spectrum = listCompanies(db).map((company) => company.color).join(',');

const navItems = [
  { id: 'dashboard', label: 'Panel', href: '/admin', count: null },
  { id: 'apps', label: 'Aplicaciones', href: '/admin/apps', count: totals.apps },
  { id: 'recursos', label: 'Recursos', href: '/admin/recursos', count: totals.resources },
  { id: 'contactos', label: 'Contactos', href: '/admin/contactos', count: totals.contacts },
  { id: 'empresas', label: 'Empresas', href: '/admin/empresas', count: totals.companies },
] as const;
---

<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>{title} — Admin CAP Suite</title>
  </head>
  <body class="min-h-screen bg-base font-sans text-ink">
    <div class="flex min-h-screen">
      <aside class="flex w-56 shrink-0 flex-col bg-ink-solid py-5 text-slate-300">
        <div class="flex items-center gap-2 px-5">
          <span class="text-xs font-bold tracking-[0.28em] text-white">CAP&nbsp;SUITE</span>
          <span class="rounded bg-admin-gold px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-ink-solid">ADMIN</span>
        </div>
        <div class="mx-5 mt-3 h-0.5 rounded-full" style={`background:linear-gradient(90deg,${spectrum})`}></div>
        <nav class="mt-4 flex flex-col">
          {navItems.map((item) => (
            <a
              href={item.href}
              class:list={[
                'flex items-center justify-between px-5 py-2 text-sm transition-colors',
                active === item.id
                  ? 'border-l-2 border-admin-gold bg-white/10 font-semibold text-white'
                  : 'border-l-2 border-transparent hover:text-white',
              ]}
            >
              {item.label}
              {item.count !== null && <span class="font-mono text-[10px] text-slate-500">{item.count}</span>}
            </a>
          ))}
        </nav>
        <div class="mt-auto flex flex-col gap-2 px-5 text-xs text-slate-500">
          <a href="/" class="hover:text-white">← Ver el portal</a>
          <a href="/admin/logout" class="hover:text-white">Cerrar sesión</a>
        </div>
      </aside>
      <main class="flex-1 overflow-x-auto px-8 py-6">
        <slot />
      </main>
    </div>
  </body>
</html>
```

(Los tokens `bg-base`, `bg-ink-solid`, `bg-admin-gold` se definen en Task 13; hasta entonces `astro check` pasa porque Tailwind ignora clases desconocidas — el estilo se ve correcto al llegar a Task 13. Si se ejecuta el plan en orden estricto y se quiere ver el admin bien antes, es aceptable adelantar solo el bloque `@theme` de Task 13 Step 1.)

- [ ] **Step 2: Dashboard**

`src/pages/admin/index.astro`:

```astro
---
import AdminLayout from '../../layouts/AdminLayout.astro';
import { getDb, counts, listRecentResources } from '../../lib/db';

const db = getDb();
const totals = counts(db);
const recent = listRecentResources(db, 5);

const cards = [
  { label: 'Aplicaciones', value: totals.apps, href: '/admin/apps' },
  { label: 'Recursos', value: totals.resources, href: '/admin/recursos' },
  { label: 'Contactos', value: totals.contacts, href: '/admin/contactos' },
  { label: 'Empresas', value: totals.companies, href: '/admin/empresas' },
];
---

<AdminLayout title="Panel" active="dashboard">
  <h1 class="text-2xl font-extrabold">Panel de administración</h1>
  <p class="mt-1 text-sm text-body">Gestiona el contenido de CAP Suite. Los cambios se publican al instante.</p>
  <div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
    {cards.map((card) => (
      <a href={card.href} class="rounded-xl border border-edge bg-surface p-5 transition-shadow hover:shadow-md">
        <p class="text-3xl font-extrabold">{card.value}</p>
        <p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">{card.label}</p>
      </a>
    ))}
  </div>
  <h2 class="mt-8 font-mono text-[10px] uppercase tracking-widest text-muted">Recursos actualizados recientemente</h2>
  <div class="mt-3 rounded-xl border border-edge bg-surface">
    {recent.length === 0 && <p class="px-5 py-6 text-sm text-body">Aún no hay recursos. Crea el primero en la sección Recursos.</p>}
    {recent.map((resource) => (
      <div class="flex items-center justify-between border-b border-edge px-5 py-3 text-sm last:border-b-0">
        <span class="font-semibold">{resource.name}</span>
        <span class="font-mono text-[10px] uppercase tracking-widest text-muted">{resource.type}</span>
      </div>
    ))}
  </div>
</AdminLayout>
```

- [ ] **Step 3: Verificar**

Run: `npx astro check`, luego dev server con env vars y visitar `/admin` logueado (o curl con cookie).
Expected: dashboard con conteos reales.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/AdminLayout.astro src/pages/admin/index.astro
git commit -m "feat: add admin layout with sidebar and dashboard"
```

---

### Task 11: CollectionManager.vue + FileDrop.vue + página admin de apps

**Files:**
- Create: `src/components/admin/FileDrop.vue`
- Create: `src/components/admin/CollectionManager.vue`
- Create: `src/pages/admin/apps.astro`

**Interfaces:**
- Consumes: actions `apps.*` (Task 9), `AdminLayout` (Task 10).
- Produces: `CollectionManager.vue` con props:
  - `collection: 'apps' | 'resources' | 'contacts' | 'companies'`
  - `rows: Record<string, unknown>[]` (cada row con `id`; para apps además `ledColor` calculado en el frontmatter)
  - `columns: { key: string; label: string; kind?: 'text' | 'muted' | 'led' | 'toggle' }[]`
  - `fields: { name: string; label: string; kind: 'text' | 'url' | 'email' | 'textarea' | 'select' | 'toggle' | 'file-logo' | 'file-doc'; options?: { value: string; label: string }[]; suggestions?: string[]; required?: boolean; placeholder?: string }[]`
  - `entityName: string` (p. ej. "aplicación") — usado en "Nueva aplicación", "Guardar aplicación", estado vacío.

- [ ] **Step 1: FileDrop.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  name: string;
  label: string;
  hint: string;
  accept: string;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const fileName = ref('');

function openPicker() {
  inputRef.value?.click();
}

function onPicked() {
  fileName.value = inputRef.value?.files?.[0]?.name ?? '';
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (!file || !inputRef.value) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  inputRef.value.files = transfer.files;
  fileName.value = file.name;
}
</script>

<template>
  <div>
    <p class="mb-1 text-[10px] font-bold tracking-wider text-body">{{ props.label }}</p>
    <div
      class="cursor-pointer rounded-lg border border-dashed p-4 text-center text-xs transition-colors"
      :class="dragging ? 'border-ink bg-white' : 'border-edge-strong bg-base text-muted'"
      role="button"
      tabindex="0"
      @click="openPicker"
      @keydown.enter="openPicker"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <template v-if="fileName">
        <span class="font-semibold text-ink">{{ fileName }}</span>
      </template>
      <template v-else>
        Arrastra un archivo o <span class="font-bold text-ink">explora</span> · {{ props.hint }}
      </template>
    </div>
    <input ref="inputRef" type="file" :name="props.name" :accept="props.accept" class="hidden" @change="onPicked" />
  </div>
</template>
```

- [ ] **Step 2: CollectionManager.vue**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { actions, isInputError } from 'astro:actions';
import FileDrop from './FileDrop.vue';

type Row = Record<string, unknown> & { id: number };

interface Column {
  key: string;
  label: string;
  kind?: 'text' | 'muted' | 'led' | 'toggle';
}

interface Field {
  name: string;
  label: string;
  kind: 'text' | 'url' | 'email' | 'textarea' | 'select' | 'toggle' | 'file-logo' | 'file-doc';
  options?: { value: string; label: string }[];
  suggestions?: string[];
  required?: boolean;
  placeholder?: string;
}

const props = defineProps<{
  collection: 'apps' | 'resources' | 'contacts' | 'companies';
  rows: Row[];
  columns: Column[];
  fields: Field[];
  entityName: string;
}>();

const group = computed(() => actions[props.collection]);
const filterText = ref('');
const modalOpen = ref(false);
const editingRow = ref<Row | null>(null);
const submitting = ref(false);
const formError = ref('');
const fieldErrors = ref<Record<string, string[]>>({});
const pendingDeleteId = ref<number | null>(null);
const formRef = ref<HTMLFormElement | null>(null);

const visibleRows = computed(() => {
  const query = filterText.value.trim().toLowerCase();
  if (!query) return props.rows;
  return props.rows.filter((row) =>
    props.columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(query)),
  );
});

function openCreate() {
  editingRow.value = null;
  formError.value = '';
  fieldErrors.value = {};
  modalOpen.value = true;
}

function openEdit(row: Row) {
  editingRow.value = row;
  formError.value = '';
  fieldErrors.value = {};
  modalOpen.value = true;
}

function initialValue(field: Field): string {
  const raw = editingRow.value?.[field.name];
  return raw === null || raw === undefined ? '' : String(raw);
}

async function submitForm() {
  if (!formRef.value || submitting.value) return;
  submitting.value = true;
  formError.value = '';
  fieldErrors.value = {};
  const formData = new FormData(formRef.value);
  if (editingRow.value) formData.set('id', String(editingRow.value.id));
  const action = editingRow.value ? group.value.update : group.value.create;
  const { error } = await action(formData);
  submitting.value = false;
  if (!error) {
    window.location.reload();
    return;
  }
  if (isInputError(error)) {
    fieldErrors.value = error.fields;
  } else {
    formError.value = error.message;
  }
}

async function removeRow(id: number) {
  const { error } = await group.value.remove({ id });
  if (error) {
    formError.value = error.message;
    pendingDeleteId.value = null;
    return;
  }
  window.location.reload();
}

async function moveRowBy(id: number, direction: 'up' | 'down') {
  await group.value.move({ id, direction });
  window.location.reload();
}

async function toggleFeatured(row: Row) {
  await actions.apps.toggleFeatured({ id: row.id, featured: !row.featured });
  window.location.reload();
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <input
        v-model="filterText"
        type="search"
        placeholder="Filtrar…"
        class="w-48 rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
      />
      <button
        type="button"
        class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white"
        @click="openCreate"
      >
        + Nueva {{ props.entityName }}
      </button>
    </div>

    <p v-if="formError && !modalOpen" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>

    <div class="mt-4 overflow-hidden rounded-xl border border-edge bg-surface">
      <div v-if="props.rows.length === 0" class="px-5 py-10 text-center text-sm text-body">
        Aún no hay {{ props.entityName }}s. Crea la primera con el botón "Nueva {{ props.entityName }}".
      </div>
      <div v-else-if="visibleRows.length === 0" class="px-5 py-10 text-center text-sm text-body">
        Nada coincide con "{{ filterText }}".
      </div>
      <table v-else class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-edge font-mono text-[9px] uppercase tracking-widest text-muted">
            <th v-for="column in props.columns" :key="column.key" class="px-4 py-2 font-medium">{{ column.label }}</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="row.id" class="border-b border-edge/60 last:border-b-0">
            <td v-for="column in props.columns" :key="column.key" class="px-4 py-3">
              <span v-if="column.kind === 'led'" class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full" :style="{ background: String(row.ledColor ?? '#15181D') }"></span>
                {{ row[column.key] ?? '—' }}
              </span>
              <button
                v-else-if="column.kind === 'toggle'"
                type="button"
                class="relative h-4 w-7 rounded-full transition-colors"
                :class="row[column.key] ? 'bg-green-600' : 'bg-edge-strong'"
                :aria-label="row[column.key] ? 'Quitar de destacadas' : 'Destacar'"
                @click="toggleFeatured(row)"
              >
                <span
                  class="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
                  :class="row[column.key] ? 'right-0.5' : 'left-0.5'"
                ></span>
              </button>
              <span v-else-if="column.kind === 'muted'" class="text-muted">{{ row[column.key] ?? '—' }}</span>
              <span v-else class="font-semibold">{{ row[column.key] ?? '—' }}</span>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button type="button" class="px-1 text-muted hover:text-ink" aria-label="Subir" @click="moveRowBy(row.id, 'up')">↑</button>
              <button type="button" class="px-1 text-muted hover:text-ink" aria-label="Bajar" @click="moveRowBy(row.id, 'down')">↓</button>
              <button type="button" class="ml-2 font-semibold hover:underline" @click="openEdit(row)">Editar</button>
              <button
                v-if="pendingDeleteId !== row.id"
                type="button"
                class="ml-2 text-red-700"
                aria-label="Eliminar"
                @click="pendingDeleteId = row.id"
              >✕</button>
              <button
                v-else
                type="button"
                class="ml-2 rounded bg-red-700 px-2 py-0.5 text-xs font-bold text-white"
                @click="removeRow(row.id)"
              >¿Eliminar?</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 pt-16" @click.self="modalOpen = false">
      <form
        ref="formRef"
        class="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl"
        @submit.prevent="submitForm"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-extrabold">
            {{ editingRow ? `Editar ${props.entityName}` : `Nueva ${props.entityName}` }}
          </h2>
          <button type="button" class="text-muted hover:text-ink" aria-label="Cerrar" @click="modalOpen = false">✕</button>
        </div>
        <p v-if="formError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>
        <div class="mt-4 grid grid-cols-1 gap-4">
          <div v-for="field in props.fields" :key="field.name">
            <template v-if="field.kind === 'toggle'">
              <label class="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" :name="field.name" :checked="Boolean(editingRow?.[field.name])" />
                {{ field.label }}
              </label>
            </template>
            <FileDrop
              v-else-if="field.kind === 'file-logo' || field.kind === 'file-doc'"
              :name="field.name"
              :label="field.label"
              :hint="field.kind === 'file-logo' ? 'PNG/SVG/JPG/WebP, máx. 2 MB' : 'PDF u Office, máx. 20 MB'"
              :accept="field.kind === 'file-logo' ? '.png,.svg,.jpg,.jpeg,.webp' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'"
            />
            <template v-else>
              <label class="mb-1 block text-[10px] font-bold tracking-wider text-body" :for="`field-${field.name}`">
                {{ field.label }}
              </label>
              <textarea
                v-if="field.kind === 'textarea'"
                :id="`field-${field.name}`"
                :name="field.name"
                :required="field.required"
                rows="3"
                class="w-full rounded-lg border border-edge px-3 py-2 text-sm"
                :value="initialValue(field)"
              ></textarea>
              <select
                v-else-if="field.kind === 'select'"
                :id="`field-${field.name}`"
                :name="field.name"
                class="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
              >
                <option
                  v-for="option in field.options"
                  :key="option.value"
                  :value="option.value"
                  :selected="initialValue(field) === option.value"
                >{{ option.label }}</option>
              </select>
              <input
                v-else
                :id="`field-${field.name}`"
                :name="field.name"
                :type="field.kind === 'url' ? 'url' : field.kind === 'email' ? 'email' : 'text'"
                :required="field.required"
                :placeholder="field.placeholder"
                :list="field.suggestions ? `list-${field.name}` : undefined"
                class="w-full rounded-lg border border-edge px-3 py-2 text-sm"
                :value="initialValue(field)"
              />
              <datalist v-if="field.suggestions" :id="`list-${field.name}`">
                <option v-for="suggestion in field.suggestions" :key="suggestion" :value="suggestion"></option>
              </datalist>
              <p v-if="fieldErrors[field.name]" class="mt-1 text-xs text-red-700">{{ fieldErrors[field.name][0] }}</p>
            </template>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-edge px-4 py-2 text-sm" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white" :disabled="submitting">
            {{ submitting ? 'Guardando…' : `Guardar ${props.entityName}` }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Página admin de apps**

`src/pages/admin/apps.astro`:

```astro
---
import AdminLayout from '../../layouts/AdminLayout.astro';
import CollectionManager from '../../components/admin/CollectionManager.vue';
import { getDb, listApps, listCompanies, companyColorFor } from '../../lib/db';
import { appCategories } from '../../data/categories';

const db = getDb();
const companies = listCompanies(db);
const rows = listApps(db).map((app) => ({
  ...app,
  ledColor: companyColorFor(db, app.companyLabel) ?? '#15181D',
  logoUrl: app.logoPath?.startsWith('http') ? app.logoPath : '',
}));

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'category', label: 'Categoría', kind: 'muted' },
  { key: 'companyLabel', label: 'Empresa', kind: 'led' },
  { key: 'featured', label: 'Destacada', kind: 'toggle' },
];

const fields = [
  { name: 'name', label: 'NOMBRE', kind: 'text', required: true },
  { name: 'url', label: 'URL', kind: 'url', required: true, placeholder: 'https://…' },
  { name: 'description', label: 'DESCRIPCIÓN', kind: 'textarea', required: true },
  {
    name: 'category',
    label: 'CATEGORÍA',
    kind: 'select',
    options: appCategories.map((category) => ({ value: category.id, label: category.label })),
  },
  {
    name: 'companyLabel',
    label: 'EMPRESA',
    kind: 'text',
    suggestions: ['Grupo CAP', ...companies.map((company) => company.name)],
  },
  { name: 'logo', label: 'LOGO', kind: 'file-logo' },
  { name: 'logoUrl', label: 'O URL DE LOGO EXTERNO', kind: 'text', placeholder: 'https://… (opcional)' },
  { name: 'featured', label: 'Destacada en inicio', kind: 'toggle' },
  { name: 'badge', label: 'BADGE', kind: 'text', placeholder: 'nuevo (opcional)' },
];
---

<AdminLayout title="Aplicaciones" active="apps">
  <h1 class="text-2xl font-extrabold">Aplicaciones</h1>
  <p class="mt-1 text-sm text-body">{rows.length} sistemas · {rows.filter((row) => row.featured).length} destacados</p>
  <div class="mt-5">
    <CollectionManager
      client:load
      collection="apps"
      entityName="aplicación"
      rows={rows}
      columns={columns}
      fields={fields}
    />
  </div>
</AdminLayout>
```

- [ ] **Step 4: Verificar flujo completo**

Dev server con env vars → login → `/admin/apps`: crear una app de prueba con logo subido, verla en la tabla y en `/apps`, editarla, moverla, quitarla (verificar que el logo subido desaparece de `uploads/logos/`).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/ src/pages/admin/apps.astro
git commit -m "feat: add collection manager with modal forms and file drop"
```

---

### Task 12: Páginas admin de recursos, contactos y empresas

**Files:**
- Create: `src/pages/admin/recursos.astro`
- Create: `src/pages/admin/contactos.astro`
- Create: `src/pages/admin/empresas.astro`

**Interfaces:**
- Consumes: `CollectionManager.vue`, `AdminLayout`, db.

- [ ] **Step 1: recursos.astro**

```astro
---
import AdminLayout from '../../layouts/AdminLayout.astro';
import CollectionManager from '../../components/admin/CollectionManager.vue';
import { getDb, listResources } from '../../lib/db';

const rows = listResources(getDb()).map((resource) => ({
  ...resource,
  source: resource.url ?? `Archivo: ${resource.filePath}`,
}));

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'type', label: 'Tipo', kind: 'muted' },
  { key: 'source', label: 'Origen', kind: 'muted' },
];

const fields = [
  { name: 'name', label: 'NOMBRE', kind: 'text', required: true },
  { name: 'description', label: 'DESCRIPCIÓN', kind: 'textarea', required: true },
  {
    name: 'type',
    label: 'TIPO',
    kind: 'select',
    options: [
      { value: 'manual', label: 'Manual' },
      { value: 'template', label: 'Plantilla' },
      { value: 'folder', label: 'Carpeta' },
      { value: 'link', label: 'Enlace' },
    ],
  },
  { name: 'url', label: 'ENLACE', kind: 'text', placeholder: 'https://… (o sube un archivo abajo)' },
  { name: 'file', label: 'ARCHIVO', kind: 'file-doc' },
];
---

<AdminLayout title="Recursos" active="recursos">
  <h1 class="text-2xl font-extrabold">Recursos</h1>
  <p class="mt-1 text-sm text-body">{rows.length} documentos y enlaces</p>
  <div class="mt-5">
    <CollectionManager client:load collection="resources" entityName="recurso" rows={rows} columns={columns} fields={fields} />
  </div>
</AdminLayout>
```

- [ ] **Step 2: contactos.astro**

Mismo esqueleto con:

```astro
const rows = listContacts(getDb());
const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'role', label: 'Cargo', kind: 'muted' },
  { key: 'department', label: 'Departamento', kind: 'muted' },
  { key: 'company', label: 'Empresa', kind: 'muted' },
];
const fields = [
  { name: 'name', label: 'NOMBRE', kind: 'text', required: true },
  { name: 'role', label: 'CARGO', kind: 'text', required: true },
  { name: 'department', label: 'DEPARTAMENTO', kind: 'text', required: true },
  { name: 'company', label: 'EMPRESA', kind: 'text', required: true },
  { name: 'phone', label: 'TELÉFONO', kind: 'text', required: true },
  { name: 'email', label: 'CORREO', kind: 'email', required: true },
  { name: 'extension', label: 'EXTENSIÓN', kind: 'text', placeholder: 'opcional' },
];
```

`entityName="contacto"`, `collection="contacts"`, `active="contactos"`, título "Contactos".

- [ ] **Step 3: empresas.astro**

```astro
const rows = listCompanies(getDb()).map((company) => ({ ...company, ledColor: company.color, companyLabel: company.segment }));
const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'companyLabel', label: 'Segmento', kind: 'led' },
  { key: 'slogan', label: 'Slogan', kind: 'muted' },
];
const fields = [
  { name: 'name', label: 'NOMBRE', kind: 'text', required: true },
  { name: 'segment', label: 'SEGMENTO', kind: 'text', required: true },
  { name: 'description', label: 'DESCRIPCIÓN', kind: 'textarea', required: true },
  { name: 'slogan', label: 'SLOGAN', kind: 'text', required: true },
  { name: 'color', label: 'COLOR (HEX)', kind: 'text', required: true, placeholder: '#C62828' },
  { name: 'url', label: 'SITIO WEB', kind: 'text', placeholder: 'https://… (opcional)' },
];
```

`entityName="empresa"`, `collection="companies"`, `active="empresas"`, título "Empresas".

- [ ] **Step 4: Verificar**

`npx astro check`; en dev, crear/editar un recurso con archivo PDF (ver que `/files/docs/...` lo sirve), un contacto y una empresa.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/
git commit -m "feat: add admin pages for resources, contacts and companies"
```

---

### Task 13: Tokens A2, fuentes y shell del portal (Layout, Nav, Footer)

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/Nav.astro`
- Modify: `src/components/Footer.astro`

**Interfaces:**
- Produces: tokens Tailwind usados por todo lo demás: `base, surface, edge, edge-strong, ink, ink-solid, body, muted, admin-gold`; fuentes `--font-sans` (Manrope Variable) y `--font-mono` (IBM Plex Mono); clase utilitaria `.ambient-strip`.

- [ ] **Step 1: Tokens y fuentes**

`src/styles/global.css` — reemplazar el bloque `@theme` (mantener el resto de reglas de focus/selection ajustando colores):

```css
@import 'tailwindcss';
@import '@fontsource-variable/manrope';
@import '@fontsource/ibm-plex-mono/400.css';
@import '@fontsource/ibm-plex-mono/500.css';

@theme {
  --color-base: #eef0f3;
  --color-surface: #ffffff;
  --color-edge: #dfe3e9;
  --color-edge-strong: #c3c8d1;
  --color-ink: #15181d;
  --color-ink-solid: #15181d;
  --color-body: #4a5160;
  --color-muted: #7d838e;
  --color-admin-gold: #d4a843;
  --font-sans: 'Manrope Variable', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}

.ambient-strip {
  height: 2px;
  border-radius: 2px;
  box-shadow:
    0 2px 12px rgba(30, 136, 229, 0.25),
    0 2px 22px rgba(123, 31, 162, 0.2);
}

.page-enter {
  animation: page-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-enter {
    animation: none;
  }
}
```

Eliminar del CSS las clases que ya no aplican al nuevo diseño (`.blob`, `.blob-drift`) cuando ninguna página las use (tras Task 15; si Task 13 se ejecuta antes, dejarlas y removerlas en Task 15). Nota: el token viejo `--color-ink` era el fondo crema; ahora es la tinta. Las páginas públicas se corrigen en Task 15 — entre Task 13 y Task 15 el sitio público puede verse raro; es aceptable dentro de la misma rama.

- [ ] **Step 2: Layout.astro**

Estructura (adaptar el actual conservando slots/props):

```astro
---
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-base font-sans text-ink [background-image:radial-gradient(130%_90%_at_50%_-25%,#ffffff_0%,#eef0f3_65%)]">
    <Nav />
    <main class="page-enter">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 3: Nav.astro**

```astro
---
import { getDb, listCompanies } from '../lib/db';
import { buildSearchItems } from '../lib/search';
import { siteConfig } from '../data/site';
import CommandPalette from './CommandPalette.vue';

const db = getDb();
const spectrum = listCompanies(db).map((company) => company.color).join(',');
const searchItems = buildSearchItems(db);
const currentPath = Astro.url.pathname;
---

<header class="sticky top-0 z-40 bg-base/90 backdrop-blur">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="flex items-center justify-between py-4">
      <a href="/" class="text-sm font-bold tracking-[0.32em] text-ink">CAP&nbsp;SUITE</a>
      <nav class="hidden items-center gap-6 text-[11px] tracking-wider text-muted sm:flex">
        {siteConfig.nav.map((item) => (
          <a
            href={item.href}
            class:list={['uppercase transition-colors hover:text-ink', currentPath === item.href && 'font-bold text-ink']}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <CommandPalette client:load items={searchItems} />
    </div>
    <div class="ambient-strip" style={`background:linear-gradient(90deg,${spectrum})`}></div>
  </div>
</header>
```

(`CommandPalette.vue` se crea en Task 14; si esta task corre antes en orden estricto, dejar el `SearchFilter.vue` actual en su lugar y Task 14 lo reemplaza. Menú móvil: los enlaces de nav se repiten bajo el header en `sm:hidden` con el mismo map — sin JS.)

- [ ] **Step 4: Footer.astro**

```astro
---
import { siteConfig } from '../data/site';
---

<footer class="mt-16 border-t border-edge">
  <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <p class="text-sm font-bold tracking-[0.32em] text-ink">CAP&nbsp;SUITE</p>
    <p class="font-mono text-[10px] uppercase tracking-widest text-muted">{siteConfig.footerNote}</p>
  </div>
</footer>
```

- [ ] **Step 5: Verificar y commit**

Run: `npx astro check && npm run build`

```bash
git add src/styles/global.css src/layouts/Layout.astro src/components/Nav.astro src/components/Footer.astro
git commit -m "feat: apply silver cockpit design tokens, fonts and shell"
```

---

### Task 14: Paleta de comandos ⌘K

**Files:**
- Create: `src/components/CommandPalette.vue`
- Delete: `src/components/SearchFilter.vue`

**Interfaces:**
- Consumes: `SearchItem[]` (props desde `Nav.astro`).
- Produces: botón de búsqueda en la nav + modal global; se abre con ⌘K/Ctrl+K o clic, y con el evento `window.dispatchEvent(new CustomEvent('open-command-palette'))` (usado por el buscador del inicio en Task 15).

- [ ] **Step 1: Implementar CommandPalette.vue**

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { SearchItem } from '../data/types';

const props = defineProps<{ items: SearchItem[] }>();

const open = ref(false);
const query = ref('');
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const results = computed(() => {
  const text = query.value.trim().toLowerCase();
  if (!text) return props.items.slice(0, 8);
  return props.items
    .filter((item) => `${item.name} ${item.description} ${item.section}`.toLowerCase().includes(text))
    .slice(0, 8);
});

watch(results, () => {
  activeIndex.value = 0;
});

watch(open, async (isOpen) => {
  if (isOpen) {
    query.value = '';
    await Promise.resolve();
    inputRef.value?.focus();
  }
});

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    open.value = !open.value;
  }
  if (event.key === 'Escape') open.value = false;
}

function openPalette() {
  open.value = true;
}

function go(item: SearchItem) {
  open.value = false;
  if (item.url.startsWith('http') || item.url.startsWith('mailto:')) {
    window.open(item.url, '_blank', 'noopener');
    return;
  }
  window.location.href = item.url;
}

function onListKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (event.key === 'Enter' && results.value[activeIndex.value]) {
    go(results.value[activeIndex.value]);
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown);
  window.addEventListener('open-command-palette', openPalette);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown);
  window.removeEventListener('open-command-palette', openPalette);
});
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-edge-strong"
    @click="open = true"
  >
    Buscar
    <span class="rounded border border-edge bg-base px-1.5 py-0.5 font-mono text-[10px]">⌘K</span>
  </button>

  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[15vh] backdrop-blur-sm"
      @click.self="open = false"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-xl border border-edge bg-surface shadow-2xl" role="dialog" aria-label="Buscar en la suite">
        <input
          ref="inputRef"
          v-model="query"
          type="search"
          placeholder="Buscar sistemas, documentos, personas…"
          class="w-full border-b border-edge px-4 py-3 text-sm outline-none"
          @keydown="onListKeydown"
        />
        <ul v-if="results.length" class="max-h-80 overflow-y-auto py-1">
          <li v-for="(item, index) in results" :key="item.id">
            <button
              type="button"
              class="flex w-full items-baseline justify-between px-4 py-2.5 text-left text-sm"
              :class="index === activeIndex ? 'bg-base' : ''"
              @mouseenter="activeIndex = index"
              @click="go(item)"
            >
              <span>
                <span class="font-semibold text-ink">{{ item.name }}</span>
                <span class="ml-2 text-xs text-muted">{{ item.description }}</span>
              </span>
              <span class="ml-3 shrink-0 font-mono text-[9px] uppercase tracking-widest text-muted">{{ item.section }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="px-4 py-8 text-center text-sm text-muted">Sin resultados para "{{ query }}".</p>
      </div>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 2: Reemplazar SearchFilter**

Quitar `SearchFilter.vue` y cualquier referencia (la nav ya usa `CommandPalette` desde Task 13). `git rm src/components/SearchFilter.vue`.

- [ ] **Step 3: Verificar**

`npx astro check`; en dev: ⌘K abre/cierra, filtra, Enter navega, Esc cierra, botón de nav funciona.

- [ ] **Step 4: Commit**

```bash
git add -A src/components/
git commit -m "feat: replace search filter with global command palette"
```

---

### Task 15: Rediseño de las páginas públicas

**Files:**
- Modify: `src/pages/index.astro` (lanzador completo)
- Modify: `src/pages/apps.astro`, `src/pages/recursos.astro`, `src/pages/contactos.astro`, `src/pages/empresas.astro`
- Modify: `src/components/AppCard.astro` (LED + estilo A2)
- Create: `src/components/TickRuler.astro`
- Delete: `src/components/AppCardContent.vue` (si queda sin uso tras el rediseño), `src/data/apps.ts`, `src/data/resources.ts`, `src/data/contacts.ts`, `src/data/companies.ts` (los arrays ya viven en `scripts/seed-data.ts`; ajustar el import de `seed-data.ts` para que no dependa de estos archivos)
- Modify: `src/components/SectionHeader.astro`, `src/components/ResourceCard.astro`, `src/components/ContactCard.astro`, `src/components/CompanyCard.astro` (estilo A2)

**Interfaces:**
- Consumes: db, `logoSrc`, `categoryStyles`, `TickRuler`.
- Produces: `TickRuler.astro` con props `{ counts: { apps: number; resources: number; contacts: number; companies: number } }`.

- [ ] **Step 1: TickRuler.astro**

```astro
---
interface Props {
  counts: { apps: number; resources: number; contacts: number; companies: number };
}

const { counts } = Astro.props;
const stats = [
  { value: counts.apps, label: 'SISTEMAS', href: '/apps' },
  { value: counts.resources, label: 'RECURSOS', href: '/recursos' },
  { value: counts.contacts, label: 'CONTACTOS', href: '/contactos' },
  { value: counts.companies, label: 'EMPRESAS', href: '/empresas' },
];
---

<div>
  <div class="h-2.5 opacity-60 [background:repeating-linear-gradient(90deg,var(--color-edge-strong)_0_1px,transparent_1px_14px)]"></div>
  <div class="mt-2.5 flex justify-between font-mono text-[10px] tracking-[0.2em] text-muted">
    {stats.map((stat) => (
      <a href={stat.href} class="transition-colors hover:text-ink">
        <span class="font-bold text-ink">{stat.value}</span> {stat.label}
      </a>
    ))}
  </div>
</div>
```

- [ ] **Step 2: AppCard.astro (LED + estilo)**

```astro
---
import { getDb, companyColorFor } from '../lib/db';
import { categoryStyles, appCategories } from '../data/categories';
import type { AppRow } from '../lib/db';
import { logoSrc } from '../lib/assets';

interface Props {
  app: AppRow;
}

const { app } = Astro.props;
const ledColor = companyColorFor(getDb(), app.companyLabel) ?? '#15181D';
const categoryLabel = appCategories.find((category) => category.id === app.category)?.label ?? app.category;
const logo = logoSrc(app.logoPath);
---

<a
  href={app.url}
  target="_blank"
  rel="noopener"
  class="group flex flex-col rounded-xl border border-edge bg-surface p-4 shadow-[0_1px_6px_rgba(21,24,29,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-md"
>
  <div class="flex items-center justify-between">
    {logo
      ? <img src={logo} alt="" width="26" height="26" class="h-[26px] w-[26px] rounded-md object-contain" />
      : <span class="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-base font-mono text-[10px] text-body">{app.name.slice(0, 2).toUpperCase()}</span>}
    <span
      class="h-1.5 w-1.5 rounded-full"
      style={`background:${ledColor};box-shadow:0 0 6px ${ledColor}99`}
      title={app.companyLabel ?? undefined}
    ></span>
  </div>
  <p class="mt-3 flex items-center gap-2 text-sm font-bold text-ink">
    {app.name}
    {app.badge && <span class="rounded bg-admin-gold/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-ink">{app.badge}</span>}
  </p>
  <p class="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{categoryLabel}</p>
</a>
```

(El `categoryStyles` deja de usarse en la tarjeta — el color ahora es el LED de empresa; si ninguna otra vista lo usa, eliminarlo de `categories.ts`.)

- [ ] **Step 3: index.astro (lanzador)**

```astro
---
import Layout from '../layouts/Layout.astro';
import AppCard from '../components/AppCard.astro';
import TickRuler from '../components/TickRuler.astro';
import { getDb, listApps, counts, listRecentResources, listContacts } from '../lib/db';

const db = getDb();
const featuredApps = listApps(db).filter((app) => app.featured);
const totals = counts(db);
const recentResources = listRecentResources(db, 3);
const contacts = listContacts(db).slice(0, 3);

const tegucigalpaHour = Number(
  new Intl.DateTimeFormat('es-HN', { hour: 'numeric', hour12: false, timeZone: 'America/Tegucigalpa' }).format(new Date()),
);
const greeting = tegucigalpaHour < 12 ? 'Buenos días' : tegucigalpaHour < 18 ? 'Buenas tardes' : 'Buenas noches';
const dateLabel = new Intl.DateTimeFormat('es-HN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'America/Tegucigalpa',
}).format(new Date());
---

<Layout title="CAP Suite — Portal unificado de Grupo CAP">
  <section class="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
    <p class="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{dateLabel} · Tegucigalpa</p>
    <h1 class="mt-1.5 text-3xl font-light tracking-tight text-ink sm:text-4xl">
      {greeting}, <span class="font-bold">Grupo CAP</span>
    </h1>
    <button
      type="button"
      class="mt-5 flex w-full max-w-xl items-center justify-between rounded-xl border border-edge bg-surface px-4 py-3 text-left text-sm text-muted shadow-sm transition-colors hover:border-edge-strong"
      onclick="window.dispatchEvent(new CustomEvent('open-command-palette'))"
    >
      Buscar sistemas, documentos, personas…
      <span class="rounded border border-edge bg-base px-1.5 py-0.5 font-mono text-[10px]">⌘K</span>
    </button>
  </section>

  <section class="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
    <h2 class="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Accesos rápidos</h2>
    {featuredApps.length === 0 && (
      <p class="mt-4 rounded-xl border border-edge bg-surface px-5 py-8 text-center text-sm text-body">
        Aún no hay sistemas destacados. Márcalos desde el panel de administración.
      </p>
    )}
    <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {featuredApps.map((app) => <AppCard app={app} />)}
    </div>
    <a href="/apps" class="mt-4 inline-block text-sm font-semibold text-ink hover:underline">Ver todas las aplicaciones →</a>
  </section>

  <section class="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 pt-8 sm:grid-cols-2 sm:px-6">
    <div class="rounded-xl border border-edge bg-surface p-4">
      <p class="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Recursos recientes</p>
      {recentResources.length === 0 && <p class="mt-3 text-sm text-body">Sin recursos todavía.</p>}
      {recentResources.map((resource) => (
        <a
          href={resource.url ?? `/files/${resource.filePath}`}
          target="_blank"
          rel="noopener"
          class="mt-2 block text-sm font-medium text-body hover:text-ink"
        >
          {resource.name}
        </a>
      ))}
      <a href="/recursos" class="mt-3 inline-block text-xs font-semibold text-ink hover:underline">Todos los recursos →</a>
    </div>
    <div class="rounded-xl border border-edge bg-surface p-4">
      <p class="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Directorio</p>
      {contacts.length === 0 && <p class="mt-3 text-sm text-body">Sin contactos todavía.</p>}
      {contacts.map((contact) => (
        <p class="mt-2 text-sm font-medium text-body">{contact.name} · <span class="text-muted">{contact.department}</span></p>
      ))}
      <a href="/contactos" class="mt-3 inline-block text-xs font-semibold text-ink hover:underline">Todo el directorio →</a>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-4 pt-10 pb-4 sm:px-6">
    <TickRuler counts={totals} />
  </section>
</Layout>
```

- [ ] **Step 4: Páginas de listado**

Rediseñar con el mismo lenguaje (contenedor `max-w-6xl`, encabezado de página con eyebrow mono + título extrabold, tarjetas `bg-surface border-edge rounded-xl`):

- `apps.astro`: secciones por categoría (`appCategories`), grid de `AppCard`, estado vacío por categoría omitida (solo mostrar categorías con apps; si no hay ninguna app, mensaje global "Aún no hay aplicaciones registradas.").
- `recursos.astro`: `ResourceCard` restilizado — icono por tipo con etiqueta mono (MANUAL/PLANTILLA/CARPETA/ENLACE), url calculada `resource.url ?? '/files/' + resource.filePath`.
- `contactos.astro`: `ContactCard` restilizado — nombre bold, cargo/departamento muted, teléfono y correo como enlaces `tel:`/`mailto:` mono.
- `empresas.astro`: `CompanyCard` restilizado — borde superior de 3px con `company.color`, nombre bold, segmento mono uppercase, slogan en itálica de cuerpo, descripción.
- `SectionHeader.astro`: eyebrow en mono uppercase tracking amplio + título `font-extrabold`; sin descripciones largas.

Borrar `src/data/{apps,resources,contacts,companies}.ts` y hacer que `scripts/seed-data.ts` sea autocontenido (declara los arrays con los tipos de `src/data/types.ts`). Borrar `AppCardContent.vue` si quedó sin referencias, y `.blob`/`.blob-drift` de `global.css`.

- [ ] **Step 5: Verificar**

Run: `npx astro check && npm run build && npx vitest run`
Expected: todo verde. En dev: revisar las 5 páginas en desktop y móvil (viewport estrecho), verificar LED de colores, ⌘K, tick ruler, estados vacíos (probar con `DATABASE_PATH=data/empty-test.db npm run dev` sin seed y borrar `data/empty-test.db*` al terminar).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: redesign public pages with silver cockpit launcher"
```

---

### Task 16: Verificación final y README

**Files:**
- Create: `README.md`

- [ ] **Step 1: README con setup y env vars**

```markdown
# CAP Suite

Portal interno de Grupo Empresarial CAP. Astro SSR + SQLite.

## Desarrollo

​```bash
npm install
npm run seed        # primera vez: migra los datos iniciales a SQLite
ADMIN_PASSWORD=... SESSION_SECRET=... npm run dev
​```

## Producción

​```bash
npm run build
ADMIN_PASSWORD=... SESSION_SECRET=... node dist/server/entry.mjs
​```

| Variable | Uso | Default |
|---|---|---|
| `ADMIN_PASSWORD` | contraseña del panel `/admin` | — (obligatoria) |
| `SESSION_SECRET` | firma de la cookie de sesión | — (obligatoria) |
| `DATABASE_PATH` | archivo SQLite | `data/cap-suite.db` |
| `UPLOADS_DIR` | archivos subidos | `uploads` |
| `HOST` / `PORT` | bind del servidor | `0.0.0.0` / `4321` |

El panel de administración vive en `/admin`. `data/` y `uploads/` deben respaldarse.
```

(Quitar los ​ zero-width al copiar: los fences internos van con backticks normales.)

- [ ] **Step 2: Suite completa de verificación**

```bash
npx vitest run
npx astro check
npm run build
ADMIN_PASSWORD=test1234 SESSION_SECRET=devsecret PORT=4321 node dist/server/entry.mjs &
sleep 2
curl -s -o /dev/null -w '%{http_code}\n' localhost:4321/                 # 200
curl -s -o /dev/null -w '%{http_code}\n' localhost:4321/admin            # 302
curl -s -o /dev/null -w '%{http_code}\n' localhost:4321/files/logos/fastbi.png  # 200
```

Expected: todo verde. Flujo manual completo: login → crear app con logo → aparece en `/` y `/apps` → editar → eliminar. Matar el proceso.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add setup and environment documentation"
```

---

## Self-Review (hecho al escribir el plan)

- **Cobertura del spec:** SSR+adapter (T1), sesión (T2), esquema/CRUD (T3-4), uploads+límites+traversal (T5), seed+categorías fijas+páginas desde BD (T6), middleware+login+delay 500ms (T7), `/files/*` (T8), actions validadas+borrado de huérfanos (T9), admin layout/dashboard (T10), listados+modal+dropzone+reorden+toggle (T11-12), tokens+fuentes+línea ambiental (T13), ⌘K (T14), lanzador+LED+ticks+estados vacíos+limpieza (T15), README+env+verificación total (T16). Sin huecos.
- **Tipos consistentes:** `companyLabel/logoPath/filePath/sortOrder` camelCase en filas; acciones `create/update/remove/move/toggleFeatured`; `logoSrc` y `resolveUploadPath` usados con esos nombres en todas las tasks.
- **Nota de orden:** Tasks 10-12 (admin) usan tokens definidos en T13; funcionan antes de T13 pero se ven sin estilo final. Ejecutar en orden numérico es válido; el estilo cierra en T13-15.
