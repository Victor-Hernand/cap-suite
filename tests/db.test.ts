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
