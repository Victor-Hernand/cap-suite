<script setup lang="ts">
import { iconButtonClass } from '../../lib/capClasses';

const page = defineModel<number>('page', { required: true });

const props = defineProps<{
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
}>();

const disabledClass = 'disabled:cursor-not-allowed disabled:opacity-50';
</script>

<template>
  <nav aria-label="Paginación" class="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-cap-text-soft">
    <p class="tabular-nums">{{ props.rangeStart }}–{{ props.rangeEnd }} de {{ props.total }}</p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        aria-label="Página anterior"
        title="Página anterior"
        :class="[iconButtonClass, disabledClass]"
        :disabled="page === 1"
        @click="page -= 1"
      >
        <i class="mdi mdi-chevron-left text-xl leading-none" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Página siguiente"
        title="Página siguiente"
        :class="[iconButtonClass, disabledClass]"
        :disabled="page === props.pageCount"
        @click="page += 1"
      >
        <i class="mdi mdi-chevron-right text-xl leading-none" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>
