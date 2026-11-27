<script setup lang="ts">
import { emptyStateBaseClass, emptyStateDashedClass, emptyStateTitleClass } from '../lib/capClasses';

const props = withDefaults(
  defineProps<{ icon?: string; title: string; detail?: string; filtered?: boolean; compact?: boolean }>(),
  { icon: 'inbox-outline', detail: '', filtered: false, compact: false },
);
</script>

<template>
  <div :class="[emptyStateBaseClass, props.filtered ? '' : emptyStateDashedClass, props.compact ? 'py-6' : 'py-12']">
    <i class="mdi text-cap-icon text-gray-400" :class="`mdi-${props.icon}`" aria-hidden="true" />
    <p :class="emptyStateTitleClass">{{ props.title }}</p>
    <p v-if="props.detail" class="mt-1 text-sm text-cap-text-soft">{{ props.detail }}</p>
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>
