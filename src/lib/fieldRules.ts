// Reglas de campo compartidas por el formulario (maxlength, pistas) y las
// acciones del servidor (zod), para que ambos lados validen lo mismo.

export type UploadKind = 'logos' | 'docs' | 'manual';

const MEGABYTE = 1024 * 1024;

interface UploadRule {
  maxBytes: number;
  extensions: string[];
  description: string;
  /** Si la ruta pública /files lo sirve sin sesión. */
  isPublic: boolean;
}

// Única fuente de los límites de subida: la valida el servidor (uploads.ts) y la
// muestran el selector de archivo y los mensajes del formulario.
export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  logos: {
    maxBytes: 2 * MEGABYTE,
    extensions: ['.png', '.svg', '.jpg', '.jpeg', '.webp'],
    description: 'PNG/SVG/JPG/WebP',
    isPublic: true,
  },
  docs: {
    maxBytes: 20 * MEGABYTE,
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    description: 'PDF u Office',
    isPublic: true,
  },
  // Solo se sirve tras el login, desde /admin/manual/pdf.
  manual: { maxBytes: 20 * MEGABYTE, extensions: ['.pdf'], description: 'PDF', isPublic: false },
};

export function uploadLimitLabel(kind: UploadKind): string {
  return `${UPLOAD_RULES[kind].maxBytes / MEGABYTE} MB`;
}

export const FIELD_MAX = {
  name: 80,
  shortText: 80,
  description: 300,
  slogan: 120,
  email: 120,
  phone: 20,
  extension: 10,
  url: 500,
  badge: 20,
  color: 7,
} as const;

// Lo que se puede teclear en un teléfono; normalizePhone luego exige el formato hondureño.
export const PHONE_DISALLOWED_CHARS = /[^\d+\s-]/g;

// Honduras: 8 dígitos, con o sin guion, con +504 opcional.
const HONDURAS_PHONE = /^(?:\+?504)?(\d{4})(\d{4})$/;

export const PHONE_HINT = 'Formato 9999-9999 o +504 9999-9999';

/** Devuelve el teléfono como "+504 9999-9999", o null si no es un número hondureño válido. */
export function normalizePhone(raw: string): string | null {
  const digitsOnly = raw.replace(/[\s-]/g, '');
  const match = HONDURAS_PHONE.exec(digitsOnly);
  return match ? `+504 ${match[1]}-${match[2]}` : null;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Clave de comparación para detectar duplicados: sin espacios extremos ni mayúsculas. */
export function duplicateKey(value: string): string {
  return value.trim().toLocaleLowerCase('es');
}
