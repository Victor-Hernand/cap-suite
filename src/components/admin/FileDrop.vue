<script setup lang="ts">
import { ref } from 'vue';
import { labelClass } from './formStyles';

const props = defineProps<{
  name: string;
  label: string;
  hint: string;
  accept: string;
  /** Aclaración bajo el selector, p. ej. qué pasa si no se sube nada. */
  note?: string;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const fileName = ref('');

function openPicker() {
  inputRef.value?.click();
}

function onPicked() {
  fileName.value = inputRef.value?.files?.[0]?.name ?? '';
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (!file || !inputRef.value) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  inputRef.value.files = transfer.files;
  fileName.value = file.name;
}
</script>

<template>
  <div>
    <p :class="labelClass">{{ props.label }}</p>
    <div
      class="cursor-pointer rounded-lg border border-dashed p-4 text-center text-xs transition-colors"
      :class="dragging ? 'border-ink bg-white' : 'border-edge-strong bg-base text-muted'"
      role="button"
      tabindex="0"
      @click="openPicker"
      @keydown.enter="openPicker"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <template v-if="fileName">
        <span class="font-semibold text-ink">{{ fileName }}</span>
      </template>
      <template v-else>
        Arrastra un archivo o <span class="font-bold text-ink">explora</span> · {{ props.hint }}
      </template>
    </div>
    <p v-if="props.note" class="mt-1 text-xs text-muted">{{ props.note }}</p>
    <input ref="inputRef" type="file" :name="props.name" :accept="props.accept" class="hidden" @change="onPicked" />
  </div>
</template>
