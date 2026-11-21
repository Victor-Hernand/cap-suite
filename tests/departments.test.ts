import { expect, test } from 'vitest';
import {
  departments,
  findDepartmentByName,
  findDepartmentBySlug,
  LEGACY_DEPARTMENT_NAMES,
} from '../src/data/departments';
import { listContacts, migrateDepartmentNames, openDb } from '../src/lib/db';
import { links } from '../src/lib/departmentContent';

test('el catálogo tiene 17 departamentos con slugs únicos', () => {
  expect(departments).toHaveLength(17);
  expect(new Set(departments.map((department) => department.slug)).size).toBe(17);
  expect(findDepartmentBySlug('compras-e-importaciones')?.name).toBe('Compras e Importaciones');
  expect(findDepartmentBySlug('no-existe')).toBeUndefined();
});

test('cada nombre antiguo apunta a un departamento del catálogo', () => {
  expect(Object.keys(LEGACY_DEPARTMENT_NAMES)).toHaveLength(14);
  for (const target of Object.values(LEGACY_DEPARTMENT_NAMES)) {
    expect(findDepartmentByName(target)).toBeDefined();
  }
});

test('migrateDepartmentNames renombra y es idempotente', () => {
  const db = openDb(':memory:');
  db.prepare(`INSERT INTO contacts (name, role, department, company, phone, email)
    VALUES ('Ana', 'Jefa', 'Compras', 'CAP', '+504 9999-9999', 'ana@cap.hn'),
           ('Luis', 'Asesor', 'Departamento Fantasma', 'CAP', '+504 9999-9998', 'luis@cap.hn')`).run();
  links.create(db, { department: 'Compras', label: 'Proveedores', url: 'https://cap.hn/proveedores' });
  migrateDepartmentNames(db);
  migrateDepartmentNames(db);
  const byEmail = Object.fromEntries(listContacts(db).map((contact) => [contact.email, contact.department]));
  expect(byEmail['ana@cap.hn']).toBe('Compras e Importaciones');
  expect(byEmail['luis@cap.hn']).toBe('Departamento Fantasma');
  expect(links.list(db, 'Compras e Importaciones')).toHaveLength(1);
});
