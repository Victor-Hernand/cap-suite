<script setup>
import { iconClass } from './helpers.js';

defineProps({
  module: { type: Object, required: true },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});
</script>

<template>
  <component
    :is="linkComponent"
    class="cap-module-switcher__item"
    :[linkProp]="module.href"
    :aria-current="module.current ? 'true' : undefined"
  ><span class="cap-module-tile"><i class="mdi" :class="iconClass(module)" aria-hidden="true" /></span>{{ module.name }}</component>
</template>
