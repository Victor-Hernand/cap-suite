import type { Department } from '../data/departments';
import { DEPARTMENT_NAME_COLUMNS, nextSortOrder, renameDepartmentReferences, uniqueSlug, type Db } from './db';

export interface DepartmentRow extends Department {
  id: number;
}

const DEPARTMENT_SELECT = 'SELECT id, slug, name FROM departments';

export function listDepartments(db: Db): DepartmentRow[] {
  return db.prepare(`${DEPARTMENT_SELECT} ORDER BY sort_order, id`).all() as DepartmentRow[];
}

export function getDepartment(db: Db, id: number): DepartmentRow | null {
  return (db.prepare(`${DEPARTMENT_SELECT} WHERE id = ?`).get(id) as DepartmentRow | undefined) ?? null;
}

export function getDepartmentBySlug(db: Db, slug: string): DepartmentRow | null {
  return (db.prepare(`${DEPARTMENT_SELECT} WHERE slug = ?`).get(slug) as DepartmentRow | undefined) ?? null;
}

export function getDepartmentByName(db: Db, name: string): DepartmentRow | null {
  return (db.prepare(`${DEPARTMENT_SELECT} WHERE name = ?`).get(name) as DepartmentRow | undefined) ?? null;
}

export function createDepartment(db: Db, name: string): DepartmentRow {
  const slug = uniqueSlug(db, 'departments', name, 'departamento');
  const result = db
    .prepare('INSERT INTO departments (slug, name, sort_order) VALUES (?, ?, ?)')
    .run(slug, name, nextSortOrder(db, 'departments'));
  return getDepartment(db, Number(result.lastInsertRowid))!;
}

/**
 * Cambia el nombre y lo actualiza en cada tabla que guarda el departamento por nombre.
 * El slug no cambia para que las direcciones públicas sigan funcionando.
 */
export function renameDepartment(db: Db, id: number, name: string): DepartmentRow | null {
  const current = getDepartment(db, id);
  if (!current) return null;
  db.transaction(() => {
    db.prepare(`UPDATE departments SET name = ?, updated_at = datetime('now') WHERE id = ?`).run(name, id);
    renameDepartmentReferences(db, current.name, name);
  })();
  return getDepartment(db, id);
}

/** Registros (contactos, políticas y contenido) que todavía apuntan al departamento. */
export function countDepartmentUsage(db: Db, name: string): number {
  return DEPARTMENT_NAME_COLUMNS.reduce((total, [table, column]) => {
    const row = db.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = ?`).get(name) as { total: number };
    return total + row.total;
  }, 0);
}

export type DeleteDepartmentResult =
  | { status: 'deleted' }
  | { status: 'not-found' }
  | { status: 'in-use'; name: string; usage: number };

export function deleteDepartment(db: Db, id: number): DeleteDepartmentResult {
  const department = getDepartment(db, id);
  if (!department) return { status: 'not-found' };
  const usage = countDepartmentUsage(db, department.name);
  if (usage > 0) return { status: 'in-use', name: department.name, usage };
  db.prepare('DELETE FROM departments WHERE id = ?').run(id);
  return { status: 'deleted' };
}
