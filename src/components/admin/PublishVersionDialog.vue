<script setup lang="ts">
import { computed, ref } from 'vue';
import { actions } from 'astro:actions';
import FormModal from './FormModal.vue';
import { navigateWithToast, useActionForm } from './useActionForm';
import type { Field } from './types';
import { todayIsoDate } from '../../lib/dates';
import { FIELD_MAX } from '../../lib/fieldRules';

const props = withDefaults(
  defineProps<{
    policyId: number;
    currentVersion?: string | null;
    /** Versiones que ya están en el control de cambios de la política. */
    listedVersions?: string[];
  }>(),
  { currentVersion: null, listedVersions: () => [] },
);

const emit = defineEmits<{ close: [] }>();

const { submitting, formError, fieldErrors, submit } = useActionForm();

const REPLACES_LISTED_VERSION_NOTE = 'Esta versión ya está en el control de cambios: al publicar se reemplaza esa línea.';

const versionHint = props.currentVersion
  ? `Formato v<mayor>.<menor>. La versión vigente es ${props.currentVersion}.`
  : 'Formato v<mayor>.<menor>, por ejemplo v1.0. Puede seguir la numeración que la política ya traía.';

const typedVersion = ref('');
const replacesListedVersion = computed(() => props.listedVersions.includes(typedVersion.value.trim()));

const fields = computed<Field[]>(() => [
  {
    name: 'version',
    label: 'Versión',
    kind: 'text',
    required: true,
    placeholder: 'v2.1',
    hint: replacesListedVersion.value ? `${versionHint} ${REPLACES_LISTED_VERSION_NOTE}` : versionHint,
    maxLength: FIELD_MAX.badge,
  },
  { name: 'effectiveDate', label: 'Fecha de vigencia', kind: 'date', required: true },
  { name: 'author', label: 'Autor', kind: 'text', required: true, maxLength: FIELD_MAX.shortText },
  { name: 'reason', label: 'Motivo del cambio', kind: 'textarea', required: true, maxLength: FIELD_MAX.description },
]);

const initialValues = { effectiveDate: todayIsoDate() };

function trackTypedVersion(name: string, value: string) {
  if (name === 'version') typedVersion.value = value;
}

function publish(formData: FormData) {
  formData.set('id', String(props.policyId));
  const toast: CapToastOptions = { status: 'ok', title: 'Versión publicada', detail: String(formData.get('version') ?? '') };
  submit(fields.value, formData, () => actions.policies.publish(formData), () => navigateWithToast(toast));
}
</script>

<template>
  <FormModal
    title="Publicar versión"
    submit-label="Publicar versión"
    :fields="fields"
    :initial-values="initialValues"
    :submitting="submitting"
    :form-error="formError"
    :field-errors="fieldErrors"
    @field-input="trackTypedVersion"
    @close="emit('close')"
    @submit="publish"
  />
</template>
