import { describe, expect, test, vi } from 'vitest';
import {
  EMPTY_FILTERS,
  filterPolicies,
  filtersFromQuery,
  filtersToQuery,
  groupPoliciesByDepartment,
  type PolicyCard,
} from '../src/lib/policyFilter';
import { formatDate, formatVersionLine, todayIsoDate } from '../src/lib/dates';
import { DEFAULT_DEPARTMENTS } from '../src/data/departments';

function card(overrides: Partial<PolicyCard>): PolicyCard {
  return {
    slug: 'sample',
    title: 'Sample',
    department: 'Legal',
    type: 'policy',
    classification: 'internal',
    status: 'active',
    version: 'v1.0',
    effectiveDate: '2026-06-02',
    ...overrides,
  };
}

const sample: PolicyCard[] = [
  card({ slug: 'a', title: 'Compras locales', department: 'Compras e Importaciones', type: 'procedure' }),
  card({ slug: 'b', title: 'Compras de activos', department: 'Compras e Importaciones' }),
  card({ slug: 'c', title: 'Contratos', department: 'Legal', status: 'under-review', classification: 'public' }),
  card({ slug: 'd', title: 'Política de información', department: 'Legal', status: 'obsolete' }),
];

describe('filterPolicies', () => {
  test('combina departamento y tipo', () => {
    const result = filterPolicies(sample, { ...EMPTY_FILTERS, department: 'Compras e Importaciones', type: 'procedure' });
    expect(result).toHaveLength(1);
  });

  test('sin filtro de estado oculta las obsoletas', () => {
    expect(filterPolicies(sample, EMPTY_FILTERS)).toHaveLength(3);
    expect(filterPolicies(sample, { ...EMPTY_FILTERS, status: 'obsolete' })).toHaveLength(1);
  });

  test('filtra por clasificación', () => {
    const result = filterPolicies(sample, { ...EMPTY_FILTERS, classification: 'public' });
    expect(result.map((policy) => policy.slug)).toEqual(['c']);
  });
});

describe('groupPoliciesByDepartment', () => {
  test('agrupa en el orden del catálogo y conserva el orden de las políticas', () => {
    const groups = groupPoliciesByDepartment(sample, DEFAULT_DEPARTMENTS);
    expect(groups.map((group) => group.department)).toEqual(['Legal', 'Compras e Importaciones']);
    expect(groups[0].slug).toBe('legal');
    expect(groups[1].policies.map((policy) => policy.slug)).toEqual(['a', 'b']);
  });

  test('un departamento fuera del catálogo va al final y sin enlace', () => {
    const groups = groupPoliciesByDepartment([card({ slug: 'x', department: 'Bodega' }), ...sample], DEFAULT_DEPARTMENTS);
    expect(groups.at(-1)).toEqual({ department: 'Bodega', slug: undefined, policies: [expect.objectContaining({ slug: 'x' })] });
  });

  test('sin políticas no hay grupos', () => {
    expect(groupPoliciesByDepartment([], DEFAULT_DEPARTMENTS)).toEqual([]);
  });
});

describe('query string', () => {
  test('el parámetro q de enlaces antiguos se ignora', () => {
    expect(filtersFromQuery(new URLSearchParams('q=riesgo'), DEFAULT_DEPARTMENTS)).toEqual(EMPTY_FILTERS);
  });

  test('valores desconocidos se ignoran', () => {
    const filters = filtersFromQuery(new URLSearchParams('departamento=no-existe&tipo=xyz&estado=draft'), DEFAULT_DEPARTMENTS);
    expect(filters).toEqual(EMPTY_FILTERS);
  });

  test('valores válidos se traducen a filtros y vuelven igual', () => {
    const filters = filtersFromQuery(new URLSearchParams('departamento=legal&tipo=policy'), DEFAULT_DEPARTMENTS);
    expect(filters.department).toBe('Legal');
    expect(filtersToQuery(filters, DEFAULT_DEPARTMENTS)).toBe('departamento=legal&tipo=policy');
  });

  test('emite los parámetros en orden fijo y omite los vacíos', () => {
    const query = filtersToQuery({ department: 'Legal', type: '', classification: 'public', status: 'active' }, DEFAULT_DEPARTMENTS);
    expect(query).toBe('departamento=legal&clasificacion=public&estado=active');
    expect(filtersToQuery(EMPTY_FILTERS, DEFAULT_DEPARTMENTS)).toBe('');
  });
});

test('formatDate muestra dd/mm/aaaa', () => {
  expect(formatDate('2026-06-02')).toBe('02/06/2026');
  expect(formatDate(null)).toBe('');
});

test('formatVersionLine une versión y fecha y omite lo que falte', () => {
  expect(formatVersionLine('v2.1', '2026-06-02')).toBe('v2.1 · 02/06/2026');
  expect(formatVersionLine('v2.1', null)).toBe('v2.1');
  expect(formatVersionLine(null, null)).toBe('');
});

test('todayIsoDate usa la fecha local, no la UTC', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 5, 23, 30));
  expect(todayIsoDate()).toBe('2026-01-05');
  vi.useRealTimers();
});
