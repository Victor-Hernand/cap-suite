<script setup lang="ts">
import { emptyStateClass } from '../../lib/capClasses';

const props = withDefaults(
  defineProps<{ icon?: string; title: string; detail?: string; filtered?: boolean; compact?: boolean }>(),
  { icon: 'inbox-outline', detail: '', filtered: false, compact: false },
);

// «Sin resultados» es el mismo bloque sin el borde punteado; compacto, para listas dentro de una tarjeta.
const variantClass = props.filtered ? emptyStateClass.replace('border border-dashed border-cap-divider ', '') : emptyStateClass;
const containerClass = props.compact ? variantClass.replace('py-12', 'py-6') : variantClass;
</script>

<template>
  <div :class="containerClass">
    <i class="mdi text-cap-icon text-gray-400" :class="`mdi-${props.icon}`" aria-hidden="true" />
    <p class="mt-3 font-display text-base font-semibold text-gray-900 dark:text-gray-100">{{ props.title }}</p>
    <p v-if="props.detail" class="mt-1 text-sm text-cap-text-soft">{{ props.detail }}</p>
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>
