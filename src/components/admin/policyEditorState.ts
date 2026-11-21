import type { AttachmentKind } from '../../data/policies';
import type { PolicyAttachment, PolicyDetail } from '../../lib/policies';

const SCALAR_FIELD_NAMES = [
  'title',
  'department',
  'type',
  'classification',
  'status',
  'owner',
  'approver',
  'nextReviewDate',
  'summary',
  'objective',
  'scope',
  'relatedDocuments',
  'indicators',
] as const;

export type ScalarFieldName = (typeof SCALAR_FIELD_NAMES)[number];

export interface GuidelineDraft { key: string; title: string; body: string }

export interface AttachmentDraft {
  key: string;
  kind: AttachmentKind;
  label: string;
  url: string;
  /** Archivo ya guardado en el servidor; se conserva mientras no se suba otro. */
  filePath: string | null;
  file: File | null;
}

export interface VersionDraft { key: string; version: string; date: string; author: string; reason: string }

export interface PolicyEditorState {
  fields: Record<ScalarFieldName, string>;
  officialFile: File | null;
  guidelines: GuidelineDraft[];
  attachments: AttachmentDraft[];
  versions: VersionDraft[];
}

// Clave estable por elemento: al reordenar, Vue mueve el bloque entero (con su archivo elegido).
// Las guardadas dependen solo de su posición para que servidor y navegador rendericen lo mismo;
// las nuevas solo se crean en el navegador.
let lastNewKey = 0;
const nextKey = () => `new-${++lastNewKey}`;
const storedKey = (index: number) => `stored-${index}`;

export const createGuideline = (): GuidelineDraft => ({ key: nextKey(), title: '', body: '' });

export const createAttachment = (): AttachmentDraft => ({
  key: nextKey(),
  kind: 'file',
  label: '',
  url: '',
  filePath: null,
  file: null,
});

export const createVersion = (): VersionDraft => ({ key: nextKey(), version: '', date: '', author: '', reason: '' });

function attachmentDraftOf(attachment: PolicyAttachment, index: number): AttachmentDraft {
  return { ...attachment, key: storedKey(index), url: attachment.url ?? '', file: null };
}

export function createEditorState(policy: PolicyDetail | null): PolicyEditorState {
  const fields = Object.fromEntries(
    SCALAR_FIELD_NAMES.map((name) => [name, policy?.[name] ?? '']),
  ) as Record<ScalarFieldName, string>;
  if (!policy) fields.status = 'draft';
  return {
    fields,
    officialFile: null,
    guidelines: (policy?.guidelines ?? []).map((guideline, index) => ({ ...guideline, key: storedKey(index) })),
    attachments: (policy?.attachments ?? []).map(attachmentDraftOf),
    versions: (policy?.versions ?? []).map((version, index) => ({ ...version, key: storedKey(index) })),
  };
}

/** Nombre del archivo guardado, sin la carpeta de subidas. */
export function storedFileName(filePath: string): string {
  return filePath.split('/').pop() ?? filePath;
}

/** Texto comparable del estado; un archivo cuenta por su nombre y tamaño. */
export function snapshotOf(state: PolicyEditorState): string {
  return JSON.stringify(state, (_key, value) => (value instanceof File ? `${value.name}:${value.size}` : value));
}

function attachmentPayload(attachment: AttachmentDraft, newFiles: File[]) {
  const { kind, label } = attachment;
  if (kind !== 'file') return { kind, label, url: attachment.url };
  if (!attachment.file) return { kind, label, filePath: attachment.filePath };
  newFiles.push(attachment.file);
  return { kind, label, fileIndex: newFiles.length - 1 };
}

/**
 * FormData de policies.save: escalares sueltos, listas como JSON y los archivos nuevos de
 * anexos repetidos bajo attachmentFiles; cada anexo nuevo apunta al suyo con fileIndex.
 */
export function buildPolicyFormData(state: PolicyEditorState, policyId: number | null): FormData {
  const formData = new FormData();
  if (policyId !== null) formData.set('id', String(policyId));
  for (const name of SCALAR_FIELD_NAMES) formData.set(name, state.fields[name]);
  if (state.officialFile) formData.set('officialFile', state.officialFile);
  formData.set('guidelines', JSON.stringify(state.guidelines.map(({ title, body }) => ({ title, body }))));
  const newFiles: File[] = [];
  const attachments = state.attachments.map((attachment) => attachmentPayload(attachment, newFiles));
  formData.set('attachments', JSON.stringify(attachments));
  newFiles.forEach((file) => formData.append('attachmentFiles', file));
  formData.set('versions', JSON.stringify(state.versions.map(({ version, date, author, reason }) => ({ version, date, author, reason }))));
  return formData;
}
