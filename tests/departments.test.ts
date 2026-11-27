import { expect, test } from 'vitest';
import {
  DEFAULT_DEPARTMENTS,
  findDepartmentByName,
  findDepartmentBySlug,
  LEGACY_DEPARTMENT_NAMES,
} from '../src/data/departments';
import { createContact, hasDuplicate, listContacts, migrateDepartmentNames, openDb } from '../src/lib/db';
import { links } from '../src/lib/departmentContent';
import {
  countDepartmentUsage,
  createDepartment,
  deleteDepartment,
  getDepartmentByName,
  getDepartmentBySlug,
  listDepartments,
  renameDepartment,
} from '../src/lib/departments';

const contactBase = { role: 'Jefa', company: 'CAP', phone: '+504 9999-9999', extension: null };

test('el catálogo inicial tiene 17 departamentos con slugs únicos', () => {
  expect(DEFAULT_DEPARTMENTS).toHaveLength(17);
  expect(new Set(DEFAULT_DEPARTMENTS.map((department) => department.slug)).size).toBe(17);
  expect(findDepartmentBySlug(DEFAULT_DEPARTMENTS, 'compras-e-importaciones')?.name).toBe('Compras e Importaciones');
  expect(findDepartmentBySlug(DEFAULT_DEPARTMENTS, 'no-existe')).toBeUndefined();
});

test('cada nombre antiguo apunta a un departamento del catálogo', () => {
  expect(Object.keys(LEGACY_DEPARTMENT_NAMES)).toHaveLength(14);
  for (const target of Object.values(LEGACY_DEPARTMENT_NAMES)) {
    expect(findDepartmentByName(DEFAULT_DEPARTMENTS, target)).toBeDefined();
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

test('la base nueva carga el catálogo inicial en orden y no lo duplica al reabrir', () => {
  const db = openDb(':memory:');
  const names = listDepartments(db).map((department) => department.name);
  expect(names).toEqual(DEFAULT_DEPARTMENTS.map((department) => department.name));
});

test('crear un departamento genera su slug y lo agrega al final', () => {
  const db = openDb(':memory:');
  const created = createDepartment(db, 'Seguridad Física');
  expect(created.slug).toBe('seguridad-fisica');
  expect(listDepartments(db).at(-1)?.name).toBe('Seguridad Física');
  expect(getDepartmentByName(db, 'Seguridad Física')?.slug).toBe('seguridad-fisica');
  expect(createDepartment(db, 'Seguridad fisica!').slug).toBe('seguridad-fisica-2');
});

test('el nombre duplicado se detecta sin distinguir mayúsculas ni acentos', () => {
  const db = openDb(':memory:');
  expect(hasDuplicate(db, 'departments', 'legal ')).toBe(true);
  const legal = getDepartmentBySlug(db, 'legal')!;
  expect(hasDuplicate(db, 'departments', 'Legal', legal.id)).toBe(false);
});

test('renombrar actualiza contactos, políticas y contenido, y conserva el slug', () => {
  const db = openDb(':memory:');
  const legal = getDepartmentBySlug(db, 'legal')!;
  createContact(db, { ...contactBase, name: 'Ana', department: 'Legal', email: 'ana@cap.hn' });
  createContact(db, { ...contactBase, name: 'Luis', department: 'Talento Humano', email: 'luis@cap.hn' });
  links.create(db, { department: 'Legal', label: 'Contratos', url: 'https://cap.hn/contratos' });

  const renamed = renameDepartment(db, legal.id, 'Legal y Cumplimiento');

  expect(renamed).toMatchObject({ slug: 'legal', name: 'Legal y Cumplimiento' });
  const byEmail = Object.fromEntries(listContacts(db).map((contact) => [contact.email, contact.department]));
  expect(byEmail).toEqual({ 'ana@cap.hn': 'Legal y Cumplimiento', 'luis@cap.hn': 'Talento Humano' });
  expect(links.list(db, 'Legal y Cumplimiento')).toHaveLength(1);
  expect(countDepartmentUsage(db, 'Legal')).toBe(0);
});

test('eliminar solo procede si nadie usa el departamento', () => {
  const db = openDb(':memory:');
  const legal = getDepartmentBySlug(db, 'legal')!;
  links.create(db, { department: 'Legal', label: 'Contratos', url: 'https://cap.hn/contratos' });
  expect(deleteDepartment(db, legal.id)).toEqual({ status: 'in-use', name: 'Legal', usage: 1 });

  const empty = createDepartment(db, 'Temporal');
  expect(deleteDepartment(db, empty.id)).toEqual({ status: 'deleted' });
  expect(getDepartmentByName(db, 'Temporal')).toBeNull();
  expect(deleteDepartment(db, empty.id)).toEqual({ status: 'not-found' });
});
