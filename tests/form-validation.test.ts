import { expect, test } from 'vitest';
import { z } from 'astro/zod';
import { appFormFields, companyFormFields, contactFormFields, resourceFormFields } from '../src/actions/formSchemas';
import { duplicateKey, isHttpUrl, normalizePhone } from '../src/lib/fieldRules';
import { createApp, createContact, hasDuplicate, openDb } from '../src/lib/db';

const contactSchema = z.object(contactFormFields);
const resourceSchema = z.object(resourceFormFields);
const appSchema = z.object(appFormFields);
const companySchema = z.object(companyFormFields);

const validContact = {
  name: 'Sindy Castro',
  role: 'Gerente General',
  department: 'Gerencia',
  company: 'Grupo CAP',
  phone: '9999-9999',
  email: 's.castro@cap.hn',
};

function firstIssue(result: z.SafeParseReturnType<unknown, unknown>, path: string): string | undefined {
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === path)?.message;
}

test('normalizePhone acepta formatos hondureños y los unifica', () => {
  expect(normalizePhone('99999999')).toBe('+504 9999-9999');
  expect(normalizePhone('9999-9999')).toBe('+504 9999-9999');
  expect(normalizePhone('+504 9999-9999')).toBe('+504 9999-9999');
  expect(normalizePhone('504 99999999')).toBe('+504 9999-9999');
});

test('normalizePhone rechaza letras, signos y largos incorrectos', () => {
  expect(normalizePhone('9999-99a9')).toBeNull();
  expect(normalizePhone('9999-999')).toBeNull();
  expect(normalizePhone('+1 9999-9999')).toBeNull();
  expect(normalizePhone('(999) 9999')).toBeNull();
});

test('isHttpUrl exige una dirección web completa', () => {
  expect(isHttpUrl('https://capgrupo.sharepoint.com/sites/manuales')).toBe(true);
  expect(isHttpUrl('cap365.sharepoint.com')).toBe(false);
  expect(isHttpUrl('javascript:alert(1)')).toBe(false);
});

test('duplicateKey ignora mayúsculas, acentos en mayúscula y espacios extremos', () => {
  expect(duplicateKey('  Árbol ')).toBe(duplicateKey('árbol'));
});

test('un campo obligatorio con solo espacios se rechaza', () => {
  const result = contactSchema.safeParse({ ...validContact, name: '    ' });
  expect(firstIssue(result, 'name')).toBe('El nombre es obligatorio.');
});

test('los textos se guardan sin espacios al inicio ni al final', () => {
  const result = contactSchema.parse({ ...validContact, name: '  Sindy Castro  ' });
  expect(result.name).toBe('Sindy Castro');
});

test('un texto más largo que el máximo se rechaza con mensaje claro', () => {
  const result = resourceSchema.safeParse({ name: 'x'.repeat(81), description: 'Manual', type: 'manual' });
  expect(firstIssue(result, 'name')).toBe('El nombre admite como máximo 80 caracteres.');
});

test('el teléfono inválido se rechaza y el válido se normaliza', () => {
  expect(firstIssue(contactSchema.safeParse({ ...validContact, phone: 'abc' }), 'phone')).toMatch(/Teléfono inválido/);
  expect(contactSchema.parse(validContact).phone).toBe('+504 9999-9999');
});

test('el departamento debe venir de la lista controlada', () => {
  const result = contactSchema.safeParse({ ...validContact, department: 'ventas ' });
  expect(firstIssue(result, 'department')).toBe('Elige un departamento de la lista.');
});

test('la extensión solo admite números', () => {
  expect(firstIssue(contactSchema.safeParse({ ...validContact, extension: '20a' }), 'extension')).toBe(
    'La extensión solo admite números.',
  );
});

test('los enlaces deben ser direcciones web completas', () => {
  const resource = resourceSchema.safeParse({ name: 'SharePoint', description: 'Sitio', type: 'link', url: 'cap365.sharepoint.com' });
  expect(firstIssue(resource, 'url')).toMatch(/https:\/\//);
  const app = appSchema.safeParse({ name: 'SharePoint', description: 'Sitio', category: 'microsoft365', url: 'sharepoint' });
  expect(firstIssue(app, 'url')).toMatch(/https:\/\//);
});

test('el color de empresa explica el formato esperado', () => {
  const result = companySchema.safeParse({
    name: 'CAP Logistics',
    segment: 'Logística',
    description: 'Transporte',
    slogan: 'Llegamos',
    color: 'rojo',
  });
  expect(firstIssue(result, 'color')).toMatch(/#C62828/);
});

test('hasDuplicate detecta nombres repetidos sin distinguir mayúsculas ni espacios', () => {
  const db = openDb(':memory:');
  const app = createApp(db, {
    name: 'SharePoint',
    description: 'Documentos',
    url: 'https://example.com',
    category: 'microsoft365',
    companyLabel: null,
    logoPath: null,
    featured: false,
    badge: null,
  });
  expect(hasDuplicate(db, 'apps', '  sharepoint ')).toBe(true);
  expect(hasDuplicate(db, 'apps', 'SharePoint', app.id)).toBe(false);
  expect(hasDuplicate(db, 'apps', 'OneDrive')).toBe(false);
});

test('hasDuplicate en contactos compara por correo', () => {
  const db = openDb(':memory:');
  createContact(db, { ...validContact, phone: '+504 9999-9999', extension: null, photoPath: null });
  expect(hasDuplicate(db, 'contacts', 'S.Castro@cap.hn')).toBe(true);
  expect(hasDuplicate(db, 'contacts', 'otra@cap.hn')).toBe(false);
});
