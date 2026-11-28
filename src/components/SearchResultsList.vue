<script setup lang="ts">
import type { SearchItem } from '../data/types';

withDefaults(
  defineProps<{
    listboxId: string;
    results?: SearchItem[];
    activeIndex?: number;
    query?: string;
  }>(),
  { results: () => [], activeIndex: 0, query: '' },
);

defineEmits<{ hover: [index: number]; select: [] }>();

function isExternal(url: string): boolean {
  return url.startsWith('http');
}
</script>

<template>
  <ul :id="listboxId" role="listbox" aria-label="Resultados de búsqueda" class="max-h-80 overflow-y-auto py-1">
    <li v-for="(item, index) in results" :key="item.id" role="presentation">
      <a
        :id="`${listboxId}-option-${index}`"
        role="option"
        :aria-selected="index === activeIndex"
        :href="item.url"
        :target="isExternal(item.url) ? '_blank' : undefined"
        :rel="isExternal(item.url) ? 'noopener' : undefined"
        class="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100"
        :class="index === activeIndex ? 'bg-cap-page' : ''"
        @mouseenter="$emit('hover', index)"
        @click="$emit('select')"
      >
        <span class="min-w-0 truncate">
          <span class="font-semibold">{{ item.name }}</span>
          <span class="ml-2 text-xs text-cap-text-soft">{{ item.description }}</span>
        </span>
        <span class="shrink-0 text-xs text-cap-text-soft">{{ item.section }}</span>
      </a>
    </li>
    <li v-if="results.length === 0" role="presentation" class="px-4 py-6 text-center text-sm text-cap-text-soft">
      Sin resultados para "{{ query }}"
    </li>
  </ul>
</template>
