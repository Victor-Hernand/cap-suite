import { ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { deleteUpload, storeUpload, validateUpload, type UploadKind } from '../lib/uploads';
import { getDb, hasDuplicate, UNIQUE_COLUMN, type UniqueTable } from '../lib/db';

export const idInput = z.object({ id: z.number().int().positive() });

export const moveInput = idInput.extend({ direction: z.enum(['up', 'down']) });

export function notFound(message: string): ActionError {
  return new ActionError({ code: 'NOT_FOUND', message });
}

export function badRequest(message: string): ActionError {
  return new ActionError({ code: 'BAD_REQUEST', message });
}

export function hasFile(file?: File): file is File {
  return !!file && file.size > 0;
}

/** Valida y guarda el archivo nuevo; el anterior se borra solo después de guardar el nuevo. */
export async function replaceUpload(file: File, kind: UploadKind, previousPath?: string | null): Promise<string> {
  const error = validateUpload(file, kind);
  if (error) throw badRequest(error);
  const storedPath = await storeUpload(file, kind);
  if (previousPath) deleteUpload(previousPath);
  return storedPath;
}

export async function resolveResourceSource(
  form: { url?: string; file?: File },
  previous?: { url: string | null; filePath: string | null },
  entity = 'El recurso',
  uploadKind: UploadKind = 'docs',
) {
  if (hasFile(form.file)) {
    return { url: null, filePath: await replaceUpload(form.file, uploadKind, previous?.filePath) };
  }
  const url = form.url?.trim();
  if (url) {
    if (previous?.filePath) deleteUpload(previous.filePath);
    return { url, filePath: null };
  }
  if (previous && (previous.url || previous.filePath)) return previous;
  throw badRequest(`${entity} necesita un enlace o un archivo: escribe la dirección web o sube el documento.`);
}

const DUPLICATE_MESSAGES: Record<UniqueTable, (value: string) => string> = {
  apps: (value) => `Ya existe una aplicación llamada «${value}». Usa otro nombre o edita la existente.`,
  resources: (value) => `Ya existe un recurso llamado «${value}». Usa otro nombre o edita el existente.`,
  contacts: (value) => `Ya existe un contacto con el correo ${value}. Edita el contacto existente.`,
  companies: (value) => `Ya existe una empresa llamada «${value}». Usa otro nombre o edita la existente.`,
  manuals: (value) => `Ya existe un manual llamado «${value}». Usa otro título o edita el existente.`,
  departments: (value) => `Ya existe un departamento llamado «${value}». Usa otro nombre o edita el existente.`,
};

/** Rechaza el alta o edición si otro registro ya usa el valor único de la colección. */
export function assertUnique<T extends UniqueTable>(
  table: T,
  form: Record<(typeof UNIQUE_COLUMN)[T], string>,
  excludeId?: number,
): void {
  const value = form[UNIQUE_COLUMN[table]];
  if (hasDuplicate(getDb(), table, value, excludeId)) {
    throw new ActionError({ code: 'CONFLICT', message: DUPLICATE_MESSAGES[table](value) });
  }
}
