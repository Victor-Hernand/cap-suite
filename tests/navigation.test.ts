import { expect, test } from 'vitest';
import {
  buildAdminNavigation,
  isActiveHref,
  itemAriaLabel,
  itemIconClass,
  mobileDestinations,
  publicNavigation,
} from '../src/data/navigation';

const totals = { apps: 3, resources: 4, policies: 5, departments: 6, manuals: 7, contacts: 8, companies: 9 };

test('matches the root routes only exactly', () => {
  expect(isActiveHref('/', '/')).toBe(true);
  expect(isActiveHref('/apps', '/')).toBe(false);
  expect(isActiveHref('/admin', '/admin')).toBe(true);
  expect(isActiveHref('/admin/apps', '/admin')).toBe(false);
});

test('matches the other routes by prefix and ignores the trailing slash', () => {
  expect(isActiveHref('/politicas/codigo-etica', '/politicas')).toBe(true);
  expect(isActiveHref('/apps/', '/apps')).toBe(true);
  expect(isActiveHref('/admin/apps/', '/admin/apps')).toBe(true);
});

test('does not match a route that only shares the first letters', () => {
  expect(isActiveHref('/apps-legacy', '/apps')).toBe(false);
});

test('takes the first four public items as mobile destinations', () => {
  expect(mobileDestinations(publicNavigation).map((item) => item.href)).toEqual([
    '/',
    '/apps',
    '/recursos',
    '/politicas',
  ]);
});

test('puts the admin totals on the content items and none on the dashboard', () => {
  const items = buildAdminNavigation(totals).flatMap((group) => group.items);
  const countOf = (label: string) => items.find((item) => item.label === label)?.count;

  expect(countOf('Panel')).toBeUndefined();
  expect(countOf('Aplicaciones')).toBe(3);
  expect(countOf('Manuales')).toBe(7);
  expect(countOf('Empresas')).toBe(9);
});

test('fills the outline icon of the active item only', () => {
  const policies = { label: 'Políticas', href: '/politicas', icon: 'file-document-outline' };

  expect(itemIconClass(policies, true)).toBe('mdi-file-document');
  expect(itemIconClass(policies, false)).toBe('mdi-file-document-outline');
  expect(itemIconClass({ label: 'Empresas', href: '/empresas', icon: 'domain' }, true)).toBe('mdi-domain');
});

test('adds the total to the accessible name of counted items', () => {
  expect(itemAriaLabel({ label: 'Aplicaciones', href: '/admin/apps', icon: 'apps', count: 3 })).toBe('Aplicaciones, 3');
  expect(itemAriaLabel({ label: 'Panel', href: '/admin', icon: 'view-dashboard-outline' })).toBe('Panel');
});
