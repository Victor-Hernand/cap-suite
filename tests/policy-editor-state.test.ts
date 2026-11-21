import { expect, test } from 'vitest';
import { z } from 'astro/zod';
import { policyFormFields } from '../src/actions/formSchemas';
import {
  buildPolicyFormData,
  createAttachment,
  createEditorState,
  snapshotOf,
} from '../src/components/admin/policyEditorState';
import type { PolicyDetail } from '../src/lib/policies';
import { draftInput } from './policyFixtures';

function storedPolicy(): PolicyDetail {
  return {
    ...draftInput({
      attachments: [{ kind: 'file', label: 'Formato', url: null, filePath: 'policies/formato-abc.pdf' }],
      versions: [{ version: 'v1.0', date: '2025-01-10', author: 'Mejora Continua', reason: 'Primera versión' }],
    }),
    id: 7,
    slug: 'reuniones-virtuales',
    version: null,
    effectiveDate: null,
  };
}

function pdf(name: string): File {
  return new File(['%PDF'], name, { type: 'application/pdf' });
}

/** Lo que el parser de formularios de Astro entrega a la acción: un valor por campo y attachmentFiles como lista. */
function astroFormInput(formData: FormData): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const key of formData.keys()) input[key] = formData.get(key) || undefined;
  input.attachmentFiles = formData.getAll('attachmentFiles');
  delete input.id;
  return input;
}

test('una política nueva arranca en borrador y sin cambios pendientes', () => {
  const state = createEditorState(null);
  expect(state.fields.status).toBe('draft');
  expect(snapshotOf(state)).toBe(snapshotOf(createEditorState(null)));
});

test('elegir un archivo cuenta como cambio pendiente', () => {
  const state = createEditorState(storedPolicy());
  const before = snapshotOf(state);
  state.officialFile = pdf('oficial.pdf');
  expect(snapshotOf(state)).not.toBe(before);
});

test('los anexos existentes conservan su archivo y los nuevos apuntan a attachmentFiles', () => {
  const state = createEditorState(storedPolicy());
  state.attachments.push(
    { ...createAttachment(), label: 'Instructivo', file: pdf('instructivo.pdf') },
    { ...createAttachment(), kind: 'link', label: 'Portal', url: 'https://cap.hn' },
    { ...createAttachment(), label: 'Anexo B', file: pdf('anexo-b.pdf') },
  );
  const formData = buildPolicyFormData(state, 7);

  expect(formData.get('id')).toBe('7');
  expect(JSON.parse(String(formData.get('attachments')))).toEqual([
    { kind: 'file', label: 'Formato', filePath: 'policies/formato-abc.pdf' },
    { kind: 'file', label: 'Instructivo', fileIndex: 0 },
    { kind: 'link', label: 'Portal', url: 'https://cap.hn' },
    { kind: 'file', label: 'Anexo B', fileIndex: 1 },
  ]);
  expect(formData.getAll('attachmentFiles').map((file) => (file as File).name)).toEqual(['instructivo.pdf', 'anexo-b.pdf']);
  expect(JSON.parse(String(formData.get('versions')))).toEqual(storedPolicy().versions);
});

test('el FormData del editor pasa la validación de policies.save', () => {
  const state = createEditorState(storedPolicy());
  state.guidelines.push({ key: 'test', title: 'Puntualidad', body: 'Conectarse a tiempo.' });
  state.attachments.push({ ...createAttachment(), label: 'Nuevo', file: pdf('nuevo.pdf') });
  const result = z.object(policyFormFields).safeParse(astroFormInput(buildPolicyFormData(state, 7)));
  expect(result.success).toBe(true);
  expect(result.data?.attachments?.[1]).toMatchObject({ kind: 'file', fileIndex: 0 });
  expect(result.data?.attachmentFiles).toHaveLength(1);
});

test('una política nueva no envía id', () => {
  expect(buildPolicyFormData(createEditorState(null), null).has('id')).toBe(false);
});

test('un anexo con archivo elegido que pasa a enlace envía url y no consume fileIndex', () => {
  const state = createEditorState(null);
  state.attachments.push(
    { ...createAttachment(), label: 'Ahora enlace', file: pdf('descartado.pdf'), kind: 'link', url: 'https://cap.hn/x' },
    { ...createAttachment(), label: 'Archivo', file: pdf('real.pdf') },
  );
  const formData = buildPolicyFormData(state, null);
  expect(JSON.parse(String(formData.get('attachments')))).toEqual([
    { kind: 'link', label: 'Ahora enlace', url: 'https://cap.hn/x' },
    { kind: 'file', label: 'Archivo', fileIndex: 0 },
  ]);
  expect(formData.getAll('attachmentFiles').map((file) => (file as File).name)).toEqual(['real.pdf']);
});

test('un anexo guardado al que se le elige otro archivo envía fileIndex y no filePath', () => {
  const state = createEditorState(storedPolicy());
  state.attachments[0].file = pdf('reemplazo.pdf');
  const [attachment] = JSON.parse(String(buildPolicyFormData(state, 7).get('attachments')));
  expect(attachment).toEqual({ kind: 'file', label: 'Formato', fileIndex: 0 });
});
