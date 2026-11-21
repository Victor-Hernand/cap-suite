<script setup lang="ts">
const props = withDefaults(defineProps<{ pending?: boolean }>(), { pending: false });

const emit = defineEmits<{ request: []; confirm: [] }>();
</script>

<template>
  <button v-if="!props.pending" type="button" class="ml-2 text-red-700" aria-label="Eliminar" @click="emit('request')">✕</button>
  <button
    v-else
    type="button"
    class="ml-2 rounded bg-red-700 px-2 py-0.5 text-xs font-bold text-white"
    @click="emit('confirm')"
  >¿Eliminar?</button>
</template>
