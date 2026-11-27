<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import FileDrop from './FileDrop.vue';
import RequiredMark from './RequiredMark.vue';
import { uploadKindOf, type Field } from './types';
import {
  fieldErrorClass,
  fieldHelpClass,
  fieldInputClass,
  fieldLabelClass,
  fieldDateClass,
  fieldSelectClass,
  fieldTextareaClass,
  withFieldError,
} from '../../lib/capClasses';
import { PHONE_DISALLOWED_CHARS, uploadPickerRules } from '../../lib/fieldRules';

const props = withDefaults(
  defineProps<{
    field: Field;
    value?: string;
    error?: string;
  }>(),
  { value: '', error: '' },
);

// Estado local: con :value, cada re-render (p. ej. al mostrar un error) borraba lo escrito.
// El modal se monta de nuevo al abrirse, así que el valor inicial basta.
const model = ref(props.value);
const emit = defineEmits<{ 'update:value': [value: string] }>();
watch(model, (value) => emit('update:value', value));

const inputId = computed(() => `field-${props.field.name}`);
const hintId = computed(() => `hint-${props.field.name}`);
const errorId = computed(() => `error-${props.field.name}`);

const inputType = computed(() => {
  if (props.field.kind === 'url') return 'url';
  if (props.field.kind === 'email') return 'email';
  if (props.field.kind === 'tel') return 'tel';
  if (props.field.kind === 'date') return 'date';
  return 'text';
});

const uploadRules = computed(() => {
  const kind = uploadKindOf(props.field);
  return kind ? uploadPickerRules(kind) : null;
});

const describedBy = computed(
  () => [props.field.hint && hintId.value, props.error && errorId.value].filter(Boolean).join(' ') || undefined,
);

const controlClass = computed(() => {
  if (props.field.kind === 'textarea') return fieldTextareaClass;
  if (props.field.kind === 'select') return fieldSelectClass;
  return props.field.kind === 'date' ? fieldDateClass : fieldInputClass;
});
const controlClassWithState = computed(() => withFieldError(controlClass.value, Boolean(props.error)));

// En teléfono solo se aceptan dígitos, "+", guion y espacio mientras se escribe.
function sanitizeTelInput(event: Event) {
  if (props.field.kind !== 'tel') return;
  const cleaned = (event.target as HTMLInputElement).value.replace(PHONE_DISALLOWED_CHARS, '');
  if (cleaned !== model.value) model.value = cleaned;
}
</script>

<template>
  <div>
    <label v-if="field.kind === 'toggle'" class="cap-check text-sm font-medium text-gray-900 dark:text-gray-100">
      <input type="checkbox" class="cap-check__box" :name="field.name" :checked="value === 'true' || value === '1'" />
      {{ field.label }}
    </label>

    <FileDrop
      v-else-if="uploadRules"
      :name="field.name"
      :label="field.label"
      :hint="uploadRules.hint"
      :accept="uploadRules.accept"
      :note="field.hint"
      :error="error"
    />

    <template v-else>
      <label :class="fieldLabelClass" :for="inputId">
        {{ field.label }} <RequiredMark v-if="field.required" />
      </label>
      <textarea
        v-if="field.kind === 'textarea'"
        :id="inputId"
        :name="field.name"
        :required="field.required"
        :aria-required="field.required || undefined"
        :aria-invalid="error ? 'true' : undefined"
        :maxlength="field.maxLength"
        :placeholder="field.placeholder"
        :aria-describedby="describedBy"
        rows="3"
        :class="controlClassWithState"
        v-model="model"
      ></textarea>
      <select
        v-else-if="field.kind === 'select'"
        :id="inputId"
        :name="field.name"
        :required="field.required"
        :aria-required="field.required || undefined"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        :class="controlClassWithState"
        v-model="model"
      >
        <option v-if="!field.required" value="">{{ field.placeholder ?? 'Ninguna' }}</option>
        <option v-else value="" disabled>Selecciona…</option>
        <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <input
        v-else
        :id="inputId"
        :name="field.name"
        :type="inputType"
        :inputmode="field.kind === 'tel' ? 'tel' : undefined"
        :required="field.required"
        :aria-required="field.required || undefined"
        :aria-invalid="error ? 'true' : undefined"
        :maxlength="field.maxLength"
        :placeholder="field.placeholder"
        :aria-describedby="describedBy"
        :class="controlClassWithState"
        v-model="model"
        @input="sanitizeTelInput"
      />
      <p v-if="field.hint" :id="hintId" :class="fieldHelpClass">{{ field.hint }}</p>
      <p v-if="error" :id="errorId" :class="fieldErrorClass">{{ error }}</p>
    </template>
  </div>
</template>
