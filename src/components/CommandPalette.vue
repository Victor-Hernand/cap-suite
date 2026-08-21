<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { SearchItem } from '../data/types';

const props = defineProps<{ items: SearchItem[] }>();

const open = ref(false);
const query = ref('');
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const results = computed(() => {
  const text = query.value.trim().toLowerCase();
  if (!text) return props.items.slice(0, 8);
  return props.items
    .filter((item) => `${item.name} ${item.description} ${item.section}`.toLowerCase().includes(text))
    .slice(0, 8);
});

watch(results, () => {
  activeIndex.value = 0;
});

watch(open, async (isOpen) => {
  if (isOpen) {
    query.value = '';
    await Promise.resolve();
    inputRef.value?.focus();
  }
});

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    open.value = !open.value;
  }
  if (event.key === 'Escape') open.value = false;
}

function openPalette() {
  open.value = true;
}

function go(item: SearchItem) {
  open.value = false;
  if (item.url.startsWith('http') || item.url.startsWith('mailto:')) {
    window.open(item.url, '_blank', 'noopener');
    return;
  }
  window.location.href = item.url;
}

function onListKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (event.key === 'Enter' && results.value[activeIndex.value]) {
    go(results.value[activeIndex.value]);
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown);
  window.addEventListener('open-command-palette', openPalette);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown);
  window.removeEventListener('open-command-palette', openPalette);
});
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-edge-strong"
    @click="open = true"
  >
    Buscar
    <span class="rounded border border-edge bg-base px-1.5 py-0.5 font-mono text-[10px]">⌘K</span>
  </button>

  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[15vh] backdrop-blur-sm"
      @click.self="open = false"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-xl border border-edge bg-surface shadow-2xl" role="dialog" aria-label="Buscar en la suite">
        <input
          ref="inputRef"
          v-model="query"
          type="search"
          placeholder="Buscar sistemas, documentos, personas…"
          class="w-full border-b border-edge px-4 py-3 text-sm outline-none"
          @keydown="onListKeydown"
        />
        <ul v-if="results.length" class="max-h-80 overflow-y-auto py-1">
          <li v-for="(item, index) in results" :key="item.id">
            <button
              type="button"
              class="flex w-full items-baseline justify-between px-4 py-2.5 text-left text-sm"
              :class="index === activeIndex ? 'bg-base' : ''"
              @mouseenter="activeIndex = index"
              @click="go(item)"
            >
              <span>
                <span class="font-semibold text-ink">{{ item.name }}</span>
                <span class="ml-2 text-xs text-muted">{{ item.description }}</span>
              </span>
              <span class="ml-3 shrink-0 font-mono text-[9px] uppercase tracking-widest text-muted">{{ item.section }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="px-4 py-8 text-center text-sm text-muted">Sin resultados para "{{ query }}".</p>
      </div>
    </div>
  </Teleport>
</template>
