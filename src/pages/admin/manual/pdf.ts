import type { APIRoute } from 'astro';
import { getDb, getManual } from '../../../lib/db';
import { fileResponse } from '../../../lib/fileResponse';
import { resolveUploadPath } from '../../../lib/uploads';

// Protegida por el middleware (todo /admin exige sesión): el manual no es público.
// La página enlaza con ?v=<archivo>; cada subida tiene nombre nuevo, así que la
// caché del navegador puede ser permanente sin servir un PDF viejo.
export const GET: APIRoute = () => {
  const { pdfPath } = getManual(getDb());
  return fileResponse(pdfPath ? resolveUploadPath(pdfPath) : null, {
    'Content-Disposition': 'inline; filename="manual-cap-suite.pdf"',
    'Cache-Control': 'private, max-age=31536000, immutable',
  });
};
