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
  kind: 'text' | 'url' | 'email' | 'tel' | 'textarea' | 'select' | 'toggle' | 'file-logo' | 'file-doc';
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
}

export type Collection = 'apps' | 'resources' | 'contacts' | 'companies';

/** Tipo de subida (reglas en fieldRules.UPLOAD_RULES) que corresponde a cada campo de archivo. */
export const FILE_FIELD_UPLOAD_KIND = { 'file-logo': 'logos', 'file-doc': 'docs' } as const;
