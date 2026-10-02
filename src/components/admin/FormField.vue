<script setup lang="ts">
import { computed, ref } from 'vue';
import FileDrop from './FileDrop.vue';
import { uploadKindOf, type Field } from './types';
import { fieldErrorClass, inputClass, labelClass, selectClass, textareaClass } from './formStyles';
import { PHONE_DISALLOWED_CHARS, UPLOAD_RULES, uploadLimitLabel } from '../../lib/fieldRules';

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

const inputId = computed(() => `field-${props.field.name}`);
const hintId = computed(() => `hint-${props.field.name}`);

const inputType = computed(() => {
  if (props.field.kind === 'url') return 'url';
  if (props.field.kind === 'email') return 'email';
  if (props.field.kind === 'tel') return 'tel';
  return 'text';
});

const uploadRules = computed(() => {
  const kind = uploadKindOf(props.field);
  if (!kind) return null;
  const rules = UPLOAD_RULES[kind];
  return { accept: rules.extensions.join(','), hint: `${rules.description}, máx. ${uploadLimitLabel(kind)}` };
});

const describedBy = computed(() => (props.field.hint ? hintId.value : undefined));

// En teléfono solo se aceptan dígitos, "+", guion y espacio mientras se escribe.
function sanitizeTelInput(event: Event) {
  if (props.field.kind !== 'tel') return;
  const cleaned = (event.target as HTMLInputElement).value.replace(PHONE_DISALLOWED_CHARS, '');
  if (cleaned !== model.value) model.value = cleaned;
}
</script>

<template>
  <div>
    <label v-if="field.kind === 'toggle'" class="flex items-center gap-2 text-sm font-semibold text-ink">
      <input type="checkbox" :name="field.name" :checked="value === 'true' || value === '1'" />
      {{ field.label }}
    </label>

    <FileDrop
      v-else-if="uploadRules"
      :name="field.name"
      :label="field.label"
      :hint="uploadRules.hint"
      :accept="uploadRules.accept"
      :note="field.hint"
    />

    <template v-else>
      <label :class="labelClass" :for="inputId">
        {{ field.label }}<span v-if="field.required" class="text-red-700" aria-hidden="true"> *</span>
      </label>
      <textarea
        v-if="field.kind === 'textarea'"
        :id="inputId"
        :name="field.name"
        :required="field.required"
        :maxlength="field.maxLength"
        :placeholder="field.placeholder"
        :aria-describedby="describedBy"
        rows="3"
        :class="textareaClass"
        v-model="model"
      ></textarea>
      <select
        v-else-if="field.kind === 'select'"
        :id="inputId"
        :name="field.name"
        :required="field.required"
        :aria-describedby="describedBy"
        :class="selectClass"
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
        :maxlength="field.maxLength"
        :placeholder="field.placeholder"
        :aria-describedby="describedBy"
        :class="inputClass"
        v-model="model"
        @input="sanitizeTelInput"
      />
      <p v-if="field.hint" :id="hintId" class="mt-1 text-xs text-muted">{{ field.hint }}</p>
      <p v-if="error" :class="fieldErrorClass">{{ error }}</p>
    </template>
  </div>
</template>
