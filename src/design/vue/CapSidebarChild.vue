<script setup>
defineProps({
  child: { type: Object, required: true },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});
</script>

<template>
  <component
    :is="linkComponent"
    class="cap-shell-sidebar__child"
    :[linkProp]="child.href"
    :aria-current="child.active ? 'page' : undefined"
  >
    <span
      v-if="child.swatch"
      class="cap-shell-sidebar__child-swatch"
      :style="{ background: `var(--cap-${child.swatch})` }"
    />{{ child.label }}
  </component>
</template>
