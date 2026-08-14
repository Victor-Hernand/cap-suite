<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue';
import AppCardContent from './AppCardContent.vue';
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

const maxGlobalResults = 8;

const query = ref('');
const activeCategory = ref<AppCategory | 'all'>('all');
const activeIndex = ref(-1);
const listboxId = useId();

const isGlobal = computed(() => props.mode === 'global');
const trimmedQuery = computed(() => query.value.trim());

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const filteredApps = computed(() => {
  const text = normalize(trimmedQuery.value);
  return props.apps.filter((app) => {
    const matchesCategory = activeCategory.value === 'all' || app.category === activeCategory.value;
    const matchesText = !text || normalize(`${app.name} ${app.description}`).includes(text);
    return matchesCategory && matchesText;
  });
});

const activeCategoryLabel = computed(
  () => props.categories.find((category) => category.id === activeCategory.value)?.label ?? ''
);

const rankedItems = computed(() => {
  const text = normalize(trimmedQuery.value);
  if (!text) return [];
  return props.searchItems
    .map((item) => {
      const name = normalize(item.name);
      const description = normalize(item.description);
      if (name.startsWith(text)) return { item, score: 0 };
      if (name.includes(text)) return { item, score: 1 };
      if (description.includes(text)) return { item, score: 2 };
      return null;
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.item);
});

const globalResults = computed(() => rankedItems.value.slice(0, maxGlobalResults));
const hasMoreResults = computed(() => rankedItems.value.length > maxGlobalResults);
const isListboxOpen = computed(() => isGlobal.value && trimmedQuery.value.length > 0);
const optionCount = computed(() => globalResults.value.length + (hasMoreResults.value ? 1 : 0));
const catalogUrl = computed(() => `/apps?q=${encodeURIComponent(trimmedQuery.value)}`);
const activeOptionId = computed(() =>
  activeIndex.value >= 0 ? `${listboxId}-option-${activeIndex.value}` : undefined
);
const resultsAnnouncement = computed(() =>
  isListboxOpen.value ? `${rankedItems.value.length} resultados` : ''
);

function moveActiveOption(step: number) {
  const count = optionCount.value;
  if (count === 0) return;
  activeIndex.value =
    activeIndex.value < 0 ? (step > 0 ? 0 : count - 1) : (activeIndex.value + step + count) % count;
}

function openActiveOption() {
  const result = globalResults.value[activeIndex.value];
  window.location.href = result ? result.url : catalogUrl.value;
}

function onKeydown(event: KeyboardEvent) {
  if (!isGlobal.value) {
    if (event.key === 'Escape') query.value = '';
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveActiveOption(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveActiveOption(-1);
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault();
    openActiveOption();
  } else if (event.key === 'Escape') {
    query.value = '';
    activeIndex.value = -1;
  }
}

function clearFilters() {
  query.value = '';
  activeCategory.value = 'all';
}

function syncUrl() {
  const params = new URLSearchParams();
  if (trimmedQuery.value) params.set('q', trimmedQuery.value);
  if (activeCategory.value !== 'all') params.set('cat', activeCategory.value);
  const search = params.toString();
  history.replaceState(null, '', search ? `${location.pathname}?${search}` : location.pathname);
}

watch(query, () => {
  activeIndex.value = -1;
});

watch(activeIndex, async (index) => {
  if (index < 0) return;
  await nextTick();
  document.getElementById(`${listboxId}-option-${index}`)?.scrollIntoView({ block: 'nearest' });
});

watch([query, activeCategory], () => {
  if (!isGlobal.value) syncUrl();
});

onMounted(() => {
  if (isGlobal.value) return;
  const params = new URLSearchParams(location.search);
  query.value = params.get('q') ?? '';
  const category = params.get('cat');
  if (props.categories.some((item) => item.id === category)) {
    activeCategory.value = category as AppCategory;
  }
});
</script>

<template>
  <div class="relative">
    <input
      v-model="query"
      type="search"
      :placeholder="isGlobal ? 'Buscar sistemas, recursos, contactos…' : 'Buscar aplicación…'"
      :aria-label="isGlobal ? 'Buscar en el portal' : 'Buscar aplicación'"
      :role="isGlobal ? 'combobox' : undefined"
      :aria-autocomplete="isGlobal ? 'list' : undefined"
      :aria-expanded="isGlobal ? isListboxOpen : undefined"
      :aria-controls="isGlobal ? listboxId : undefined"
      :aria-activedescendant="activeOptionId"
      class="w-full rounded-xl border border-edge-strong bg-surface px-5 py-3.5 text-bright shadow-sm placeholder-body transition-colors duration-300 focus:border-accent"
      @keydown="onKeydown"
    />

    <p v-if="isGlobal" class="sr-only" aria-live="polite">{{ resultsAnnouncement }}</p>

    <div v-if="!isGlobal" role="group" aria-label="Filtrar por categoría" class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        :aria-pressed="activeCategory === 'all'"
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
        :aria-pressed="activeCategory === category.id"
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

    <p v-if="!isGlobal" class="mt-6 text-sm text-body" aria-live="polite">
      {{ filteredApps.length }} de {{ apps.length }} aplicaciones
    </p>

    <TransitionGroup
      v-if="!isGlobal"
      tag="div"
      name="card"
      class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <AppCardContent v-for="app in filteredApps" :key="app.id" :app="app" />
    </TransitionGroup>

    <div
      v-if="!isGlobal && filteredApps.length === 0"
      class="mt-4 rounded-2xl border border-dashed border-edge-strong p-10 text-center"
    >
      <p class="font-semibold text-bright">No hay aplicaciones que coincidan.</p>
      <p class="mt-1 text-sm text-body">
        <span v-if="trimmedQuery">Búsqueda: “{{ trimmedQuery }}”</span>
        <span v-if="trimmedQuery && activeCategory !== 'all'"> · </span>
        <span v-if="activeCategory !== 'all'">Categoría: {{ activeCategoryLabel }}</span>
      </p>
      <button
        type="button"
        class="mt-4 rounded-xl bg-gradient-to-r from-accent to-[#0a5f63] px-4 py-2 font-semibold text-white shadow-lg"
        @click="clearFilters"
      >
        Limpiar filtros
      </button>
    </div>

    <Transition name="fade">
      <ul
        v-if="isListboxOpen"
        :id="listboxId"
        role="listbox"
        :aria-label="`Resultados para ${trimmedQuery}`"
        class="absolute inset-x-0 top-full z-30 mt-2 max-h-80 divide-y divide-edge overflow-y-auto rounded-2xl border border-edge-strong bg-surface shadow-xl"
      >
        <li
          v-for="(item, index) in globalResults"
          :id="`${listboxId}-option-${index}`"
          :key="item.id"
          role="option"
          :aria-selected="activeIndex === index"
        >
          <a
            :href="item.url"
            tabindex="-1"
            :class="[
              'flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-150 hover:bg-ink',
              activeIndex === index && 'bg-ink',
            ]"
          >
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ item.name }}</span>
              <span class="block truncate text-sm text-body">{{ item.description }}</span>
            </span>
            <span class="shrink-0 rounded-full border border-edge-strong px-2.5 py-0.5 text-xs text-body">
              {{ item.section }}
            </span>
          </a>
        </li>
        <li
          v-if="hasMoreResults"
          :id="`${listboxId}-option-${globalResults.length}`"
          role="option"
          :aria-selected="activeIndex === globalResults.length"
        >
          <a
            :href="catalogUrl"
            tabindex="-1"
            :class="[
              'block px-5 py-3 text-sm font-semibold text-accent transition-colors duration-150 hover:bg-ink',
              activeIndex === globalResults.length && 'bg-ink',
            ]"
          >
            Ver los {{ rankedItems.length }} resultados en Aplicaciones <span aria-hidden="true">→</span>
          </a>
        </li>
        <li v-if="globalResults.length === 0" role="presentation" class="px-5 py-4 text-center text-sm text-body">
          Sin resultados para “{{ trimmedQuery }}”.
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
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
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
