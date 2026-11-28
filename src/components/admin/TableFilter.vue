<script setup lang="ts">
import { fieldInputClass } from '../../lib/capClasses';

const filterText = defineModel<string>({ required: true });

const props = defineProps<{ label: string }>();
</script>

<template>
  <div class="relative w-full sm:w-64">
    <i
      class="mdi mdi-magnify pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl leading-none text-cap-text-soft"
      aria-hidden="true"
    />
    <input v-model="filterText" type="search" placeholder="Filtrar…" :aria-label="props.label" :class="[fieldInputClass, 'pl-10']" />
  </div>
</template>
