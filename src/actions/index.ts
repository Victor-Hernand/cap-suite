import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { constantTimeEquals, createSessionToken, SESSION_COOKIE, SESSION_DURATION_MS } from '../lib/session';
import { readEnv } from '../lib/env';
import {
  getDb,
  getApp,
  createApp,
  updateApp,
  deleteApp,
  setAppFeatured,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  moveRow,
  hasDuplicate,
  getManual,
  createManual,
  updateManual,
  deleteManual,
  UNIQUE_COLUMN,
  type SortableTable,
} from '../lib/db';
import { storeUpload, validateUpload, deleteUpload, type UploadKind } from '../lib/uploads';
import {
  appFormFields,
  companyFormFields,
  contactFormFields,
  manualFormFields,
  resourceFormFields,
} from './formSchemas';

const delay = (ms: number) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

const DUPLICATE_MESSAGES: Record<SortableTable, (value: string) => string> = {
  apps: (value) => `Ya existe una aplicación llamada «${value}». Usa otro nombre o edita la existente.`,
  resources: (value) => `Ya existe un recurso llamado «${value}». Usa otro nombre o edita el existente.`,
  contacts: (value) => `Ya existe un contacto con el correo ${value}. Edita el contacto existente.`,
  companies: (value) => `Ya existe una empresa llamada «${value}». Usa otro nombre o edita la existente.`,
  manuals: (value) => `Ya existe un manual llamado «${value}». Usa otro título o edita el existente.`,
};

/** Rechaza el alta o edición si otro registro ya usa el valor único de la colección. */
function assertUnique<T extends SortableTable>(
  table: T,
  form: Record<(typeof UNIQUE_COLUMN)[T], string>,
  excludeId?: number,
): void {
  const value = form[UNIQUE_COLUMN[table]];
  if (hasDuplicate(getDb(), table, value, excludeId)) {
    throw new ActionError({ code: 'CONFLICT', message: DUPLICATE_MESSAGES[table](value) });
  }
}

const idInput = z.object({ id: z.number().int().positive() });
const moveInput = idInput.extend({ direction: z.enum(['up', 'down']) });

function hasFile(file?: File): file is File {
  return !!file && file.size > 0;
}

/** Valida y guarda el archivo nuevo; el anterior se borra solo después de guardar el nuevo. */
async function replaceUpload(file: File, kind: UploadKind, previousPath?: string | null): Promise<string> {
  const error = validateUpload(file, kind);
  if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error });
  const storedPath = await storeUpload(file, kind);
  if (previousPath) deleteUpload(previousPath);
  return storedPath;
}

async function resolveLogoPath(input: {
  logo?: File;
  logoUrl?: string;
  previousPath?: string | null;
}): Promise<string | null> {
  const { logo, logoUrl, previousPath } = input;
  if (hasFile(logo)) return replaceUpload(logo, 'logos', previousPath);
  if (logoUrl && logoUrl.trim() !== '') return logoUrl.trim();
  return previousPath ?? null;
}

function toAppInput(
  form: {
    name: string;
    description: string;
    url: string;
    category: string;
    companyLabel?: string;
    badge?: string;
    featured?: boolean;
  },
  logoPath: string | null,
) {
  return {
    name: form.name,
    description: form.description,
    url: form.url,
    category: form.category,
    companyLabel: form.companyLabel?.trim() ? form.companyLabel.trim() : null,
    logoPath,
    featured: form.featured ?? false,
    badge: form.badge?.trim() ? form.badge.trim() : null,
  };
}

async function resolveResourceSource(
  form: { url?: string; file?: File },
  previous?: { url: string | null; filePath: string | null },
) {
  if (hasFile(form.file)) {
    return { url: null, filePath: await replaceUpload(form.file, 'docs', previous?.filePath) };
  }
  if (form.url?.trim()) {
    if (previous?.filePath) deleteUpload(previous.filePath);
    return { url: form.url!.trim(), filePath: null };
  }
  if (previous && (previous.url || previous.filePath)) return previous;
  throw new ActionError({ code: 'BAD_REQUEST', message: 'El recurso necesita un enlace o un archivo: escribe la dirección web o sube el documento.' });
}

function toResourceInput(
  form: { name: string; description: string; type: string },
  source: { url: string | null; filePath: string | null },
) {
  return {
    name: form.name,
    description: form.description,
    type: form.type,
    url: source.url,
    filePath: source.filePath,
  };
}

// Sin PDF nuevo se conserva el actual; el enlace vacío quita el video.
async function resolveManualInput(
  form: { title: string; description?: string; videoUrl?: string; pdf?: File },
  previousPdfPath: string | null = null,
) {
  const videoUrl = form.videoUrl?.trim() || null;
  const pdfPath = hasFile(form.pdf) ? await replaceUpload(form.pdf, 'manual', previousPdfPath) : previousPdfPath;
  if (!videoUrl && !pdfPath) {
    throw new ActionError({ code: 'BAD_REQUEST', message: 'El manual necesita un video o un PDF: pega el enlace de Loom o sube el documento.' });
  }
  return { title: form.title, description: form.description?.trim() || null, videoUrl, pdfPath };
}

function toContactInput(
  form: {
    name: string;
    role: string;
    department: string;
    company: string;
    phone: string;
    email: string;
    extension?: string;
  },
  photoPath: string | null,
) {
  return {
    name: form.name,
    role: form.role,
    department: form.department,
    company: form.company,
    phone: form.phone,
    email: form.email,
    extension: form.extension?.trim() ? form.extension.trim() : null,
    photoPath,
  };
}

function toCompanyInput(
  form: {
    name: string;
    segment: string;
    description: string;
    slogan: string;
    color: string;
    url?: string;
  },
  logoPath: string | null,
) {
  return {
    name: form.name,
    segment: form.segment,
    description: form.description,
    slogan: form.slogan,
    color: form.color,
    url: form.url?.trim() ? form.url.trim() : null,
    logoPath,
  };
}

export const server = {
  auth: {
    login: defineAction({
      accept: 'form',
      input: z.object({ password: z.string().min(1, 'Escribe la contraseña') }),
      handler: async ({ password }, context) => {
        const adminPassword = readEnv('ADMIN_PASSWORD');
        const secret = readEnv('SESSION_SECRET');
        if (!adminPassword || !secret) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Faltan ADMIN_PASSWORD o SESSION_SECRET en el servidor.',
          });
        }
        if (!constantTimeEquals(password, adminPassword)) {
          await delay(500);
          throw new ActionError({ code: 'UNAUTHORIZED', message: 'Contraseña incorrecta.' });
        }
        context.cookies.set(SESSION_COOKIE, createSessionToken(secret), {
          httpOnly: true,
          sameSite: 'lax',
          secure: import.meta.env.PROD,
          path: '/',
          maxAge: SESSION_DURATION_MS / 1000,
        });
        return { ok: true };
      },
    }),
  },
  apps: {
    create: defineAction({
      accept: 'form',
      input: z.object(appFormFields),
      handler: async (form) => {
        assertUnique('apps', form);
        const logoPath = await resolveLogoPath({ logo: form.logo, logoUrl: form.logoUrl });
        return createApp(getDb(), toAppInput(form, logoPath));
      },
    }),
    update: defineAction({
      accept: 'form',
      input: z.object({ ...appFormFields, id: z.number().int().positive() }),
      handler: async (form) => {
        assertUnique('apps', form, form.id);
        const db = getDb();
        const existing = getApp(db, form.id);
        if (!existing) throw new ActionError({ code: 'NOT_FOUND', message: 'La aplicación no existe.' });
        const logoPath = await resolveLogoPath({
          logo: form.logo,
          logoUrl: form.logoUrl,
          previousPath: existing.logoPath,
        });
        return updateApp(db, form.id, toAppInput(form, logoPath));
      },
    }),
    remove: defineAction({
      input: idInput,
      handler: async ({ id }) => {
        const deleted = deleteApp(getDb(), id);
        if (deleted?.logoPath) deleteUpload(deleted.logoPath);
        return { ok: true };
      },
    }),
    move: defineAction({
      input: moveInput,
      handler: async ({ id, direction }) => {
        moveRow(getDb(), 'apps', id, direction);
        return { ok: true };
      },
    }),
    toggleFeatured: defineAction({
      input: idInput.extend({ featured: z.boolean() }),
      handler: async ({ id, featured }) => {
        setAppFeatured(getDb(), id, featured);
        return { ok: true };
      },
    }),
  },
  resources: {
    create: defineAction({
      accept: 'form',
      input: z.object(resourceFormFields),
      handler: async (form) => {
        assertUnique('resources', form);
        const source = await resolveResourceSource(form);
        return createResource(getDb(), toResourceInput(form, source));
      },
    }),
    update: defineAction({
      accept: 'form',
      input: z.object({ ...resourceFormFields, id: z.number().int().positive() }),
      handler: async (form) => {
        assertUnique('resources', form, form.id);
        const db = getDb();
        const existing = getResource(db, form.id);
        if (!existing) throw new ActionError({ code: 'NOT_FOUND', message: 'El recurso no existe.' });
        const source = await resolveResourceSource(form, existing);
        return updateResource(db, form.id, toResourceInput(form, source));
      },
    }),
    remove: defineAction({
      input: idInput,
      handler: async ({ id }) => {
        const deleted = deleteResource(getDb(), id);
        if (deleted?.filePath) deleteUpload(deleted.filePath);
        return { ok: true };
      },
    }),
    move: defineAction({
      input: moveInput,
      handler: async ({ id, direction }) => {
        moveRow(getDb(), 'resources', id, direction);
        return { ok: true };
      },
    }),
  },
  contacts: {
    create: defineAction({
      accept: 'form',
      input: z.object(contactFormFields),
      handler: async (form) => {
        assertUnique('contacts', form);
        const photoPath = await resolveLogoPath({ logo: form.photo, logoUrl: form.photoUrl });
        return createContact(getDb(), toContactInput(form, photoPath));
      },
    }),
    update: defineAction({
      accept: 'form',
      input: z.object({ ...contactFormFields, id: z.number().int().positive() }),
      handler: async (form) => {
        assertUnique('contacts', form, form.id);
        const db = getDb();
        const existing = getContact(db, form.id);
        if (!existing) {
          throw new ActionError({ code: 'NOT_FOUND', message: 'El contacto no existe.' });
        }
        const photoPath = await resolveLogoPath({
          logo: form.photo,
          logoUrl: form.photoUrl,
          previousPath: existing.photoPath,
        });
        return updateContact(db, form.id, toContactInput(form, photoPath));
      },
    }),
    remove: defineAction({
      input: idInput,
      handler: async ({ id }) => {
        const deleted = deleteContact(getDb(), id);
        if (deleted?.photoPath) deleteUpload(deleted.photoPath);
        return { ok: true };
      },
    }),
    move: defineAction({
      input: moveInput,
      handler: async ({ id, direction }) => {
        moveRow(getDb(), 'contacts', id, direction);
        return { ok: true };
      },
    }),
  },
  companies: {
    create: defineAction({
      accept: 'form',
      input: z.object(companyFormFields),
      handler: async (form) => {
        assertUnique('companies', form);
        const logoPath = await resolveLogoPath({ logo: form.logo, logoUrl: form.logoUrl });
        return createCompany(getDb(), toCompanyInput(form, logoPath));
      },
    }),
    update: defineAction({
      accept: 'form',
      input: z.object({ ...companyFormFields, id: z.number().int().positive() }),
      handler: async (form) => {
        assertUnique('companies', form, form.id);
        const db = getDb();
        const existing = getCompany(db, form.id);
        if (!existing) {
          throw new ActionError({ code: 'NOT_FOUND', message: 'La empresa no existe.' });
        }
        const logoPath = await resolveLogoPath({
          logo: form.logo,
          logoUrl: form.logoUrl,
          previousPath: existing.logoPath,
        });
        return updateCompany(db, form.id, toCompanyInput(form, logoPath));
      },
    }),
    remove: defineAction({
      input: idInput,
      handler: async ({ id }) => {
        const deleted = deleteCompany(getDb(), id);
        if (deleted?.logoPath) deleteUpload(deleted.logoPath);
        return { ok: true };
      },
    }),
    move: defineAction({
      input: moveInput,
      handler: async ({ id, direction }) => {
        moveRow(getDb(), 'companies', id, direction);
        return { ok: true };
      },
    }),
  },
  manuals: {
    create: defineAction({
      accept: 'form',
      input: z.object(manualFormFields),
      handler: async (form) => {
        assertUnique('manuals', form);
        return createManual(getDb(), await resolveManualInput(form));
      },
    }),
    update: defineAction({
      accept: 'form',
      input: z.object({ ...manualFormFields, id: z.number().int().positive() }),
      handler: async (form) => {
        assertUnique('manuals', form, form.id);
        const db = getDb();
        const existing = getManual(db, form.id);
        if (!existing) throw new ActionError({ code: 'NOT_FOUND', message: 'El manual no existe.' });
        return updateManual(db, form.id, await resolveManualInput(form, existing.pdfPath));
      },
    }),
    remove: defineAction({
      input: idInput,
      handler: async ({ id }) => {
        const deleted = deleteManual(getDb(), id);
        if (deleted?.pdfPath) deleteUpload(deleted.pdfPath);
        return { ok: true };
      },
    }),
    move: defineAction({
      input: moveInput,
      handler: async ({ id, direction }) => {
        moveRow(getDb(), 'manuals', id, direction);
        return { ok: true };
      },
    }),
  },
};
