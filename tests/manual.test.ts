import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { loomEmbedUrl } from '../src/lib/loom';
import Database from 'better-sqlite3';
import { openDb, counts, listManuals, getManual, createManual, updateManual, deleteManual } from '../src/lib/db';
import { validateUpload, storeUpload, resolvePublicUploadPath, resolveUploadPath } from '../src/lib/uploads';

const LOOM_ID = '0123456789abcdef0123456789abcdef';

test('loomEmbedUrl convierte enlaces de compartir y de embed', () => {
  const embed = `https://www.loom.com/embed/${LOOM_ID}`;
  expect(loomEmbedUrl(`https://www.loom.com/share/${LOOM_ID}`)).toBe(embed);
  expect(loomEmbedUrl(`https://loom.com/share/${LOOM_ID}?sid=abc-123`)).toBe(embed);
  expect(loomEmbedUrl(`  https://www.loom.com/embed/${LOOM_ID}  `)).toBe(embed);
  expect(loomEmbedUrl(`https://www.loom.com/share/Manual-del-admin-${LOOM_ID}`)).toBe(embed);
});

test('loomEmbedUrl rechaza lo que no es un video de Loom', () => {
  expect(loomEmbedUrl(`https://evil.com/share/${LOOM_ID}`)).toBeNull();
  expect(loomEmbedUrl(`https://www.loom.com.evil.com/share/${LOOM_ID}`)).toBeNull();
  expect(loomEmbedUrl('https://www.loom.com/share/corto')).toBeNull();
  expect(loomEmbedUrl(`javascript:alert(1)//loom.com/share/${LOOM_ID}`)).toBeNull();
  expect(loomEmbedUrl('no es un enlace')).toBeNull();
  expect(loomEmbedUrl(null)).toBeNull();
});

test('manuals CRUD, orden y conteo', () => {
  const db = openDb(':memory:');
  const video = createManual(db, {
    title: 'Uso del panel',
    description: 'Recorrido general',
    videoUrl: `https://www.loom.com/share/${LOOM_ID}`,
    pdfPath: null,
  });
  const pdf = createManual(db, { title: 'Recursos', description: null, videoUrl: null, pdfPath: 'manual/recursos-ab12cd34.pdf' });

  expect(listManuals(db).map((manual) => manual.title)).toEqual(['Uso del panel', 'Recursos']);
  expect(counts(db).manuals).toBe(2);

  updateManual(db, video.id, { title: 'Uso del panel', description: null, videoUrl: null, pdfPath: 'manual/uso-ab12cd34.pdf' });
  expect(getManual(db, video.id)).toMatchObject({ videoUrl: null, pdfPath: 'manual/uso-ab12cd34.pdf' });

  expect(deleteManual(db, pdf.id)?.pdfPath).toBe('manual/recursos-ab12cd34.pdf');
  expect(getManual(db, pdf.id)).toBeNull();
});

test('el manual único de la versión anterior pasa a la tabla manuals', () => {
  const path = join(dir, 'legacy.db');
  const legacy = new Database(path);
  legacy.exec('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  legacy.prepare('INSERT INTO settings (key, value) VALUES (?, ?), (?, ?)').run(
    'manual_video_url', `https://www.loom.com/share/${LOOM_ID}`,
    'manual_pdf_path', 'manual/guia-ab12cd34.pdf',
  );
  legacy.close();

  const db = openDb(path);
  expect(listManuals(db)).toMatchObject([
    { title: 'Manual del panel', videoUrl: `https://www.loom.com/share/${LOOM_ID}`, pdfPath: 'manual/guia-ab12cd34.pdf' },
  ]);
  const settingsTable = db.prepare("SELECT name FROM sqlite_master WHERE name = 'settings'").get();
  expect(settingsTable).toBeUndefined();
  db.close();

  expect(listManuals(openDb(path))).toHaveLength(1);
});

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cap-manual-'));
  process.env.UPLOADS_DIR = dir;
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  delete process.env.UPLOADS_DIR;
});

test('el manual solo admite PDF', () => {
  expect(validateUpload(new File([new Uint8Array(10)], 'guia.pdf'), 'manual')).toBeNull();
  expect(validateUpload(new File([new Uint8Array(10)], 'guia.docx'), 'manual')).toMatch(/no permitido/i);
});

test('los archivos del manual no se sirven por la ruta pública', async () => {
  const manualPath = await storeUpload(new File([new Uint8Array(10)], 'guia.pdf'), 'manual');
  const docPath = await storeUpload(new File([new Uint8Array(10)], 'otro.pdf'), 'docs');

  expect(resolveUploadPath(manualPath)).not.toBeNull();
  expect(resolvePublicUploadPath(manualPath)).toBeNull();
  expect(resolvePublicUploadPath(`docs/../${manualPath}`)).toBeNull();
  expect(resolvePublicUploadPath(manualPath.toUpperCase().replace('.PDF', '.pdf'))).toBeNull();
  expect(resolvePublicUploadPath(docPath)).not.toBeNull();
});
