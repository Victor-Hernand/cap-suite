<script setup lang="ts" generic="Item extends { key: string }">
const items = defineModel<Item[]>('items', { required: true });

const props = withDefaults(
  defineProps<{
    addLabel: string;
    emptyText: string;
    createItem: () => Item;
    /** En false no se pintan subir/bajar: listas cuyo orden lo decide otro criterio. */
    reorderable?: boolean;
  }>(),
  { reorderable: true },
);

defineSlots<{ default(slotProps: { item: Item; index: number }): unknown }>();

const itemButtonClass = 'px-1 text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30';

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
  <div>
    <p v-if="items.length === 0" class="rounded-lg border border-dashed border-edge px-4 py-6 text-center text-sm text-muted">
      {{ props.emptyText }}
    </p>
    <ol v-else class="flex flex-col gap-3">
      <li
        v-for="(item, index) in items"
        :key="item.key"
        class="flex gap-3 rounded-lg border border-edge bg-canvas p-3"
      >
        <span class="pt-1 font-mono text-[10px] text-muted">{{ index + 1 }}</span>
        <div class="min-w-0 flex-1">
          <slot :item="item" :index="index" />
        </div>
        <div class="flex shrink-0 flex-col items-center gap-1">
          <template v-if="props.reorderable">
            <button type="button" :class="itemButtonClass" aria-label="Subir" :disabled="index === 0" @click="moveItem(index, -1)">↑</button>
            <button
              type="button"
              :class="itemButtonClass"
              aria-label="Bajar"
              :disabled="index === items.length - 1"
              @click="moveItem(index, 1)"
            >↓</button>
          </template>
          <button type="button" class="px-1 text-red-700" aria-label="Quitar" @click="removeItem(index)">✕</button>
        </div>
      </li>
    </ol>
    <button type="button" class="mt-3 text-sm font-semibold text-ink hover:underline" @click="addItem">
      + {{ props.addLabel }}
    </button>
  </div>
</template>
