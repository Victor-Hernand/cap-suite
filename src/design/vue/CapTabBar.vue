<script setup>
import { iconClass } from './helpers.js';

defineProps({
  tabs: { type: Array, default: () => [] },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
  moreOpen: { type: Boolean, default: false },
});

const emit = defineEmits(['more']);
</script>

<template>
  <nav class="cap-shell-tabbar cap-glass" aria-label="Destinos principales">
    <component
      :is="linkComponent"
      v-for="tab in tabs"
      :key="tab.label"
      class="cap-shell-tabbar__tab"
      :[linkProp]="tab.href"
      :aria-current="tab.active ? 'page' : undefined"
    >
      <i class="mdi" :class="iconClass(tab)" aria-hidden="true" />{{ tab.label }}
    </component>
    <button
      class="cap-shell-tabbar__tab cap-shell-tabbar__tab--more"
      type="button"
      :aria-expanded="String(moreOpen)"
      aria-controls="cap-more-sheet"
      @click="emit('more')"
    >
      <i class="mdi mdi-dots-horizontal" aria-hidden="true" />Más
    </button>
  </nav>
</template>
