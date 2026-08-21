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
  try {
    const info = await stat(absolutePath);
    if (!info.isFile()) return new Response('No encontrado', { status: 404 });
    const contentType = CONTENT_TYPES[extname(absolutePath).toLowerCase()] ?? 'application/octet-stream';
    return new Response(Readable.toWeb(createReadStream(absolutePath)) as ReadableStream, {
      headers: { 'Content-Type': contentType, 'Content-Length': String(info.size) },
    });
  } catch {
    return new Response('No encontrado', { status: 404 });
  }
};
