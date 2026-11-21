// Reglas de campo compartidas por el formulario (maxlength, pistas) y las
// acciones del servidor (zod), para que ambos lados validen lo mismo.

export type UploadKind = 'logos' | 'docs' | 'manual' | 'policies';

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
  policies: {
    maxBytes: 20 * MEGABYTE,
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.webp'],
    description: 'PDF, Office o imagen',
    isPublic: true,
  },
};

// Astro limita el cuerpo entero de la acción (actionBodySizeLimit en astro.config.mjs), no
// cada archivo: el editor de políticas envía el oficial y todos los anexos nuevos juntos.
export const UPLOAD_TOTAL_MAX_BYTES = 20 * MEGABYTE;

function megabytesLabel(bytes: number): string {
  return `${(bytes / MEGABYTE).toLocaleString('es', { maximumFractionDigits: 1 })} MB`;
}

/** Mensaje si los archivos del formulario suman más de lo que admite un guardado, o null. */
export function oversizedUploadTotalMessage(formData: FormData): string | null {
  const totalBytes = [...formData.values()]
    .filter((value): value is File => value instanceof File)
    .reduce((sum, file) => sum + file.size, 0);
  if (totalBytes <= UPLOAD_TOTAL_MAX_BYTES) return null;
  return `Los archivos nuevos suman ${megabytesLabel(totalBytes)}; el máximo por guardado es ${megabytesLabel(UPLOAD_TOTAL_MAX_BYTES)}. Guarda y agrega los demás después.`;
}

export function uploadLimitLabel(kind: UploadKind): string {
  return megabytesLabel(UPLOAD_RULES[kind].maxBytes);
}

/** Atributo accept y pista del selector de archivo, p. ej. "PDF u Office, máx. 20 MB". */
export function uploadPickerRules(kind: UploadKind): { accept: string; hint: string } {
  const rules = UPLOAD_RULES[kind];
  return { accept: rules.extensions.join(','), hint: `${rules.description}, máx. ${uploadLimitLabel(kind)}` };
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
  policyTitle: 160,
  longText: 2000,
  guidelineBody: 1500,
} as const;

export const VERSION_PATTERN = /^v\d+\.\d+$/;

/** Fecha `YYYY-MM-DD` que existe en el calendario (rechaza 2026-02-30). */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

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
