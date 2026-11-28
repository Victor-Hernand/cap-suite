<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'primary' },
  type: { type: String, default: 'button' },
  href: { type: String, default: '' },
  icon: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const elementAttributes = computed(() =>
  props.href
    ? { [props.linkProp]: props.href }
    : { type: props.type, disabled: props.disabled || props.loading, 'aria-busy': props.loading ? 'true' : undefined },
);
</script>

<template>
  <component :is="href ? linkComponent : 'button'" v-bind="elementAttributes" class="cap-button" :class="`cap-button--${variant}`">
    <i v-if="icon && !loading" class="mdi" :class="`mdi-${icon}`" aria-hidden="true" />
    <slot />
  </component>
</template>
