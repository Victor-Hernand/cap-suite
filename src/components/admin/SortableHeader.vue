<script setup lang="ts">
import { tableHeadClass } from '../../lib/capClasses';
import type { SortState } from './useTableView';

const props = defineProps<{ label: string; sortState: SortState }>();

const emit = defineEmits<{ sort: [] }>();
</script>

<template>
  <th scope="col" :class="tableHeadClass" :aria-sort="props.sortState.aria">
    <button
      type="button"
      class="inline-flex items-center gap-1 whitespace-nowrap rounded-md text-current hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-chrome dark:focus-visible:ring-gray-100"
      :title="`Ordenar por ${props.label.toLowerCase()}`"
      @click="emit('sort')"
    >
      {{ props.label }}
      <i v-if="props.sortState.icon" class="mdi text-base leading-none text-current" :class="props.sortState.icon" aria-hidden="true" />
    </button>
  </th>
</template>
