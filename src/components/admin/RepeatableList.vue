<script setup lang="ts" generic="Item extends { key: string }">
import CapButton from '../../design/vue/CapButton.vue';
import { iconButtonClass } from '../../lib/capClasses';

const items = defineModel<Item[]>('items', { required: true });

const props = withDefaults(
  defineProps<{
    addLabel: string;
    emptyText: string;
    createItem: () => Item;
    /** En false no se pintan subir/bajar: listas cuyo orden lo decide otro criterio. */
    reorderable?: boolean;
    /** Ícono del marcador de cada elemento; sin él, el marcador es su número. */
    markerIcon?: string;
  }>(),
  { reorderable: true, markerIcon: '' },
);

defineSlots<{ default(slotProps: { item: Item; index: number }): unknown }>();

const itemButtonClass = `${iconButtonClass} disabled:cursor-not-allowed disabled:opacity-50`;

function addItem() {
  items.value = [...items.value, props.createItem()];
}

function removeItem(index: number) {
  items.value = items.value.filter((_, position) => position !== index);
}

function moveItem(index: number, offset: -1 | 1) {
  const reordered = [...items.value];
  [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]];
  items.value = reordered;
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <p
      v-if="items.length === 0"
      class="rounded-cap-control border border-dashed border-cap-divider px-4 py-6 text-center text-sm text-cap-text-soft"
    >
      {{ props.emptyText }}
    </p>
    <ol v-else class="flex flex-col gap-3">
      <li v-for="(item, index) in items" :key="item.key" class="flex gap-3 rounded-cap-control bg-cap-card-2 p-3">
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cap-card text-xs font-medium tabular-nums text-cap-text-soft"
          aria-hidden="true"
        >
          <i v-if="props.markerIcon" class="mdi text-base leading-none" :class="`mdi-${props.markerIcon}`" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <div class="min-w-0 flex-1">
          <slot :item="item" :index="index" />
        </div>
        <div class="flex shrink-0 flex-col items-center gap-1">
          <template v-if="props.reorderable">
            <button
              type="button"
              :class="itemButtonClass"
              aria-label="Subir"
              title="Subir"
              :disabled="index === 0"
              @click="moveItem(index, -1)"
            >
              <i class="mdi mdi-arrow-up text-xl leading-none" aria-hidden="true" />
            </button>
            <button
              type="button"
              :class="itemButtonClass"
              aria-label="Bajar"
              title="Bajar"
              :disabled="index === items.length - 1"
              @click="moveItem(index, 1)"
            >
              <i class="mdi mdi-arrow-down text-xl leading-none" aria-hidden="true" />
            </button>
          </template>
          <button type="button" :class="itemButtonClass" aria-label="Quitar" title="Quitar" @click="removeItem(index)">
            <i class="mdi mdi-close text-xl leading-none" aria-hidden="true" />
          </button>
        </div>
      </li>
    </ol>
    <div>
      <CapButton variant="secondary" icon="plus" @click="addItem">{{ props.addLabel }}</CapButton>
    </div>
  </div>
</template>
