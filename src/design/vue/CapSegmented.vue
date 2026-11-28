<script setup>
import { ref } from 'vue';
import { usePillNav } from './composables/usePillNav.js';

const props = defineProps({
  items: { type: Array, required: true },
  modelValue: { type: [String, Number], default: null },
  label: { type: String, default: 'Filtrar' },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const emit = defineEmits(['update:modelValue']);

const root = ref(null);
usePillNav(root, { manageSelection: false });

const isActive = (item) => item.value === props.modelValue;
</script>

<template>
  <div ref="root" class="cap-segmented" role="group" :aria-label="label" data-cap-pill-nav>
    <span class="cap-segmented__pill" aria-hidden="true" data-cap-pill />
    <template v-for="item in items" :key="item.value ?? item.label">
      <component
        :is="linkComponent"
        v-if="item.href"
        class="cap-segmented__item"
        :[linkProp]="item.href"
        :aria-current="isActive(item) ? 'page' : undefined"
      >{{ item.label }}<span v-if="item.count != null" class="cap-segmented__count">{{ item.count }}</span></component>
      <button
        v-else
        class="cap-segmented__item"
        type="button"
        :value="item.value"
        :aria-pressed="isActive(item) ? 'true' : 'false'"
        @click="emit('update:modelValue', item.value)"
      >{{ item.label }}<span v-if="item.count != null" class="cap-segmented__count">{{ item.count }}</span></button>
    </template>
  </div>
</template>
