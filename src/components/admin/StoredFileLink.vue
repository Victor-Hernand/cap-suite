<script setup lang="ts">
import { storedFileName } from './policyEditorState';

const props = withDefaults(defineProps<{ filePath: string; label?: string }>(), { label: 'Archivo actual' });
</script>

<template>
  <p class="mt-1 text-xs text-muted">
    {{ props.label }}:
    <a :href="`/files/${props.filePath}`" target="_blank" rel="noopener" class="font-semibold text-ink hover:underline">
      {{ storedFileName(props.filePath) }}
    </a>. Sube otro para reemplazarlo.
  </p>
</template>
