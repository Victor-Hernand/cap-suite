import type { Field, FieldOption } from './types';
import type { ScalarFieldName } from './policyEditorState';
import { departmentOptionsOf, type Department } from '../../data/departments';
import { policyClassifications, policyTypes, type ListOption } from '../../data/policies';
import { FIELD_MAX } from '../../lib/fieldRules';

type EditorField = Field & { name: ScalarFieldName };

const optionsOf = (list: readonly ListOption[]): FieldOption[] => list.map(({ id, label }) => ({ value: id, label }));

export function policyGeneralFields(departments: Department[]): EditorField[] {
  return [
    { name: 'title', label: 'Título', kind: 'text', required: true, maxLength: FIELD_MAX.policyTitle },
    { name: 'department', label: 'Departamento', kind: 'select', required: true, options: departmentOptionsOf(departments) },
    { name: 'type', label: 'Tipo de documento', kind: 'select', required: true, options: optionsOf(policyTypes) },
    {
      name: 'classification',
      label: 'Clasificación',
      kind: 'select',
      required: true,
      options: optionsOf(policyClassifications),
    },
    { name: 'owner', label: 'Responsable', kind: 'text', maxLength: FIELD_MAX.shortText },
    { name: 'approver', label: 'Aprobador', kind: 'text', maxLength: FIELD_MAX.shortText },
    { name: 'nextReviewDate', label: 'Próxima revisión', kind: 'date' },
  ];
}

export const policyContentFields: EditorField[] = [
  { name: 'summary', label: 'Resumen', kind: 'textarea', maxLength: FIELD_MAX.longText },
  { name: 'objective', label: 'Objetivo', kind: 'textarea', maxLength: FIELD_MAX.longText },
  { name: 'scope', label: 'Ámbito de aplicación', kind: 'textarea', maxLength: FIELD_MAX.longText },
  { name: 'relatedDocuments', label: 'Documentos relacionados', kind: 'textarea', maxLength: FIELD_MAX.longText },
  { name: 'indicators', label: 'Indicadores', kind: 'textarea', maxLength: FIELD_MAX.longText },
];

/** Campos de archivo de policies.save, para revisar su tamaño antes de subirlos. */
export const policyUploadFields: Field[] = [
  { name: 'officialFile', label: 'Documento oficial', kind: 'file-policy' },
  { name: 'attachmentFiles', label: 'Anexo', kind: 'file-policy' },
];
