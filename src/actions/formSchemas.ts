import { z } from 'astro/zod';
import { appCategories, resourceTypes } from '../data/categories';
import { noticeKinds } from '../data/departments';
import { attachmentKinds, policyClassifications, policyStatuses, policyTypes } from '../data/policies';
import { FIELD_MAX, PHONE_HINT, VERSION_PATTERN, isHttpUrl, isIsoDate, normalizePhone } from '../lib/fieldRules';
import { loomEmbedUrl } from '../lib/loom';
import { getDb } from '../lib/db';
import { getDepartmentByName } from '../lib/departments';

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
function listEnum<Value extends string>(values: readonly [Value, ...Value[]], message: string) {
  return z.enum(values as [Value, ...Value[]], { errorMap: () => ({ message }) });
}

const idsOf = <Id extends string>(options: readonly { id: Id }[]) => options.map((option) => option.id) as [Id, ...Id[]];

const DEPARTMENT_MESSAGE = 'Elige un departamento de la lista.';

// El catálogo vive en la base de datos: se consulta al validar, no al cargar el módulo.
function departmentField() {
  return z
    .string({ required_error: DEPARTMENT_MESSAGE, invalid_type_error: DEPARTMENT_MESSAGE })
    .refine((name) => getDepartmentByName(getDb(), name) !== null, DEPARTMENT_MESSAGE);
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
  department: departmentField(),
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

export const departmentFormFields = {
  name: requiredText('El nombre', FIELD_MAX.name),
};

export const manualFormFields = {
  title: requiredText('El título', FIELD_MAX.name),
  description: optionalText('La descripción', FIELD_MAX.description),
  videoUrl: boundedText('El enlace del video', FIELD_MAX.url)
    .refine(
      (value) => !value || loomEmbedUrl(value) !== null,
      'Pega el enlace para compartir de Loom, por ejemplo https://www.loom.com/share/…',
    )
    .optional(),
  pdf: z.instanceof(File).optional(),
};

const VERSION_MESSAGE = 'La versión debe tener el formato v2.1.';
const DATE_MESSAGE = 'Escribe una fecha válida con el formato aaaa-mm-dd.';
const ISO_DATE_LENGTH = 10;

function requiredIsoDate(label: string) {
  return requiredText(label, ISO_DATE_LENGTH, 'f').refine(isIsoDate, DATE_MESSAGE);
}

function requiredVersion() {
  return requiredText('La versión', FIELD_MAX.badge, 'f').regex(VERSION_PATTERN, VERSION_MESSAGE);
}

const lowercaseFirst = (message: string) => message.charAt(0).toLowerCase() + message.slice(1);

/**
 * Lista que viaja como texto JSON en un solo campo del formulario. Un JSON roto o un
 * elemento inválido se reporta como error de validación nombrando el elemento.
 */
function jsonList<Item extends z.ZodTypeAny>(itemSchema: Item, itemLabel: string) {
  return z
    .string()
    .transform((raw, context): z.output<Item>[] => {
      const items = z.array(itemSchema).safeParse(parseJsonOrNull(raw.trim() || '[]'));
      if (items.success) return items.data;
      for (const issue of items.error.issues) {
        const itemIndex = issue.path[0];
        const message = typeof itemIndex === 'number'
          ? `${itemLabel} ${itemIndex + 1}: ${lowercaseFirst(issue.message)}`
          : 'La lista enviada no es válida. Recarga la página e inténtalo de nuevo.';
        context.addIssue({ code: z.ZodIssueCode.custom, message });
      }
      return z.NEVER;
    })
    .optional();
}

function parseJsonOrNull(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const guidelineItem = z.object({
  title: requiredText('El título', FIELD_MAX.name),
  body: requiredText('El texto', FIELD_MAX.guidelineBody),
});

const attachmentItem = z
  .object({
    kind: listEnum(idsOf(attachmentKinds), 'Elige un tipo de anexo de la lista.'),
    label: requiredText('El nombre', FIELD_MAX.name),
    url: z.string().trim().max(FIELD_MAX.url).nullish(),
    filePath: z.string().trim().max(FIELD_MAX.url).nullish(),
    fileIndex: z.number().int().min(0).nullish(),
  })
  .superRefine((attachment, context) => {
    const needsUrl = attachment.kind === 'link' || attachment.kind === 'video';
    if (needsUrl && !isHttpUrl(attachment.url ?? '')) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: URL_MESSAGE, path: ['url'] });
    }
    if (attachment.kind === 'file' && !attachment.filePath && attachment.fileIndex == null) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Sube el archivo del anexo.', path: ['file'] });
    }
  });

const versionItem = z.object({
  version: requiredVersion(),
  date: requiredIsoDate('La fecha'),
  author: requiredText('El autor', FIELD_MAX.shortText),
  reason: requiredText('El motivo', FIELD_MAX.description),
});

export type PolicyAttachmentForm = z.output<typeof attachmentItem>;

export const policyFormFields = {
  title: requiredText('El título', FIELD_MAX.policyTitle),
  department: departmentField(),
  type: listEnum(idsOf(policyTypes), 'Elige un tipo de documento de la lista.'),
  classification: listEnum(idsOf(policyClassifications), 'Elige una clasificación de la lista.'),
  status: listEnum(idsOf(policyStatuses), 'Elige un estado de la lista.'),
  summary: optionalText('El resumen', FIELD_MAX.longText),
  objective: optionalText('El objetivo', FIELD_MAX.longText),
  scope: optionalText('El alcance', FIELD_MAX.longText),
  indicators: optionalText('Los indicadores', FIELD_MAX.longText),
  relatedDocuments: optionalText('Los documentos relacionados', FIELD_MAX.longText),
  owner: optionalText('El responsable', FIELD_MAX.shortText),
  approver: optionalText('El aprobador', FIELD_MAX.shortText),
  nextReviewDate: boundedText('La próxima revisión', ISO_DATE_LENGTH)
    .refine((value) => !value || isIsoDate(value), DATE_MESSAGE)
    .optional(),
  officialFile: z.instanceof(File).optional(),
  attachmentFiles: z.array(z.instanceof(File)).optional(),
  guidelines: jsonList(guidelineItem, 'Lineamiento'),
  attachments: jsonList(attachmentItem, 'Anexo'),
  versions: jsonList(versionItem, 'Versión'),
};

export const policyPublishFields = {
  id: z.number().int().positive(),
  version: requiredVersion(),
  effectiveDate: requiredIsoDate('La fecha de vigencia'),
  author: requiredText('El autor', FIELD_MAX.shortText),
  reason: requiredText('El motivo', FIELD_MAX.description),
};

export const processFormFields = {
  department: departmentField(),
  name: requiredText('El nombre', FIELD_MAX.name),
  steps: requiredText('Los pasos', FIELD_MAX.longText),
};

export const formatFormFields = {
  department: departmentField(),
  name: requiredText('El nombre', FIELD_MAX.name),
  url: optionalUrl('El enlace'),
  file: z.instanceof(File).optional(),
};

export const linkFormFields = {
  department: departmentField(),
  label: requiredText('El nombre', FIELD_MAX.name),
  url: requiredUrl('La URL', 'f'),
};

export const noticeFormFields = {
  department: departmentField(),
  date: requiredIsoDate('La fecha'),
  body: requiredText('El aviso', FIELD_MAX.longText),
  kind: listEnum(idsOf(noticeKinds), 'Elige un tipo de aviso de la lista.'),
};
