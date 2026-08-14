<script setup lang="ts">
import { categoryStyles } from '../data/apps';
import type { AppLink } from '../data/types';

defineProps<{ app: AppLink }>();
</script>

<template>
  <a
    :href="app.url"
    target="_blank"
    rel="noopener"
    class="lift group flex h-full flex-col rounded-2xl border border-edge bg-surface p-5"
  >
    <div class="flex items-start justify-between">
      <span
        aria-hidden="true"
        :class="['flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold', categoryStyles[app.category].tile]"
      >
        {{ app.name.charAt(0) }}
      </span>
      <span
        aria-hidden="true"
        class="text-body/50 transition duration-300 group-hover:translate-x-1 group-hover:text-accent group-focus-within:translate-x-1 group-focus-within:text-accent"
      >
        ↗
      </span>
    </div>
    <h3 class="mt-4 font-semibold transition-colors duration-200 group-hover:text-accent group-focus-within:text-accent">
      {{ app.name }}<span class="sr-only"> (se abre en una pestaña nueva)</span>
    </h3>
    <p class="mt-1 text-sm text-body">{{ app.description }}</p>
    <span
      v-if="app.company"
      class="mt-3 inline-block self-start rounded-full border border-edge-strong px-2 py-0.5 text-xs text-body"
    >
      {{ app.company }}
    </span>
  </a>
</template>
