import { expect, test } from 'vitest';
import { openDb } from '../src/lib/db';
import {
  PolicyRuleError,
  countVisiblePoliciesByDepartment,
  createPolicy,
  deletePolicy,
  getVisiblePolicyBySlug,
  listVisiblePolicies,
  policyFilePaths,
  publishPolicyVersion,
  updatePolicy,
  type PolicyAttachment,
  type PolicyContentInput,
} from '../src/lib/policies';
import { buildSearchItems } from '../src/lib/search';
import { draftInput } from './policyFixtures';

test('una política nueva nace en borrador y no es visible', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput({ status: 'active' }));
  expect(policy.status).toBe('draft');
  expect(listVisiblePolicies(db)).toHaveLength(0);
  expect(getVisiblePolicyBySlug(db, policy.slug)).toBeNull();
  expect(countVisiblePoliciesByDepartment(db).get('Gerencia Administrativa')).toBeUndefined();
});

test('no se publica sin documento oficial', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput());
  const publish = { version: 'v2.1', effectiveDate: '2026-06-02', author: 'Moisés', reason: 'Carga inicial' };
  expect(() => publishPolicyVersion(db, policy.id, publish)).toThrow(PolicyRuleError);
});

test('publicar deja la política vigente y registra la versión', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput({ officialFilePath: 'policies/reuniones-ab12.docx' }));
  const published = publishPolicyVersion(db, policy.id,
    { version: 'v2.1', effectiveDate: '2026-06-02', author: 'Moisés', reason: 'Carga inicial' })!;
  expect(published).toMatchObject({ status: 'active', version: 'v2.1', effectiveDate: '2026-06-02' });
  expect(published.versions).toEqual([{ version: 'v2.1', date: '2026-06-02', author: 'Moisés', reason: 'Carga inicial' }]);
  expect(countVisiblePoliciesByDepartment(db).get('Gerencia Administrativa')).toBe(1);
  expect(listVisiblePolicies(db, 'Gerencia Administrativa').map((summary) => summary.id)).toEqual([policy.id]);
  expect(listVisiblePolicies(db, 'Legal')).toEqual([]);
});

test('guardar no puede sacar un borrador a público', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput());
  expect(() => updatePolicy(db, policy.id, draftInput({ status: 'active' }))).toThrow(PolicyRuleError);
});

test('renombrar conserva el slug y los títulos repetidos no chocan', () => {
  const db = openDb(':memory:');
  const first = createPolicy(db, draftInput());
  const second = createPolicy(db, draftInput());
  expect(second.slug).not.toBe(first.slug);
  expect(updatePolicy(db, first.id, draftInput({ title: 'Otro título' }))!.slug).toBe(first.slug);
});

test('updatePolicy reemplaza hijos y admite historial con fechas pasadas', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput());
  const updated = updatePolicy(db, policy.id, draftInput({
    guidelines: [{ title: 'Grabación obligatoria', body: 'Toda reunión se graba.' }],
    attachments: [{ kind: 'link', label: 'SharePoint', url: 'https://cap.sharepoint.com/x', filePath: null }],
    versions: [
      { version: 'v1.0', date: '2025-07-20', author: 'G. Administrativa', reason: 'Primera emisión' },
      { version: 'v2.0', date: '2026-01-15', author: 'Moisés', reason: 'Revisión anual' },
    ],
  }))!;
  expect(updated.guidelines).toHaveLength(1);
  expect(updated.versions.map((entry) => entry.version)).toEqual(['v2.0', 'v1.0']);
  expect(updatePolicy(db, policy.id, draftInput())!.guidelines).toHaveLength(0);
});

test('borrar una política borra sus hijos y devuelve sus archivos', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput({
    officialFilePath: 'policies/oficial-aa11.pdf',
    attachments: [{ kind: 'file', label: 'Matriz', url: null, filePath: 'policies/matriz-bb22.pdf' }],
  }));
  const deleted = deletePolicy(db, policy.id)!;
  expect(policyFilePaths(deleted)).toEqual(['policies/oficial-aa11.pdf', 'policies/matriz-bb22.pdf']);
  const remaining = db.prepare('SELECT COUNT(*) AS total FROM policy_attachments').get() as { total: number };
  expect(remaining.total).toBe(0);
});

const PUBLISH_V21 = { version: 'v2.1', effectiveDate: '2026-06-02', author: 'Moisés', reason: 'Se define el protocolo de cierre.' };

function publishedPolicy(db: ReturnType<typeof openDb>, overrides: Partial<PolicyContentInput> = {}) {
  const policy = createPolicy(db, draftInput({ officialFilePath: 'policies/oficial-aa11.pdf', ...overrides }));
  return publishPolicyVersion(db, policy.id, PUBLISH_V21)!;
}

test('publicar una versión que ya está en el historial reemplaza esa línea', () => {
  const db = openDb(':memory:');
  const published = publishedPolicy(db, {
    versions: [
      { version: 'v1.0', date: '2025-07-20', author: 'G. Administrativa', reason: 'Versión inicial' },
      { version: 'v2.1', date: '2026-05-01', author: 'Otra persona', reason: 'Línea precargada' },
    ],
  });
  expect(published.versions).toEqual([
    { version: 'v2.1', date: '2026-06-02', author: 'Moisés', reason: 'Se define el protocolo de cierre.' },
    { version: 'v1.0', date: '2025-07-20', author: 'G. Administrativa', reason: 'Versión inicial' },
  ]);
});

test('publicar una versión nueva agrega una línea al historial', () => {
  const db = openDb(':memory:');
  const published = publishedPolicy(db, {
    versions: [{ version: 'v2.0', date: '2026-01-15', author: 'Moisés', reason: 'Revisión anual' }],
  });
  expect(published.versions.map((entry) => entry.version)).toEqual(['v2.1', 'v2.0']);
});

test('dos líneas con la misma fecha se ordenan por versión, sin importar el orden de guardado', () => {
  const db = openDb(':memory:');
  const sameDay = [
    { version: 'v1.0', date: '2026-01-15', author: 'A', reason: 'Primera' },
    { version: 'v1.1', date: '2026-01-15', author: 'B', reason: 'Corrección' },
  ];
  const policy = createPolicy(db, draftInput({ versions: sameDay }));
  expect(policy.versions.map((entry) => entry.version)).toEqual(['v1.1', 'v1.0']);
  const resaved = updatePolicy(db, policy.id, draftInput({ versions: [...sameDay].reverse() }))!;
  expect(resaved.versions.map((entry) => entry.version)).toEqual(['v1.1', 'v1.0']);
});

test('una política publicada que vuelve a borrador desaparece de toda superficie pública', () => {
  const db = openDb(':memory:');
  const published = publishedPolicy(db);
  updatePolicy(db, published.id, draftInput({ officialFilePath: published.officialFilePath, status: 'draft' }));
  expect(listVisiblePolicies(db)).toHaveLength(0);
  expect(getVisiblePolicyBySlug(db, published.slug)).toBeNull();
  expect(countVisiblePoliciesByDepartment(db).get('Gerencia Administrativa')).toBeUndefined();
  expect(buildSearchItems(db).filter((item) => item.section === 'Políticas')).toEqual([]);
});

test('updatePolicy conserva la versión y vigencia publicadas y el orden recibido de los hijos', () => {
  const db = openDb(':memory:');
  const published = publishedPolicy(db);
  const guidelines = [
    { title: 'Zeta', body: 'Último alfabéticamente, primero en la lista.' },
    { title: 'Alfa', body: 'Segundo.' },
  ];
  const attachments: PolicyAttachment[] = [
    { kind: 'link', label: 'Portal', url: 'https://cap.hn/portal', filePath: null },
    { kind: 'file', label: 'Anexo', url: null, filePath: 'policies/anexo-cc33.pdf' },
  ];
  const updated = updatePolicy(db, published.id, draftInput({
    status: 'under-review',
    officialFilePath: published.officialFilePath,
    guidelines,
    attachments,
  }))!;
  expect(updated).toMatchObject({ status: 'under-review', version: 'v2.1', effectiveDate: '2026-06-02' });
  expect(updated.guidelines).toEqual(guidelines);
  expect(updated.attachments).toEqual(attachments);
});

test('borrar una política borra también sus lineamientos y su historial', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput({
    guidelines: [{ title: 'Grabación', body: 'Toda reunión se graba.' }],
    versions: [{ version: 'v1.0', date: '2025-07-20', author: 'G. Administrativa', reason: 'Primera emisión' }],
  }));
  deletePolicy(db, policy.id);
  const countRows = (table: string) => (db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number }).total;
  expect(countRows('policy_guidelines')).toBe(0);
  expect(countRows('policy_versions')).toBe(0);
});
