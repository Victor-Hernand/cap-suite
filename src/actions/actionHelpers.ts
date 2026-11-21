import { ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { deleteUpload, storeUpload, validateUpload, type UploadKind } from '../lib/uploads';

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
