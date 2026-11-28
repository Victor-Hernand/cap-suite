<script setup>
import CapModuleSwitcherItem from './CapModuleSwitcherItem.vue';

defineProps({
  modules: { type: Array, required: true },
  allHref: { type: String, default: '' },
  hidden: { type: Boolean, default: false },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const emit = defineEmits(['navigate']);

// Inertia and vue-router keep the layout mounted, so the panel must close itself after a link is followed.
const emitNavigateOnLink = (event) => {
  if (event.target.closest('a')) emit('navigate');
};
</script>

<template>
  <section id="cap-modules" class="cap-module-switcher cap-glass" aria-label="Cambiar de módulo" :hidden="hidden" @click="emitNavigateOnLink">
    <div class="cap-module-switcher__head">
      <span>Módulos</span>
      <component :is="linkComponent" v-if="allHref" class="cap-module-switcher__all" :[linkProp]="allHref">Ver todos</component>
    </div>
    <div class="cap-module-switcher__grid">
      <CapModuleSwitcherItem
        v-for="module in modules"
        :key="module.id"
        :module="module"
        :link-component="linkComponent"
        :link-prop="linkProp"
      />
    </div>
  </section>
</template>
