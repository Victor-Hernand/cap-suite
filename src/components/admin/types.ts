import type { UploadKind } from '../../lib/fieldRules';

export type Row = Record<string, unknown> & { id: number };

export interface Column {
  key: string;
  label: string;
  kind?: 'text' | 'muted' | 'swatch' | 'toggle' | 'link';
  /** Con `kind: 'link'`, la clave de la fila que trae la dirección del enlace. */
  hrefKey?: string;
}

/** Opción del menú ⋮ de una fila: navega con `href` o se emite su `key`. */
export interface RowAction {
  key: string;
  label: string;
  icon: string;
  href?: string;
  danger?: boolean;
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  kind: 'text' | 'url' | 'email' | 'tel' | 'date' | 'textarea' | 'select' | 'toggle' | FileFieldKind;
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
}

export type Collection =
  | 'apps'
  | 'resources'
  | 'contacts'
  | 'companies'
  | 'manuals'
  | 'departments'
  | 'departmentProcesses'
  | 'departmentFormats'
  | 'departmentLinks'
  | 'departmentNotices';

/** Colecciones sin orden manual (sin acción move). El proxy de `actions` del cliente no permite preguntárselo. */
export const UNSORTED_COLLECTIONS: readonly Collection[] = ['departmentNotices'];

/** Tipo de subida (reglas en fieldRules.UPLOAD_RULES) que corresponde a cada campo de archivo. */
const FILE_FIELD_UPLOAD_KIND = {
  'file-logo': 'logos',
  'file-doc': 'docs',
  'file-manual': 'manual',
  'file-policy': 'policies',
} as const satisfies Record<string, UploadKind>;

type FileFieldKind = keyof typeof FILE_FIELD_UPLOAD_KIND;

/** Tipo de subida del campo, o null si no es un campo de archivo. */
export function uploadKindOf(field: Field): UploadKind | null {
  return field.kind in FILE_FIELD_UPLOAD_KIND ? FILE_FIELD_UPLOAD_KIND[field.kind as FileFieldKind] : null;
}
