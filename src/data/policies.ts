export interface ListOption<Id extends string = string> {
  id: Id;
  label: string;
}

export const policyTypes = [
  { id: 'policy', label: 'Política' },
  { id: 'procedure', label: 'Procedimiento' },
  { id: 'instruction', label: 'Instructivo' },
  { id: 'guideline', label: 'Lineamiento' },
  { id: 'infographic', label: 'Infografía' },
] as const;

export const policyClassifications = [
  { id: 'public', label: 'Pública' },
  { id: 'internal', label: 'Interna' },
] as const;

/** `visible`: el estado aparece en las superficies públicas (biblioteca, ficha, departamento, búsqueda). */
export const policyStatuses = [
  { id: 'draft', label: 'Borrador', visible: false },
  { id: 'active', label: 'Vigente', visible: true },
  { id: 'under-review', label: 'En revisión', visible: true },
  { id: 'obsolete', label: 'Obsoleta', visible: true },
] as const;

export const visiblePolicyStatuses = policyStatuses.filter((status) => status.visible);
export const visiblePolicyStatusIds: string[] = visiblePolicyStatuses.map((status) => status.id);

export const attachmentKinds = [
  { id: 'file', label: 'Archivo' },
  { id: 'link', label: 'Enlace' },
  { id: 'video', label: 'Video' },
] as const;

export type PolicyType = (typeof policyTypes)[number]['id'];
export type PolicyClassification = (typeof policyClassifications)[number]['id'];
export type PolicyStatus = (typeof policyStatuses)[number]['id'];
export type AttachmentKind = (typeof attachmentKinds)[number]['id'];

export function labelOf(list: readonly ListOption[], id: string): string {
  return list.find((option) => option.id === id)?.label ?? id;
}

export function policyCountLabel(total: number): string {
  return `${total} ${total === 1 ? 'política' : 'políticas'}`;
}
