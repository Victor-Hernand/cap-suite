<script setup>
import { ref } from 'vue';
import { usePillNav } from './composables/usePillNav.js';

defineProps({
  sections: { type: Array, required: true },
  mobile: { type: Boolean, default: false },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const nav = ref(null);
usePillNav(nav);
</script>

<template>
  <nav ref="nav" class="cap-shell-header__nav" :class="{ 'cap-shell-header__nav--mobile cap-glass': mobile }" aria-label="Secciones" data-cap-pill-nav>
    <span class="cap-shell-header__nav-pill" aria-hidden="true" data-cap-pill />
    <component
      :is="linkComponent"
      v-for="section in sections"
      :key="section.label"
      class="cap-shell-header__nav-item"
      :[linkProp]="section.href"
      :aria-current="section.active ? 'page' : undefined"
    >{{ section.label }}</component>
  </nav>
</template>
