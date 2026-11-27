<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { SearchItem } from '../data/types';
import { filterSearchItems } from '../lib/filterSearchItems';
import SearchResultsList from './SearchResultsList.vue';

const props = withDefaults(defineProps<{ items?: SearchItem[] }>(), { items: () => [] });

const desktopListboxId = 'cap-global-search-listbox';
const mobileListboxId = 'cap-global-search-mobile-listbox';

const query = ref('');
const isOpen = ref(false);
const isMobileOpen = ref(false);
const activeIndex = ref(0);
const container = ref<HTMLElement | null>(null);
const mobilePanel = ref<HTMLElement | null>(null);
const mobileInput = ref<HTMLInputElement | null>(null);

const results = computed(() => filterSearchItems(props.items, query.value));
const activeItem = computed(() => results.value[activeIndex.value]);

function optionId(listboxId: string): string | undefined {
  return isOpen.value && activeItem.value ? `${listboxId}-option-${activeIndex.value}` : undefined;
}

watch(results, () => {
  activeIndex.value = 0;
});

function openResults() {
  isOpen.value = true;
}

function closeResults() {
  isOpen.value = false;
}

function closeMobile() {
  isMobileOpen.value = false;
  closeResults();
  query.value = '';
}

function openItem(item: SearchItem) {
  if (item.url.startsWith('http')) {
    window.open(item.url, '_blank', 'noopener');
  } else {
    window.location.assign(item.url);
  }
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    openResults();
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (event.key === 'Enter' && isOpen.value && activeItem.value) {
    event.preventDefault();
    openItem(activeItem.value);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    if (isMobileOpen.value) closeMobile();
    else closeResults();
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node;
  if (container.value?.contains(target) || mobilePanel.value?.contains(target)) return;
  if (isMobileOpen.value) closeMobile();
  else closeResults();
}

async function onDocumentClick(event: MouseEvent) {
  if (!(event.target instanceof Element) || !event.target.closest('[data-cap-search-open]')) return;
  event.preventDefault();
  isMobileOpen.value = true;
  openResults();
  await Promise.resolve();
  mobileInput.value?.focus();
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  document.removeEventListener('click', onDocumentClick);
});
</script>

<template>
  <div ref="container" class="relative flex flex-1">
    <label class="cap-shell-header__search">
      <i class="mdi mdi-magnify" aria-hidden="true"></i>
      <input
        id="cap-global-search"
        v-model="query"
        class="cap-shell-header__search-input"
        type="search"
        role="combobox"
        placeholder="Buscar sistemas, documentos, personas…"
        aria-label="Buscar sistemas, documentos, personas"
        aria-autocomplete="list"
        autocomplete="off"
        :aria-expanded="isOpen"
        :aria-controls="desktopListboxId"
        :aria-activedescendant="optionId(desktopListboxId)"
        data-cap-search
        @input="openResults"
        @keydown="onInputKeydown"
      />
      <kbd class="cap-shell-header__kbd">⌘K</kbd>
    </label>
    <div
      v-show="isOpen && !isMobileOpen"
      class="absolute left-6 top-full z-cap-dropdown mt-2 w-[32rem] max-w-full overflow-hidden rounded-cap-control border border-cap-divider bg-cap-card shadow-md dark:bg-cap-card-2"
    >
      <SearchResultsList
        :listbox-id="desktopListboxId"
        :results="results"
        :active-index="activeIndex"
        :query="query"
        @hover="activeIndex = $event"
        @select="closeResults"
      />
    </div>
  </div>

  <Teleport to="body">
    <div v-if="isMobileOpen" ref="mobilePanel" class="fixed inset-x-0 top-0 z-cap-modal p-3 lg:hidden">
      <div class="overflow-hidden rounded-cap-control border border-cap-divider bg-cap-card shadow-md dark:bg-cap-card-2">
        <div class="flex items-center gap-2 border-b border-cap-divider px-3">
          <i class="mdi mdi-magnify text-lg text-cap-text-soft" aria-hidden="true"></i>
          <input
            ref="mobileInput"
            v-model="query"
            class="min-w-0 flex-1 bg-transparent py-3 text-base text-gray-900 outline-none dark:text-gray-100"
            type="search"
            role="combobox"
            placeholder="Buscar sistemas, documentos, personas…"
            aria-label="Buscar sistemas, documentos, personas"
            aria-autocomplete="list"
            autocomplete="off"
            :aria-expanded="isOpen"
            :aria-controls="mobileListboxId"
            :aria-activedescendant="optionId(mobileListboxId)"
            @input="openResults"
            @keydown="onInputKeydown"
          />
          <button type="button" class="cap-shell-topbar__icon-button" aria-label="Cerrar búsqueda" @click="closeMobile">
            <i class="mdi mdi-close" aria-hidden="true"></i>
          </button>
        </div>
        <SearchResultsList
          :listbox-id="mobileListboxId"
          :results="results"
          :active-index="activeIndex"
          :query="query"
          @hover="activeIndex = $event"
          @select="closeMobile"
        />
      </div>
    </div>
  </Teleport>
</template>
