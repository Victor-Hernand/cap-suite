<script setup>
import { computed, reactive, watch } from 'vue';
import CapModuleCard from './CapModuleCard.vue';
import { groupBy } from './helpers.js';

const props = defineProps({
  modules: { type: Array, required: true },
  groupCountLabel: { type: Function, default: (count) => (count === 1 ? '1 módulo' : `${count} módulos`) },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const emit = defineEmits(['pin', 'request']);

const pinnedIds = reactive(new Set());

const syncPinnedIds = (modules) => {
  pinnedIds.clear();
  for (const module of modules) if (module.pinned) pinnedIds.add(module.id);
};

watch(() => props.modules, syncPinnedIds, { immediate: true });

const groups = computed(() =>
  [...groupBy(props.modules, (module) => module.group ?? '')].map(([label, modules], index) => ({
    label,
    modules,
    id: `cap-module-group-${index}`,
  })),
);

const onPin = (module) => {
  const pinned = !pinnedIds.has(module.id);
  if (pinned) pinnedIds.add(module.id);
  else pinnedIds.delete(module.id);
  emit('pin', { id: module.id, pinned });
};
</script>

<template>
  <section v-for="group in groups" :key="group.label" class="cap-module-group" :aria-labelledby="group.id">
    <div class="cap-module-group__head">
      <h3 :id="group.id" class="cap-module-group__title">{{ group.label }}</h3>
      <span class="cap-module-group__count">{{ groupCountLabel(group.modules.length) }}</span>
    </div>
    <div class="cap-module-grid">
      <CapModuleCard
        v-for="module in group.modules"
        :key="module.id"
        :module="module"
        :pinned="pinnedIds.has(module.id)"
        :link-component="linkComponent"
        :link-prop="linkProp"
        @pin="onPin(module)"
        @request="emit('request', { id: module.id })"
      />
    </div>
  </section>
</template>
