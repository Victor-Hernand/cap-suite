import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { readEnv } from './env';
import { slugify } from './slug';
import { UPLOAD_RULES, uploadLimitLabel, type UploadKind } from './fieldRules';

export type { UploadKind };

export function uploadsDir(): string {
  return resolve(readEnv('UPLOADS_DIR') ?? 'uploads');
}

export function validateUpload(file: File, kind: UploadKind): string | null {
  const extension = extname(file.name).toLowerCase();
  const rules = UPLOAD_RULES[kind];
  if (!rules.extensions.includes(extension)) {
    return `Tipo de archivo no permitido (${extension || 'sin extensión'}). Sube un archivo ${rules.extensions.join(', ')}.`;
  }
  if (file.size > rules.maxBytes) {
    return `El archivo pesa más de ${uploadLimitLabel(kind)}, el máximo permitido. Comprímelo o usa un archivo más liviano.`;
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
