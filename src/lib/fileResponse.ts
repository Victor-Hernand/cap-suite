import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { Readable } from 'node:stream';

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

const NOT_FOUND = () => new Response('No encontrado', { status: 404 });

/** Transmite un archivo ya resuelto dentro de uploads; 404 si no existe o no es un archivo. */
export async function fileResponse(absolutePath: string | null, extraHeaders: Record<string, string> = {}): Promise<Response> {
  if (!absolutePath) return NOT_FOUND();
  try {
    const info = await stat(absolutePath);
    if (!info.isFile()) return NOT_FOUND();
    const contentType = CONTENT_TYPES[extname(absolutePath).toLowerCase()] ?? 'application/octet-stream';
    return new Response(Readable.toWeb(createReadStream(absolutePath)) as ReadableStream, {
      headers: { 'Content-Type': contentType, 'Content-Length': String(info.size), ...extraHeaders },
    });
  } catch {
    return NOT_FOUND();
  }
}
