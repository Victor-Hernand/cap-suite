<script setup lang="ts">
import { tableLinkClass } from '../../lib/capClasses';
import type { Column, Row } from './types';

const props = defineProps<{ row: Row; column: Column; text: string; recordLabel: string }>();

const emit = defineEmits<{ toggle: [] }>();
</script>

<template>
  <span v-if="props.column.kind === 'swatch'" class="flex max-w-xs items-center gap-2" :title="props.text">
    <span
      v-if="props.row.swatchColor"
      class="h-2.5 w-2.5 shrink-0 rounded-sm"
      :style="{ backgroundColor: String(props.row.swatchColor) }"
      aria-hidden="true"
    />
    <span class="truncate">{{ props.text }}</span>
  </span>
  <label v-else-if="props.column.kind === 'toggle'" class="cap-check">
    <input
      type="checkbox"
      class="cap-check__box"
      :checked="Boolean(props.row[props.column.key])"
      :aria-label="`${props.column.label}: ${props.recordLabel}`"
      @change="emit('toggle')"
    />
  </label>
  <a
    v-else-if="props.column.kind === 'link' && props.column.hrefKey"
    :href="String(props.row[props.column.hrefKey])"
    class="block max-w-xs truncate"
    :class="tableLinkClass"
    :title="props.text"
  >{{ props.text }}</a>
  <span
    v-else
    class="block max-w-xs truncate"
    :class="props.column.kind === 'muted' ? 'text-cap-text-soft' : 'font-medium'"
    :title="props.text"
  >{{ props.text }}</span>
</template>
