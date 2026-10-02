<script setup lang="ts">
import { ref } from 'vue';
import { actions } from 'astro:actions';
import FormModal from './FormModal.vue';
import { useActionForm } from './useActionForm';
import { primaryButtonClass } from './formStyles';
import { FIELD_MAX } from '../../lib/fieldRules';
import type { Field } from './types';

const props = defineProps<{
  videoUrl: string;
  hasPdf: boolean;
}>();

const { submitting, formError, fieldErrors, resetErrors, submit } = useActionForm();
const modalOpen = ref(false);

const fields: Field[] = [
  {
    name: 'videoUrl',
    label: 'VIDEO DE LOOM',
    kind: 'url',
    placeholder: 'https://www.loom.com/share/…',
    hint: 'En Loom usa «Share» → «Copy link» y pégalo aquí. Déjalo vacío para quitar el video.',
    maxLength: FIELD_MAX.url,
  },
  {
    name: 'pdf',
    label: 'MANUAL EN PDF',
    kind: 'file-manual',
    hint: props.hasPdf ? 'Si no subes uno nuevo, se conserva el PDF actual.' : undefined,
  },
];

function openForm() {
  resetErrors();
  modalOpen.value = true;
}

function save(formData: FormData) {
  submit(fields, formData, () => actions.manual.save(formData));
}
</script>

<template>
  <div>
    <button type="button" :class="primaryButtonClass" @click="openForm">
      Editar manual
    </button>
    <FormModal
      v-if="modalOpen"
      title="Editar manual"
      submit-label="Guardar manual"
      :fields="fields"
      :initial-values="{ videoUrl: props.videoUrl }"
      :submitting="submitting"
      :form-error="formError"
      :field-errors="fieldErrors"
      @close="modalOpen = false"
      @submit="save"
    />
  </div>
</template>
