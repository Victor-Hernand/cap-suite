<script setup lang="ts">
import { ref } from 'vue';
import FormField from './FormField.vue';
import { alertErrorClass, primaryButtonClass } from './formStyles';
import type { Field } from './types';
import type { FieldErrors } from './useActionForm';

const props = defineProps<{
  title: string;
  submitLabel: string;
  fields: Field[];
  initialValues: Record<string, string>;
  submitting: boolean;
  formError: string;
  fieldErrors: FieldErrors;
}>();

const emit = defineEmits<{
  close: [];
  submit: [formData: FormData];
}>();

const formRef = ref<HTMLFormElement | null>(null);
const hasRequiredFields = props.fields.some((field) => field.required);

function close() {
  if (!props.submitting) emit('close');
}

function onSubmit() {
  if (formRef.value) emit('submit', new FormData(formRef.value));
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 pt-16" @click.self="close">
    <!-- novalidate: la validación nativa del navegador sale en su idioma; los mensajes los da el servidor. -->
    <form
      ref="formRef"
      class="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-surface text-ink shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
      novalidate
      @submit.prevent="onSubmit"
    >
      <div class="flex items-center justify-between border-b border-edge px-6 py-4">
        <h2 id="form-modal-title" class="text-lg font-extrabold text-ink">{{ props.title }}</h2>
        <button type="button" class="text-muted hover:text-ink" aria-label="Cerrar" @click="close">✕</button>
      </div>
      <div class="overflow-y-auto px-6 py-4">
        <p v-if="props.formError" :class="[alertErrorClass, 'mb-4']" role="alert">{{ props.formError }}</p>
        <div class="grid grid-cols-1 gap-4">
          <FormField
            v-for="field in props.fields"
            :key="field.name"
            :field="field"
            :value="props.initialValues[field.name] ?? ''"
            :error="props.fieldErrors[field.name]?.[0]"
          />
        </div>
      </div>
      <div class="flex items-center justify-between gap-2 border-t border-edge px-6 py-4">
        <p v-if="hasRequiredFields" class="text-xs text-muted"><span class="text-red-700">*</span> Campo obligatorio</p>
        <div class="ml-auto flex gap-2">
          <button type="button" class="rounded-lg border border-edge px-4 py-2 text-sm text-ink" @click="close">
            Cancelar
          </button>
          <button
            type="submit"
            :class="primaryButtonClass"
            :disabled="props.submitting"
          >
            {{ props.submitting ? 'Guardando…' : props.submitLabel }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
