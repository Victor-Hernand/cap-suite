import type { APIRoute } from 'astro';
import { getDb, getManual } from '../../../../lib/db';
import { fileResponse } from '../../../../lib/fileResponse';
import { slugify } from '../../../../lib/slug';
import { resolveUploadPath } from '../../../../lib/uploads';

// Protegida por el middleware (todo /admin exige sesión): los manuales no son públicos.
// La página enlaza con ?v=<archivo>; cada subida tiene nombre nuevo, así que la
// caché del navegador puede ser permanente sin servir un PDF viejo.
export const GET: APIRoute = ({ params }) => {
  const manual = getManual(getDb(), Number(params.id));
  if (!manual?.pdfPath) return fileResponse(null);
  return fileResponse(resolveUploadPath(manual.pdfPath), {
    'Content-Disposition': `inline; filename="${slugify(manual.title) || 'manual'}.pdf"`,
    'Cache-Control': 'private, max-age=31536000, immutable',
  });
};
