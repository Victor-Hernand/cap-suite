<script setup lang="ts">
import { nextTick, onMounted, ref, useId, watch } from 'vue';
import CapAlert from '../../design/vue/CapAlert.vue';
import CapButton from '../../design/vue/CapButton.vue';
import { useEscapeKey } from '../../design/vue/composables/useEscapeKey.js';
import { useFocusTrap } from '../../design/vue/composables/useFocusTrap.js';
import FormField from './FormField.vue';
import RequiredMark from './RequiredMark.vue';
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
  fieldInput: [name: string, value: string];
}>();

const titleId = useId();
const formRef = ref<HTMLFormElement | null>(null);
const firstFieldRef = ref<HTMLElement | null>(null);
const isOpen = ref(true);
const hasRequiredFields = props.fields.some((field) => field.required);

// Registrado antes que la trampa de foco: así el foco inicial cae en el primer campo y no en el cierre.
onMounted(() => {
  firstFieldRef.value =
    formRef.value?.querySelector<HTMLElement>('input:not([type=hidden]):not([type=file]), select, textarea') ?? null;
});
useFocusTrap(formRef, isOpen, firstFieldRef);
useEscapeKey(isOpen, close);

watch(
  () => props.fieldErrors,
  async () => {
    await nextTick();
    formRef.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  },
);

function close() {
  if (!props.submitting) emit('close');
}

function onSubmit() {
  if (formRef.value) emit('submit', new FormData(formRef.value));
}
</script>

<template>
  <div class="fixed inset-0 z-cap-modal bg-cap-chrome/35 backdrop-blur-sm animate-cap-fade-in" @click="close" />
  <!-- novalidate: la validación nativa del navegador sale en su idioma; los mensajes los da el servidor. -->
  <form
    ref="formRef"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    novalidate
    class="fixed inset-x-4 top-[10vh] z-cap-modal mx-auto flex max-h-[80vh] w-full max-w-lg animate-cap-rise-in flex-col rounded-cap-shell border border-cap-divider bg-cap-card shadow-xl max-md:inset-0 max-md:max-h-none max-md:max-w-none max-md:rounded-none max-md:border-0"
    @submit.prevent="onSubmit"
  >
    <header class="flex items-center justify-between border-b border-cap-divider px-6 py-4">
      <h2 :id="titleId" class="font-display text-lg font-semibold text-gray-900 dark:text-gray-100">{{ props.title }}</h2>
      <button
        type="button"
        aria-label="Cerrar"
        class="rounded-full p-1 text-cap-text-soft transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2 hover:text-gray-900 dark:hover:text-gray-100"
        @click="close"
      >
        <i class="mdi mdi-close text-xl" aria-hidden="true" />
      </button>
    </header>
    <div class="min-h-0 flex-1 overflow-y-auto p-6 text-sm text-gray-700 dark:text-gray-300">
      <CapAlert v-if="props.formError" class="mb-4" status="error" title="No se pudo guardar" :detail="props.formError" />
      <div class="flex flex-col gap-4">
        <FormField
          v-for="field in props.fields"
          :key="field.name"
          :field="field"
          :value="props.initialValues[field.name] ?? ''"
          :error="props.fieldErrors[field.name]?.[0]"
          @update:value="emit('fieldInput', field.name, $event)"
        />
      </div>
    </div>
    <footer class="flex flex-wrap items-center justify-between gap-2 border-t border-cap-divider px-6 py-4">
      <p v-if="hasRequiredFields" class="text-xs text-cap-text-soft"><RequiredMark /> Campo obligatorio</p>
      <div class="ml-auto flex gap-2">
        <CapButton variant="secondary" @click="close">Cancelar</CapButton>
        <CapButton type="submit" :loading="props.submitting">{{ props.submitLabel }}</CapButton>
      </div>
    </footer>
  </form>
</template>
