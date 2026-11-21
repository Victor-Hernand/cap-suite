<script setup lang="ts">
import RepeatableList from './RepeatableList.vue';
import RequiredMark from './RequiredMark.vue';
import { inputClass, labelClass, textareaClass } from './formStyles';
import { createGuideline, type GuidelineDraft } from './policyEditorState';
import { FIELD_MAX } from '../../lib/fieldRules';

const guidelines = defineModel<GuidelineDraft[]>('guidelines', { required: true });
</script>

<template>
  <RepeatableList
    v-model:items="guidelines"
    add-label="Agregar lineamiento"
    empty-text="Sin lineamientos. Agrega las reglas concretas que establece la política."
    :create-item="createGuideline"
  >
    <template #default="{ item }">
      <label :class="labelClass" :for="`guideline-title-${item.key}`">TÍTULO <RequiredMark /></label>
      <input
        :id="`guideline-title-${item.key}`"
        v-model="item.title"
        type="text"
        :maxlength="FIELD_MAX.name"
        :class="inputClass"
      />
      <label :class="[labelClass, 'mt-3']" :for="`guideline-body-${item.key}`">TEXTO <RequiredMark /></label>
      <textarea
        :id="`guideline-body-${item.key}`"
        v-model="item.body"
        rows="3"
        :maxlength="FIELD_MAX.guidelineBody"
        :class="textareaClass"
      ></textarea>
    </template>
  </RepeatableList>
</template>
