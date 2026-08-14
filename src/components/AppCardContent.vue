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
      <div>
        <img
          v-if="app.logo"
          :src="app.logo"
          :alt="`Logo de ${app.name}`"
          aria-hidden="true"
          class="h-11 w-11 rounded-xl border border-edge bg-white object-contain p-1.5"
          onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')"
        />
        <span
          aria-hidden="true"
          :class="['flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold', categoryStyles[app.category].tile, { hidden: app.logo }]"
        >
          {{ app.name.charAt(0) }}
        </span>
      </div>
      <span
        aria-hidden="true"
        class="text-body/50 transition duration-300 group-hover:translate-x-1 group-hover:text-accent group-focus-within:translate-x-1 group-focus-within:text-accent"
      >
        ↗
      </span>
    </div>
    <h3 class="mt-4 flex flex-wrap items-center gap-2 font-semibold transition-colors duration-200 group-hover:text-accent group-focus-within:text-accent">
      <span>{{ app.name }}<span class="sr-only"> (se abre en una pestaña nueva)</span></span>
      <span
        v-if="app.badge === 'nuevo'"
        class="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-electric"
      >
        Nuevo
      </span>
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
