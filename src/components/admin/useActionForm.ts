import { ref } from 'vue';
import { isInputError } from 'astro:actions';
import { UPLOAD_RULES, uploadLimitLabel } from '../../lib/fieldRules';
import { uploadKindOf, type Field } from './types';

type ActionFailure = { code?: string; status?: number; message: string };
type ActionResult = { error?: ActionFailure };
export type FieldErrors = Record<string, string[] | undefined>;

/** "logo hasta 2 MB y archivo hasta 20 MB": los límites de los campos de archivo del formulario. */
function fileLimitsLabel(fields: Field[]): string {
  return fields
    .flatMap((field) => {
      const kind = uploadKindOf(field);
      return kind ? [`${field.label.toLowerCase()} hasta ${uploadLimitLabel(kind)}`] : [];
    })
    .join(' y ');
}

/** Traduce un error de acción a un mensaje que explique la causa y qué hacer. */
function describeError(error: ActionFailure, fields: Field[]): string {
  if (error.status === 413 || error.code === 'CONTENT_TOO_LARGE') {
    const limits = fileLimitsLabel(fields);
    return `El archivo es demasiado grande para subirlo.${limits ? ` Máximo: ${limits}.` : ''}`;
  }
  if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
    return 'Tu sesión expiró. Vuelve a iniciar sesión y repite el cambio.';
  }
  if (['BAD_REQUEST', 'CONFLICT', 'NOT_FOUND'].includes(error.code ?? '')) return error.message;
  return 'No se pudo completar la acción por un error del servidor. Intenta de nuevo; si persiste, avisa a Tecnología.';
}

function oversizedFileMessage(fields: Field[], formData: FormData): string | null {
  for (const field of fields) {
    const kind = uploadKindOf(field);
    if (!kind) continue;
    const file = formData.get(field.name);
    if (file instanceof File && file.size > UPLOAD_RULES[kind].maxBytes) {
      return `«${file.name}» pesa más de ${uploadLimitLabel(kind)}, el máximo para ${field.label.toLowerCase()}. Comprímelo o usa un archivo más liviano.`;
    }
  }
  return null;
}

/** Estado y envío de los formularios del admin: errores por campo, error general y recarga al guardar. */
export function useActionForm() {
  const submitting = ref(false);
  const formError = ref('');
  const fieldErrors = ref<FieldErrors>({});

  function resetErrors() {
    formError.value = '';
    fieldErrors.value = {};
  }

  /** Ejecuta una acción y recarga si salió bien; si no, deja el motivo en formError. */
  async function runAction(call: () => Promise<ActionResult>, fields: Field[] = []) {
    try {
      const { error } = await call();
      if (!error) {
        window.location.reload();
        return;
      }
      if (isInputError(error)) {
        fieldErrors.value = error.fields;
        formError.value = 'Revisa los campos marcados en rojo.';
      } else {
        formError.value = describeError(error, fields);
      }
    } catch {
      formError.value = 'No hay conexión con el servidor. Revisa tu red e intenta de nuevo.';
    }
  }

  /** Revisa el tamaño de los archivos antes de subirlos y envía el formulario. */
  async function submit(fields: Field[], formData: FormData, call: () => Promise<ActionResult>) {
    if (submitting.value) return;
    resetErrors();
    const fileError = oversizedFileMessage(fields, formData);
    if (fileError) {
      formError.value = fileError;
      return;
    }
    submitting.value = true;
    await runAction(call, fields);
    submitting.value = false;
  }

  return { submitting, formError, fieldErrors, resetErrors, runAction, submit };
}
