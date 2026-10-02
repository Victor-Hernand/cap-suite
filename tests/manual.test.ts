import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { loomEmbedUrl } from '../src/lib/loom';
import { openDb, getManual, saveManual } from '../src/lib/db';
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

test('getManual arranca vacío y saveManual guarda y limpia', () => {
  const db = openDb(':memory:');
  expect(getManual(db)).toEqual({ videoUrl: null, pdfPath: null });

  saveManual(db, { videoUrl: `https://www.loom.com/share/${LOOM_ID}`, pdfPath: 'manual/guia-ab12cd34.pdf' });
  expect(getManual(db)).toEqual({
    videoUrl: `https://www.loom.com/share/${LOOM_ID}`,
    pdfPath: 'manual/guia-ab12cd34.pdf',
  });

  saveManual(db, { videoUrl: null, pdfPath: 'manual/guia-ab12cd34.pdf' });
  expect(getManual(db).videoUrl).toBeNull();
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
