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
