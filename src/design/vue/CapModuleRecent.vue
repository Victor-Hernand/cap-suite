<script setup>
import { iconClass } from './helpers.js';

defineProps({
  items: { type: Array, required: true },
  label: { type: String, default: 'Continuar' },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});
</script>

<template>
  <nav v-if="items.length" class="cap-module-recent" aria-label="Continuar donde quedaste">
    <span class="cap-module-recent__label">{{ label }}</span>
    <component :is="linkComponent" v-for="item in items" :key="item.href" class="cap-module-recent__link" :[linkProp]="item.href">
      <i class="mdi" :class="iconClass(item)" aria-hidden="true" />{{ item.module }} <small>› {{ item.label }}</small>
    </component>
  </nav>
</template>
