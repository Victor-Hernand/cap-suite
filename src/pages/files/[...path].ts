import type { APIRoute } from 'astro';
import { fileResponse } from '../../lib/fileResponse';
import { resolvePublicUploadPath } from '../../lib/uploads';

export const GET: APIRoute = ({ params }) => fileResponse(resolvePublicUploadPath(params.path ?? ''));
