import { expect, test } from 'vitest';
import { z } from 'astro/zod';
import { policyFormFields, policyPublishFields } from '../src/actions/formSchemas';
import { isIsoDate } from '../src/lib/fieldRules';
import { createPolicy, unknownAttachmentPaths } from '../src/lib/policies';
import { openDb } from '../src/lib/db';
import { draftInput } from './policyFixtures';

const formSchema = z.object(policyFormFields);
const publishSchema = z.object(policyPublishFields);

function validForm(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Reuniones virtuales',
    department: 'Gerencia Administrativa',
    type: 'policy',
    classification: 'internal',
    status: 'draft',
    ...overrides,
  };
}

function parse(input: Record<string, unknown>) {
  return formSchema.safeParse(input);
}

function messagesOf(result: z.SafeParseReturnType<unknown, unknown>): string[] {
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

test('acepta una ficha mínima', () => {
  expect(parse(validForm()).success).toBe(true);
});

test('rechaza la ficha sin título nombrando el campo', () => {
  const result = parse(validForm({ title: '   ' }));
  expect(result.success).toBe(false);
  expect(messagesOf(result)).toContain('El título es obligatorio.');
});

test('no existen las clasificaciones confidencial ni restringida', () => {
  expect(parse(validForm({ classification: 'confidential' })).success).toBe(false);
  expect(parse(validForm({ classification: 'restricted' })).success).toBe(false);
});

test('rechaza un anexo con dirección que no es http', () => {
  const attachments = JSON.stringify([{ kind: 'link', label: 'Malo', url: 'javascript:alert(1)' }]);
  expect(parse(validForm({ attachments })).success).toBe(false);
});

test('rechaza JSON inválido en las listas sin lanzar', () => {
  expect(parse(validForm({ guidelines: '{no es json' })).success).toBe(false);
});

test('rechaza versión y fecha mal formadas', () => {
  const badVersion = JSON.stringify([{ version: '2.1', date: '2026-06-02', author: 'M', reason: 'x' }]);
  const badDate = JSON.stringify([{ version: 'v2.1', date: '2026-02-30', author: 'M', reason: 'x' }]);
  expect(parse(validForm({ versions: badVersion })).success).toBe(false);
  expect(parse(validForm({ versions: badDate })).success).toBe(false);
});

test('los mensajes de las listas nombran el elemento', () => {
  const guidelines = JSON.stringify([
    { title: 'Uno', body: 'Texto' },
    { title: ' ', body: 'Texto' },
  ]);
  const attachments = JSON.stringify([{ kind: 'link', label: 'Sitio', url: 'sitio.com' }]);
  expect(messagesOf(parse(validForm({ guidelines })))).toContain('Lineamiento 2: el título es obligatorio.');
  expect(messagesOf(parse(validForm({ attachments })))).toContain(
    'Anexo 1: escribe una dirección web completa, que empiece con https://',
  );
});

test('un anexo de archivo exige ruta o índice de archivo', () => {
  const withoutSource = JSON.stringify([{ kind: 'file', label: 'Formato' }]);
  const withIndex = JSON.stringify([{ kind: 'file', label: 'Formato', fileIndex: 0 }]);
  expect(parse(validForm({ attachments: withoutSource })).success).toBe(false);
  expect(parse(validForm({ attachments: withIndex })).success).toBe(true);
});

test('las listas vacías o ausentes equivalen a lista vacía', () => {
  const result = parse(validForm({ guidelines: '[]' }));
  expect(result.success && result.data.guidelines).toEqual([]);
});

test('la fecha de próxima revisión debe ser una fecha real', () => {
  expect(parse(validForm({ nextReviewDate: '2026-02-30' })).success).toBe(false);
  expect(parse(validForm({ nextReviewDate: '2026-06-02' })).success).toBe(true);
});

test('isIsoDate valida formato y calendario', () => {
  expect(isIsoDate('2026-02-28')).toBe(true);
  expect(isIsoDate('2026-02-30')).toBe(false);
  expect(isIsoDate('02/06/2026')).toBe(false);
});

test('publicar exige versión con formato vX.Y', () => {
  const base = { id: 1, effectiveDate: '2026-06-02', author: 'Marta', reason: 'Primera versión' };
  expect(publishSchema.safeParse({ ...base, version: 'v2.1' }).success).toBe(true);
  const result = publishSchema.safeParse({ ...base, version: '2.1' });
  expect(messagesOf(result)).toContain('La versión debe tener el formato v2.1.');
});

test('unknownAttachmentPaths solo acepta archivos que la política ya tenía', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput({ officialFilePath: 'policies/oficial-aa11.pdf' }));
  expect(unknownAttachmentPaths(['policies/oficial-aa11.pdf'], policy)).toEqual([]);
  expect(unknownAttachmentPaths(['manual/secreto.pdf'], policy)).toEqual(['manual/secreto.pdf']);
  expect(unknownAttachmentPaths(['policies/otro.pdf'], null)).toEqual(['policies/otro.pdf']);
});
