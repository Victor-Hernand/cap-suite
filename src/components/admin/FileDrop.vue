<script setup lang="ts">
import { ref } from 'vue';
import { fieldErrorClass, fieldHelpClass, fieldLabelClass } from '../../lib/capClasses';

const props = withDefaults(
  defineProps<{
    name: string;
    label: string;
    hint: string;
    accept: string;
    /** Aclaración bajo el selector, p. ej. qué pasa si no se sube nada. */
    note?: string;
    error?: string;
  }>(),
  { note: '', error: '' },
);

const emit = defineEmits<{ change: [file: File | null] }>();

const inputRef = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const fileName = ref('');

function openPicker() {
  inputRef.value?.click();
}

function onPicked() {
  const file = inputRef.value?.files?.[0] ?? null;
  fileName.value = file?.name ?? '';
  emit('change', file);
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (!file || !inputRef.value) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  inputRef.value.files = transfer.files;
  fileName.value = file.name;
  emit('change', file);
}
</script>

<template>
  <div>
    <p :class="fieldLabelClass">{{ props.label }}</p>
    <div
      class="flex cursor-pointer items-center gap-3 rounded-cap-control border border-dashed px-4 py-3 text-sm transition-colors duration-cap-fast ease-cap focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-chrome focus-visible:ring-offset-2 focus-visible:ring-offset-cap-card dark:focus-visible:ring-gray-100"
      :class="[
        dragging ? 'border-cap-chrome bg-cap-card dark:border-gray-100' : 'bg-cap-card-2',
        !dragging && (props.error ? 'border-cap-status-error dark:border-cap-status-dark-error' : 'border-cap-input-line'),
      ]"
      role="button"
      tabindex="0"
      :aria-label="`${props.label}: ${fileName || `elegir archivo (${props.hint})`}`"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <i
        class="mdi text-xl leading-none text-cap-text-soft"
        :class="fileName ? 'mdi-file-check-outline' : 'mdi-tray-arrow-up'"
        aria-hidden="true"
      />
      <span v-if="fileName" class="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100">{{ fileName }}</span>
      <span v-else class="min-w-0 text-cap-text-soft">
        Arrastra un archivo o <span class="font-semibold text-gray-900 underline underline-offset-2 dark:text-gray-100">explora</span>
        · {{ props.hint }}
      </span>
    </div>
    <p v-if="props.note" :class="fieldHelpClass">{{ props.note }}</p>
    <p v-if="props.error" :class="fieldErrorClass">{{ props.error }}</p>
    <input ref="inputRef" type="file" :name="props.name" :accept="props.accept" class="hidden" @change="onPicked" />
  </div>
</template>
