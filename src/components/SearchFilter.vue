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
  erp: 'bg-amber-500/15 text-accent',
  microsoft365: 'bg-sky-500/15 text-electric',
  portals: 'bg-emerald-500/15 text-emerald-400',
  tools: 'bg-violet-500/15 text-violet-400',
};

const filteredApps = computed(() => {
  const text = query.value.trim().toLowerCase();
  return props.apps.filter((app) => {
    const matchesCategory = activeCategory.value === 'all' || app.category === activeCategory.value;
    const matchesText = !text || `${app.name} ${app.description}`.toLowerCase().includes(text);
    return matchesCategory && matchesText;
  });
});

const globalResults = computed(() => {
  const text = query.value.trim().toLowerCase();
  if (!text) return [];
  return props.searchItems
    .filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(text))
    .slice(0, 8);
});
</script>

<template>
  <div>
    <input
      v-model="query"
      type="search"
      :placeholder="mode === 'global' ? 'Buscar sistemas, recursos, contactos…' : 'Buscar aplicación…'"
      class="w-full rounded-xl border border-edge bg-surface px-5 py-3.5 text-bright placeholder-body outline-none transition duration-300 focus:border-accent focus:shadow-lg focus:shadow-accent/10"
    />

    <div v-if="mode === 'catalog'" class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        :class="[
          'rounded-full border px-4 py-1.5 text-sm transition-colors duration-200',
          activeCategory === 'all' ? 'border-accent bg-accent text-ink font-semibold' : 'border-edge text-body hover:border-accent hover:text-bright',
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
          'rounded-full border px-4 py-1.5 text-sm transition-colors duration-200',
          activeCategory === category.id ? 'border-accent bg-accent text-ink font-semibold' : 'border-edge text-body hover:border-accent hover:text-bright',
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
        class="group block rounded-xl border border-edge bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10"
      >
        <span :class="['flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold', tileClasses[app.category]]">
          {{ app.name.charAt(0) }}
        </span>
        <h3 class="mt-4 font-semibold transition-colors duration-200 group-hover:text-accent">{{ app.name }}</h3>
        <p class="mt-1 text-sm text-body">{{ app.description }}</p>
        <p v-if="app.company" class="mt-2 text-xs text-body/70">{{ app.company }}</p>
      </a>
    </TransitionGroup>
    <p v-if="mode === 'catalog' && filteredApps.length === 0" class="mt-8 rounded-xl border border-dashed border-edge p-8 text-center text-body">
      No se encontraron aplicaciones para tu búsqueda.
    </p>

    <Transition name="fade">
      <ul v-if="mode === 'global' && query.trim()" class="mt-3 divide-y divide-edge overflow-hidden rounded-xl border border-edge bg-surface">
        <li v-for="item in globalResults" :key="`${item.section}-${item.name}`">
          <a :href="item.url" class="flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-150 hover:bg-ink/50">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ item.name }}</p>
              <p class="truncate text-sm text-body">{{ item.description }}</p>
            </div>
            <span class="shrink-0 rounded-full border border-edge px-2.5 py-0.5 text-xs text-body">{{ item.section }}</span>
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
.card-leave-active,
.card-move {
  transition: all 0.3s ease;
}

.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.card-leave-active {
  position: absolute;
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
  .card-leave-active,
  .card-move,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
