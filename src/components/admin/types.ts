import type { UploadKind } from '../../lib/fieldRules';

export type Row = Record<string, unknown> & { id: number };

export interface Column {
  key: string;
  label: string;
  kind?: 'text' | 'muted' | 'led' | 'toggle';
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  kind: 'text' | 'url' | 'email' | 'tel' | 'textarea' | 'select' | 'toggle' | FileFieldKind;
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
}

export type Collection = 'apps' | 'resources' | 'contacts' | 'companies';

/** Tipo de subida (reglas en fieldRules.UPLOAD_RULES) que corresponde a cada campo de archivo. */
const FILE_FIELD_UPLOAD_KIND = {
  'file-logo': 'logos',
  'file-doc': 'docs',
  'file-manual': 'manual',
} as const satisfies Record<string, UploadKind>;

type FileFieldKind = keyof typeof FILE_FIELD_UPLOAD_KIND;

/** Tipo de subida del campo, o null si no es un campo de archivo. */
export function uploadKindOf(field: Field): UploadKind | null {
  return field.kind in FILE_FIELD_UPLOAD_KIND ? FILE_FIELD_UPLOAD_KIND[field.kind as FileFieldKind] : null;
}
