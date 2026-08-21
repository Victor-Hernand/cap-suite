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
