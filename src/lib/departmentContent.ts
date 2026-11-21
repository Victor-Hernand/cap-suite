import type { NoticeKind } from '../data/departments';
import { isSortableTable, nextSortOrder, type Db } from './db';

export interface ProcessInput {
  department: string;
  name: string;
  steps: string;
}

export interface FormatInput {
  department: string;
  name: string;
  url: string | null;
  filePath: string | null;
}

export interface LinkInput {
  department: string;
  label: string;
  url: string;
}

export interface NoticeInput {
  department: string;
  date: string;
  body: string;
  kind: NoticeKind;
}

export type ProcessRow = ProcessInput & { id: number };
export type FormatRow = FormatInput & { id: number };
export type LinkRow = LinkInput & { id: number };
export type NoticeRow = NoticeInput & { id: number };

interface ContentTable<Input> {
  table: string;
  fields: readonly (keyof Input & string)[];
  orderBy: string;
}

// La única columna cuyo nombre no coincide con el campo.
const columnOf = (field: string): string => (field === 'filePath' ? 'file_path' : field);

function contentStore<Input extends object>({ table, fields, orderBy }: ContentTable<Input>) {
  type Row = Input & { id: number };
  const hasSortOrder = isSortableTable(table);
  const select = `SELECT id, ${fields.map((field) => `${columnOf(field)} AS ${field}`).join(', ')} FROM ${table}`;
  const insertColumns = [...fields.map(columnOf), ...(hasSortOrder ? ['sort_order'] : [])];
  const insertValues = [...fields.map((field) => `@${field}`), ...(hasSortOrder ? ['@sortOrder'] : [])];
  const assignments = fields.map((field) => `${columnOf(field)} = @${field}`).join(', ');

  const get = (db: Db, id: number): Row | null =>
    (db.prepare(`${select} WHERE id = ?`).get(id) as Row | undefined) ?? null;

  return {
    list: (db: Db, department: string): Row[] =>
      db.prepare(`${select} WHERE department = ? ORDER BY ${orderBy}`).all(department) as Row[],
    get,
    create(db: Db, input: Input): Row {
      const sortOrder = hasSortOrder ? { sortOrder: nextSortOrder(db, table) } : {};
      const result = db
        .prepare(`INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES (${insertValues.join(', ')})`)
        .run({ ...input, ...sortOrder });
      return get(db, Number(result.lastInsertRowid))!;
    },
    update(db: Db, id: number, input: Input): Row | null {
      db.prepare(`UPDATE ${table} SET ${assignments}, updated_at = datetime('now') WHERE id = @id`).run({ ...input, id });
      return get(db, id);
    },
    delete(db: Db, id: number): Row | null {
      const row = get(db, id);
      if (row) db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      return row;
    },
  };
}

export type ContentStore<Input extends object> = ReturnType<typeof contentStore<Input>>;

export const processes = contentStore<ProcessInput>({
  table: 'department_processes',
  fields: ['department', 'name', 'steps'],
  orderBy: 'sort_order, id',
});

export const formats = contentStore<FormatInput>({
  table: 'department_formats',
  fields: ['department', 'name', 'url', 'filePath'],
  orderBy: 'sort_order, id',
});

export const links = contentStore<LinkInput>({
  table: 'department_links',
  fields: ['department', 'label', 'url'],
  orderBy: 'sort_order, id',
});

export const notices = contentStore<NoticeInput>({
  table: 'department_notices',
  fields: ['department', 'date', 'body', 'kind'],
  orderBy: 'date DESC, id DESC',
});

export function toFormatInput(
  form: { department: string; name: string },
  source: { url: string | null; filePath: string | null },
): FormatInput {
  return { department: form.department, name: form.name, url: source.url, filePath: source.filePath };
}

export function splitSteps(steps: string): string[] {
  return steps
    .split('\n')
    .map((step) => step.trim())
    .filter((step) => step !== '');
}

export interface DepartmentContentCounts {
  processes: number;
  formats: number;
  links: number;
  notices: number;
}

export const NO_DEPARTMENT_CONTENT: DepartmentContentCounts = { processes: 0, formats: 0, links: 0, notices: 0 };

const COUNTED_TABLES: Record<keyof DepartmentContentCounts, string> = {
  processes: 'department_processes',
  formats: 'department_formats',
  links: 'department_links',
  notices: 'department_notices',
};

/** Conteos por nombre de departamento; los departamentos sin contenido no aparecen. */
export function countDepartmentContentByDepartment(db: Db): Map<string, DepartmentContentCounts> {
  const query = Object.entries(COUNTED_TABLES)
    .map(([kind, table]) => `SELECT department, '${kind}' AS kind, COUNT(*) AS total FROM ${table} GROUP BY department`)
    .join(' UNION ALL ');
  const rows = db.prepare(query).all() as { department: string; kind: keyof DepartmentContentCounts; total: number }[];
  const countsByDepartment = new Map<string, DepartmentContentCounts>();
  for (const row of rows) {
    const counts = countsByDepartment.get(row.department) ?? { ...NO_DEPARTMENT_CONTENT };
    counts[row.kind] = row.total;
    countsByDepartment.set(row.department, counts);
  }
  return countsByDepartment;
}
