import { expect, test } from 'vitest';
import { openDb } from '../src/lib/db';
import { createPolicy, publishPolicyVersion } from '../src/lib/policies';
import { buildSearchItems } from '../src/lib/search';
import { draftInput } from './policyFixtures';

test('la búsqueda incluye políticas visibles y departamentos, nunca borradores', () => {
  const db = openDb(':memory:');
  createPolicy(db, draftInput({ title: 'Borrador secreto' }));
  const visible = createPolicy(db, draftInput({ title: 'Política pública', officialFilePath: 'policies/a.pdf' }));
  publishPolicyVersion(db, visible.id, { version: 'v1.0', effectiveDate: '2026-01-01', author: 'MC', reason: 'Alta' });
  const items = buildSearchItems(db);
  expect(items.filter((item) => item.section === 'Políticas').map((item) => item.name)).toEqual(['Política pública']);
  expect(items.filter((item) => item.section === 'Departamentos')).toHaveLength(17);
});
