<script setup lang="ts">
import type { SortState } from './useTableView';

const props = withDefaults(defineProps<{ label: string; sortState: SortState; active?: boolean }>(), { active: false });

const emit = defineEmits<{ sort: [] }>();
</script>

<template>
  <th class="px-4 py-2 font-medium" :aria-sort="props.sortState.aria">
    <button
      type="button"
      class="inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-widest hover:text-ink"
      :class="props.active ? 'text-ink' : ''"
      :title="`Ordenar por ${props.label.toLowerCase()}`"
      @click="emit('sort')"
    >
      {{ props.label }} <span aria-hidden="true">{{ props.sortState.icon }}</span>
    </button>
  </th>
</template>
