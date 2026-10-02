import { z } from 'astro/zod';
import { appCategories, resourceTypes } from '../data/categories';
import { departments } from '../data/departments';
import { FIELD_MAX, PHONE_HINT, isHttpUrl, normalizePhone } from '../lib/fieldRules';
import { loomEmbedUrl } from '../lib/loom';

// trim() va antes de min(1): un campo con solo espacios cuenta como vacío.
type Gender = 'm' | 'f';

function requiredText(label: string, max: number, gender: Gender = 'm') {
  // Astro envía los campos vacíos del formulario como null: mismo mensaje que el texto vacío.
  const requiredMessage = `${label} es ${gender === 'f' ? 'obligatoria' : 'obligatorio'}.`;
  return z
    .string({ required_error: requiredMessage, invalid_type_error: requiredMessage })
    .trim()
    .min(1, requiredMessage)
    .max(max, `${label} admite como máximo ${max} caracteres.`);
}

function boundedText(label: string, max: number) {
  return z.string().trim().max(max, `${label} admite como máximo ${max} caracteres.`);
}

// .optional() va siempre por fuera: Astro solo trata como opcional un campo vacío si
// el esquema exterior es ZodOptional; con un refine encima lo recibiría como null.
function optionalText(label: string, max: number) {
  return boundedText(label, max).optional();
}

const URL_MESSAGE = 'Escribe una dirección web completa, que empiece con https://';

function requiredUrl(label: string, gender: Gender = 'm') {
  return requiredText(label, FIELD_MAX.url, gender).refine(isHttpUrl, URL_MESSAGE);
}

function optionalUrl(label: string) {
  return boundedText(label, FIELD_MAX.url)
    .refine((value) => !value || isHttpUrl(value), URL_MESSAGE)
    .optional();
}

/** Valor que debe salir de una lista cerrada (select del formulario). */
function listEnum(values: readonly [string, ...string[]], message: string) {
  return z.enum(values as [string, ...string[]], { errorMap: () => ({ message }) });
}

const CATEGORY_IDS = appCategories.map((category) => category.id) as [string, ...string[]];
const RESOURCE_TYPE_IDS = resourceTypes.map((type) => type.id) as [string, ...string[]];

export const appFormFields = {
  name: requiredText('El nombre', FIELD_MAX.name),
  description: requiredText('La descripción', FIELD_MAX.description, 'f'),
  url: requiredUrl('La URL', 'f'),
  category: listEnum(CATEGORY_IDS, 'Elige una categoría de la lista.'),
  companyLabel: optionalText('La empresa', FIELD_MAX.shortText),
  badge: optionalText('El badge', FIELD_MAX.badge),
  featured: z.boolean().optional(),
  logo: z.instanceof(File).optional(),
  logoUrl: optionalUrl('La URL del logo'),
};

export const resourceFormFields = {
  name: requiredText('El nombre', FIELD_MAX.name),
  description: requiredText('La descripción', FIELD_MAX.description, 'f'),
  type: listEnum(RESOURCE_TYPE_IDS, 'Elige un tipo de recurso de la lista.'),
  url: optionalUrl('El enlace'),
  file: z.instanceof(File).optional(),
};

export const contactFormFields = {
  name: requiredText('El nombre', FIELD_MAX.name),
  role: requiredText('El cargo', FIELD_MAX.shortText),
  department: listEnum(departments, 'Elige un departamento de la lista.'),
  company: requiredText('La empresa', FIELD_MAX.shortText, 'f'),
  phone: requiredText('El teléfono', FIELD_MAX.phone).transform((value, context) => {
    const phone = normalizePhone(value);
    if (phone) return phone;
    context.addIssue({ code: z.ZodIssueCode.custom, message: `Teléfono inválido. ${PHONE_HINT}.` });
    return z.NEVER;
  }),
  email: requiredText('El correo', FIELD_MAX.email).email('Escribe un correo válido, por ejemplo nombre@cap.hn.'),
  extension: boundedText('La extensión', FIELD_MAX.extension)
    .regex(/^\d*$/, 'La extensión solo admite números.')
    .optional(),
  photo: z.instanceof(File).optional(),
  photoUrl: optionalUrl('La URL de la foto'),
};

export const companyFormFields = {
  name: requiredText('El nombre', FIELD_MAX.name),
  segment: requiredText('El segmento', FIELD_MAX.shortText),
  description: requiredText('La descripción', FIELD_MAX.description, 'f'),
  slogan: requiredText('El eslogan', FIELD_MAX.slogan),
  color: z.string().trim().max(FIELD_MAX.color).regex(/^#[0-9a-fA-F]{6}$/, 'El color debe ser un hex de 6 dígitos, por ejemplo #C62828.'),
  url: optionalUrl('El sitio web'),
  logo: z.instanceof(File).optional(),
  logoUrl: optionalUrl('La URL del logo'),
};

export const manualFormFields = {
  videoUrl: boundedText('El enlace del video', FIELD_MAX.url)
    .refine(
      (value) => !value || loomEmbedUrl(value) !== null,
      'Pega el enlace para compartir de Loom, por ejemplo https://www.loom.com/share/…',
    )
    .optional(),
  pdf: z.instanceof(File).optional(),
};
