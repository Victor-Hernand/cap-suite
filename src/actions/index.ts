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
} from '../lib/db';
import { storeUpload, validateUpload, deleteUpload } from '../lib/uploads';
import { appCategories } from '../data/categories';

const delay = (ms: number) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

const CATEGORY_IDS = appCategories.map((category) => category.id) as [string, ...string[]];

const idInput = z.object({ id: z.number().int().positive() });
const moveInput = idInput.extend({ direction: z.enum(['up', 'down']) });

const appFormFields = {
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  url: z.string().url('Debe ser una URL válida'),
  category: z.enum(CATEGORY_IDS),
  companyLabel: z.string().optional(),
  badge: z.string().optional(),
  featured: z.boolean().optional(),
  logo: z.instanceof(File).optional(),
  logoUrl: z.string().optional(),
};

async function resolveLogoPath(input: {
  logo?: File;
  logoUrl?: string;
  previousPath?: string | null;
}): Promise<string | null> {
  const { logo, logoUrl, previousPath } = input;
  if (logo && logo.size > 0) {
    const error = validateUpload(logo, 'logos');
    if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error });
    if (previousPath) deleteUpload(previousPath);
    return await storeUpload(logo, 'logos');
  }
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

const resourceTypes = z.enum(['manual', 'template', 'folder', 'link']);

const resourceFormFields = {
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  type: resourceTypes,
  url: z.string().optional(),
  file: z.instanceof(File).optional(),
};

async function resolveResourceSource(
  form: { url?: string; file?: File },
  previous?: { url: string | null; filePath: string | null },
) {
  const hasUrl = !!form.url?.trim();
  const hasFile = !!form.file && form.file.size > 0;
  if (hasFile) {
    const error = validateUpload(form.file!, 'docs');
    if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error });
    if (previous?.filePath) deleteUpload(previous.filePath);
    return { url: null, filePath: await storeUpload(form.file!, 'docs') };
  }
  if (hasUrl) {
    if (previous?.filePath) deleteUpload(previous.filePath);
    return { url: form.url!.trim(), filePath: null };
  }
  if (previous && (previous.url || previous.filePath)) return previous;
  throw new ActionError({ code: 'BAD_REQUEST', message: 'Indica un enlace o sube un archivo.' });
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

const contactFormFields = {
  name: z.string().min(1, 'El nombre es obligatorio'),
  role: z.string().min(1, 'El cargo es obligatorio'),
  department: z.string().min(1, 'El departamento es obligatorio'),
  company: z.string().min(1, 'La empresa es obligatoria'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
  email: z.string().email('Correo inválido'),
  extension: z.string().optional(),
  photo: z.instanceof(File).optional(),
  photoUrl: z.string().optional(),
};

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

const companyFormFields = {
  name: z.string().min(1, 'El nombre es obligatorio'),
  segment: z.string().min(1, 'El segmento es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  slogan: z.string().min(1, 'El eslogan es obligatorio'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido'),
  url: z.string().optional(),
  logo: z.instanceof(File).optional(),
  logoUrl: z.string().optional(),
};

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
        const logoPath = await resolveLogoPath({ logo: form.logo, logoUrl: form.logoUrl });
        return createApp(getDb(), toAppInput(form, logoPath));
      },
    }),
    update: defineAction({
      accept: 'form',
      input: z.object({ ...appFormFields, id: z.number().int().positive() }),
      handler: async (form) => {
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
        const source = await resolveResourceSource(form);
        return createResource(getDb(), toResourceInput(form, source));
      },
    }),
    update: defineAction({
      accept: 'form',
      input: z.object({ ...resourceFormFields, id: z.number().int().positive() }),
      handler: async (form) => {
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
        const photoPath = await resolveLogoPath({ logo: form.photo, logoUrl: form.photoUrl });
        return createContact(getDb(), toContactInput(form, photoPath));
      },
    }),
    update: defineAction({
      accept: 'form',
      input: z.object({ ...contactFormFields, id: z.number().int().positive() }),
      handler: async (form) => {
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
        const logoPath = await resolveLogoPath({ logo: form.logo, logoUrl: form.logoUrl });
        return createCompany(getDb(), toCompanyInput(form, logoPath));
      },
    }),
    update: defineAction({
      accept: 'form',
      input: z.object({ ...companyFormFields, id: z.number().int().positive() }),
      handler: async (form) => {
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
};
