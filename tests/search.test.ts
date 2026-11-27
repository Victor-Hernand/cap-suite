import { describe, expect, test } from 'vitest';
import type { SearchItem } from '../src/data/types';
import { openDb } from '../src/lib/db';
import { createPolicy, publishPolicyVersion } from '../src/lib/policies';
import { buildSearchItems, filterSearchItems } from '../src/lib/search';
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

const sampleItems: SearchItem[] = Array.from({ length: 10 }, (_, index) => ({
  id: `item-${index}`,
  name: `Elemento ${index}`,
  description: 'Descripción común',
  url: `/item-${index}`,
  section: 'Recursos',
}));

describe('filterSearchItems', () => {
  test('con la consulta vacía devuelve los primeros 8', () => {
    expect(filterSearchItems(sampleItems, '')).toEqual(sampleItems.slice(0, 8));
    expect(filterSearchItems(sampleItems, '   ')).toHaveLength(8);
  });

  test('filtra sin distinguir mayúsculas por nombre, descripción y sección', () => {
    const items: SearchItem[] = [
      { id: 'a', name: 'Nómina', description: 'Pagos', url: '/a', section: 'Aplicaciones' },
      { id: 'b', name: 'Otro', description: 'Manual de Vacaciones', url: '/b', section: 'Recursos' },
      { id: 'c', name: 'Tercero', description: 'Nada', url: '/c', section: 'Contactos' },
    ];
    expect(filterSearchItems(items, 'NÓMINA').map((item) => item.id)).toEqual(['a']);
    expect(filterSearchItems(items, 'vacaciones').map((item) => item.id)).toEqual(['b']);
    expect(filterSearchItems(items, 'contactos').map((item) => item.id)).toEqual(['c']);
  });

  test('sin coincidencias devuelve una lista vacía', () => {
    expect(filterSearchItems(sampleItems, 'zzz')).toEqual([]);
  });

  test('respeta el límite indicado', () => {
    expect(filterSearchItems(sampleItems, 'elemento', 3)).toHaveLength(3);
    expect(filterSearchItems(sampleItems, 'elemento')).toHaveLength(8);
  });
});
