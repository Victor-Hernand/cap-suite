<script setup lang="ts">
import { storedFileName } from './policyEditorState';
import { inlineLinkClass } from '../../lib/capClasses';

const props = withDefaults(defineProps<{ filePath: string; label?: string }>(), { label: 'Archivo actual' });
</script>

<template>
  <p class="mt-2 flex flex-wrap items-center gap-1 text-xs text-cap-text-soft">
    {{ props.label }}:
    <a
      :href="`/files/${props.filePath}`"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-1 font-medium text-gray-900 dark:text-gray-100"
      :class="inlineLinkClass"
    >
      {{ storedFileName(props.filePath) }}<i class="mdi mdi-open-in-new text-base leading-none" aria-hidden="true" />
    </a>
    <span>Sube otro para reemplazarlo.</span>
  </p>
</template>
