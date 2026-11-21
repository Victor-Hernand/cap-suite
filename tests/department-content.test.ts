import { expect, test } from 'vitest';
import { z } from 'astro/zod';
import { moveRow, openDb } from '../src/lib/db';
import {
  NO_DEPARTMENT_CONTENT,
  countDepartmentContentByDepartment,
  formats,
  links,
  notices,
  processes,
  splitSteps,
  toFormatInput,
} from '../src/lib/departmentContent';
import { formatFormFields, linkFormFields, noticeFormFields, processFormFields } from '../src/actions/formSchemas';

test('el contenido se lista por departamento', () => {
  const db = openDb(':memory:');
  links.create(db, { department: 'Legal', label: 'Contratos', url: 'https://cap.hn/contratos' });
  links.create(db, { department: 'Talento Humano', label: 'Planilla', url: 'https://cap.hn/planilla' });
  expect(links.list(db, 'Legal').map((link) => link.label)).toEqual(['Contratos']);
  expect(links.list(db, 'Flota Vehicular')).toEqual([]);
});

test('mover un enlace solo intercambia con vecinos de su departamento', () => {
  const db = openDb(':memory:');
  const first = links.create(db, { department: 'Legal', label: 'A', url: 'https://cap.hn/a' });
  links.create(db, { department: 'Talento Humano', label: 'X', url: 'https://cap.hn/x' });
  const second = links.create(db, { department: 'Legal', label: 'B', url: 'https://cap.hn/b' });
  moveRow(db, 'department_links', second.id, 'up');
  expect(links.list(db, 'Legal').map((link) => link.id)).toEqual([second.id, first.id]);
  expect(links.list(db, 'Talento Humano')).toHaveLength(1);
});

test('los avisos salen del más reciente al más antiguo', () => {
  const db = openDb(':memory:');
  notices.create(db, { department: 'Legal', date: '2026-11-05', body: 'Viejo', kind: 'info' });
  notices.create(db, { department: 'Legal', date: '2026-11-11', body: 'Nuevo', kind: 'warning' });
  expect(notices.list(db, 'Legal').map((notice) => notice.body)).toEqual(['Nuevo', 'Viejo']);
});

test('splitSteps ignora líneas vacías', () => {
  expect(splitSteps('Solicitante\n\n Jefe de área \nGerencia\n')).toEqual(['Solicitante', 'Jefe de área', 'Gerencia']);
});

test('un proceso se crea, edita y elimina', () => {
  const db = openDb(':memory:');
  const process = processes.create(db, { department: 'Legal', name: 'Contratos', steps: 'A\nB' });
  expect(processes.get(db, process.id)).toEqual(process);
  const updated = processes.update(db, process.id, { department: 'Legal', name: 'Contratos 2', steps: 'A' });
  expect(updated?.name).toBe('Contratos 2');
  expect(processes.delete(db, process.id)?.id).toBe(process.id);
  expect(processes.list(db, 'Legal')).toEqual([]);
});

test('un formato conserva su archivo y se cuenta por departamento', () => {
  const db = openDb(':memory:');
  const format = formats.create(db, { department: 'Legal', name: 'Solicitud', url: null, filePath: 'docs/solicitud.pdf' });
  processes.create(db, { department: 'Legal', name: 'Contratos', steps: 'A' });
  expect(formats.list(db, 'Legal')[0].filePath).toBe('docs/solicitud.pdf');
  links.create(db, { department: 'Legal', label: 'Contratos', url: 'https://cap.hn/contratos' });
  notices.create(db, { department: 'Legal', date: '2026-11-05', body: 'Aviso', kind: 'info' });
  const countsByDepartment = countDepartmentContentByDepartment(db);
  expect(countsByDepartment.get('Legal')).toEqual({ processes: 1, formats: 1, links: 1, notices: 1 });
  expect(countsByDepartment.get('Talento Humano') ?? NO_DEPARTMENT_CONTENT).toEqual({ processes: 0, formats: 0, links: 0, notices: 0 });
  expect(formats.delete(db, format.id)?.filePath).toBe('docs/solicitud.pdf');
});

test('los esquemas de contenido validan departamento, URL y fecha', () => {
  const link = z.object(linkFormFields);
  expect(link.safeParse({ department: 'Legal', label: 'A', url: 'https://cap.hn/a' }).success).toBe(true);
  expect(link.safeParse({ department: 'Inventado', label: 'A', url: 'https://cap.hn/a' }).success).toBe(false);
  expect(link.safeParse({ department: 'Legal', label: 'A', url: 'cap.hn' }).success).toBe(false);
  expect(z.object(processFormFields).safeParse({ department: 'Legal', name: 'P', steps: 'x'.repeat(2001) }).success).toBe(false);
  expect(z.object(formatFormFields).safeParse({ department: 'Legal', name: 'F' }).success).toBe(true);
  const notice = z.object(noticeFormFields);
  expect(notice.safeParse({ department: 'Legal', date: '2026-02-30', body: 'x', kind: 'info' }).success).toBe(false);
  expect(notice.safeParse({ department: 'Legal', date: '2026-02-20', body: 'x', kind: 'urgent' }).success).toBe(false);
  expect(notice.safeParse({ department: 'Legal', date: '2026-02-20', body: 'x', kind: 'warning' }).success).toBe(true);
});

test('editar un formato con archivo conserva el archivo y aplica el nombre y departamento nuevos', () => {
  const db = openDb(':memory:');
  const format = formats.create(db, { department: 'Legal', name: 'Viejo', url: null, filePath: 'docs/a.pdf' });
  const previousRow = { ...format };
  const input = toFormatInput({ department: 'Talento Humano', name: 'Nuevo' }, previousRow);
  expect(input).toEqual({ department: 'Talento Humano', name: 'Nuevo', url: null, filePath: 'docs/a.pdf' });
  const updated = formats.update(db, format.id, input);
  expect(updated).toMatchObject({ department: 'Talento Humano', name: 'Nuevo', filePath: 'docs/a.pdf' });
});
