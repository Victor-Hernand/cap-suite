<script setup>
import CapSidebarChild from './CapSidebarChild.vue';
import { computed } from 'vue';
import { iconClass, itemAriaLabel } from './helpers.js';

const props = defineProps({
  item: { type: Object, required: true },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const hasChildren = computed(() => Boolean(props.item.children?.length));
const ariaLabel = computed(() => itemAriaLabel(props.item));
const currentPage = computed(() => (props.item.active ? 'page' : undefined));
</script>

<template>
  <details v-if="hasChildren" class="cap-shell-sidebar__branch" open>
    <summary class="cap-shell-sidebar__item" :aria-label="ariaLabel">
      <i class="cap-shell-sidebar__icon mdi" :class="iconClass(item)" aria-hidden="true" />
      <span class="cap-shell-sidebar__label">{{ item.label }}</span>
      <i class="cap-shell-sidebar__chevron mdi mdi-chevron-down" aria-hidden="true" />
      <span class="cap-shell-sidebar__tooltip" aria-hidden="true">{{ item.label }}</span>
    </summary>
    <div class="cap-shell-sidebar__children">
      <CapSidebarChild v-for="child in item.children" :key="child.label" :child="child" :link-component="linkComponent" :link-prop="linkProp" />
    </div>
  </details>
  <component
    :is="linkComponent"
    v-else
    class="cap-shell-sidebar__item"
    :[linkProp]="item.href"
    :aria-current="currentPage"
    :aria-label="ariaLabel"
  >
    <i class="cap-shell-sidebar__icon mdi" :class="iconClass(item)" aria-hidden="true" />
    <span class="cap-shell-sidebar__label">{{ item.label }}</span>
    <template v-if="item.count">
      <span class="cap-shell-sidebar__count" :class="{ 'cap-shell-sidebar__count--urgent': item.urgent }">{{ item.count }}</span>
      <span class="cap-shell-sidebar__dot" aria-hidden="true" />
    </template>
    <span class="cap-shell-sidebar__tooltip" aria-hidden="true">{{ item.label }}</span>
  </component>
</template>
