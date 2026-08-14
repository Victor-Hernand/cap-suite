<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AppCategory, AppLink, SearchItem } from '../data/types';

const props = withDefaults(
  defineProps<{
    mode: 'global' | 'catalog';
    apps?: AppLink[];
    categories?: { id: AppCategory; label: string }[];
    searchItems?: SearchItem[];
  }>(),
  {
    apps: () => [],
    categories: () => [],
    searchItems: () => [],
  }
);

const query = ref('');
const activeCategory = ref<AppCategory | 'all'>('all');

const tileClasses: Record<AppCategory, string> = {
  erp: 'bg-amber-500/10 text-electric',
  microsoft365: 'bg-sky-500/10 text-sky-800',
  portals: 'bg-teal-500/10 text-accent',
  tools: 'bg-indigo-500/10 text-indigo-700',
};

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const filteredApps = computed(() => {
  const text = normalize(query.value.trim());
  return props.apps.filter((app) => {
    const matchesCategory = activeCategory.value === 'all' || app.category === activeCategory.value;
    const matchesText = !text || normalize(`${app.name} ${app.description}`).includes(text);
    return matchesCategory && matchesText;
  });
});

const globalResults = computed(() => {
  const text = normalize(query.value.trim());
  if (!text) return [];
  return props.searchItems
    .filter((item) => normalize(`${item.name} ${item.description}`).includes(text))
    .slice(0, 8);
});
</script>

<template>
  <div>
    <input
      v-model="query"
      type="search"
      :placeholder="mode === 'global' ? 'Buscar sistemas, recursos, contactos…' : 'Buscar aplicación…'"
      :aria-label="mode === 'global' ? 'Buscar en el portal' : 'Buscar aplicación'"
      class="w-full rounded-xl border border-edge-strong bg-surface px-5 py-3.5 text-bright shadow-sm placeholder-body transition-colors duration-300 focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    />

    <div v-if="mode === 'catalog'" class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        :class="[
          'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-200',
          activeCategory === 'all'
            ? 'border-transparent bg-gradient-to-r from-accent to-[#0a5f63] text-white shadow-lg'
            : 'border-edge-strong text-body hover:border-accent hover:text-accent',
        ]"
        @click="activeCategory = 'all'"
      >
        Todas
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        :class="[
          'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-200',
          activeCategory === category.id
            ? 'border-transparent bg-gradient-to-r from-accent to-[#0a5f63] text-white shadow-lg'
            : 'border-edge-strong text-body hover:border-accent hover:text-accent',
        ]"
        @click="activeCategory = category.id"
      >
        {{ category.label }}
      </button>
    </div>

    <TransitionGroup
      v-if="mode === 'catalog'"
      tag="div"
      name="card"
      class="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <a
        v-for="app in filteredApps"
        :key="app.id"
        :href="app.url"
        target="_blank"
        rel="noopener"
        class="lift group block rounded-2xl border border-edge bg-surface p-5"
      >
        <div class="flex items-start justify-between">
          <span :class="['flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold', tileClasses[app.category]]">
            {{ app.name.charAt(0) }}
          </span>
          <span class="text-body opacity-0 transition duration-300 group-hover:translate-x-1 group-hover:opacity-100">→</span>
        </div>
        <h3 class="mt-4 font-semibold transition-colors duration-200 group-hover:text-accent">{{ app.name }}</h3>
        <p class="mt-1 text-sm text-body">{{ app.description }}</p>
        <p v-if="app.company" class="mt-2 text-xs text-body/70">{{ app.company }}</p>
      </a>
    </TransitionGroup>
    <p v-if="mode === 'catalog' && filteredApps.length === 0" class="mt-8 rounded-2xl border border-dashed border-edge-strong p-8 text-center text-body">
      No se encontraron aplicaciones para tu búsqueda.
    </p>

    <Transition name="fade">
      <ul v-if="mode === 'global' && query.trim()" class="mt-3 divide-y divide-edge overflow-hidden rounded-2xl border border-edge-strong bg-surface shadow-xl">
        <li v-for="item in globalResults" :key="item.id">
          <a :href="item.url" class="flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-150 hover:bg-ink">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ item.name }}</p>
              <p class="truncate text-sm text-body">{{ item.description }}</p>
            </div>
            <span class="shrink-0 rounded-full border border-edge-strong px-2.5 py-0.5 text-xs text-body">{{ item.section }}</span>
          </a>
        </li>
        <li v-if="globalResults.length === 0" class="px-5 py-4 text-center text-sm text-body">
          Sin resultados para "{{ query }}".
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.card-enter-active,
.card-move {
  transition: all 0.3s ease;
}

.card-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .card-enter-active,
  .card-move,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
