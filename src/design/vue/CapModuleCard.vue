<script setup>
import { computed } from 'vue';
import { iconClass, isLockedModule } from './helpers.js';

const props = defineProps({
  module: { type: Object, required: true },
  pinned: { type: Boolean, default: false },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const emit = defineEmits(['pin', 'request']);

const isLocked = computed(() => isLockedModule(props.module));

// The card names itself after its title so the star's label stays out of the link's name.
const nameId = computed(() => `cap-module-${props.module.id}-name`);

// The CSS paints `brand` as the attribute-less default, so it never reaches data-status.
const countStatus = (pending) => (pending.status && pending.status !== 'brand' ? pending.status : undefined);
</script>

<template>
  <div v-if="isLocked" class="cap-module-card cap-module-card--locked" role="group" :aria-label="`${module.name}, sin acceso`">
    <div class="cap-module-card__top">
      <span class="cap-module-tile"><i class="mdi mdi-lock-outline" aria-hidden="true" /></span>
    </div>
    <div>
      <h4 class="cap-module-card__name">{{ module.name }}</h4>
      <p class="cap-module-card__desc" :title="module.description">{{ module.description }}</p>
    </div>
    <div class="cap-module-card__foot">
      <span>Sin acceso</span>
      <component :is="linkComponent" v-if="module.requestHref" class="cap-module-card__request" :[linkProp]="module.requestHref">Solicitar acceso</component>
      <button v-else class="cap-module-card__request" type="button" @click="emit('request')">Solicitar acceso</button>
    </div>
  </div>
  <component
    :is="linkComponent"
    v-else
    class="cap-module-card"
    :class="{ 'cap-module-card--featured': module.featured }"
    :[linkProp]="module.href"
    :aria-labelledby="nameId"
  >
    <div class="cap-module-card__top">
      <span class="cap-module-tile"><i class="mdi" :class="iconClass(module)" aria-hidden="true" /></span>
      <button
        class="cap-module-card__pin"
        type="button"
        :aria-label="`Fijar ${module.name}`"
        :aria-pressed="String(pinned)"
        @click.prevent.stop="emit('pin')"
      >
        <i class="mdi" :class="pinned ? 'mdi-star' : 'mdi-star-outline'" aria-hidden="true" />
      </button>
    </div>
    <div>
      <h4 :id="nameId" class="cap-module-card__name">{{ module.name }}</h4>
      <p class="cap-module-card__desc" :title="module.description">{{ module.description }}</p>
    </div>
    <div class="cap-module-card__foot">
      <span v-if="module.pending" class="cap-module-card__count" :data-status="countStatus(module.pending)">{{ module.pending.label }}</span>
      <span v-if="module.lastUsed">{{ module.lastUsed }}</span>
      <i class="cap-module-card__arrow mdi mdi-arrow-right" aria-hidden="true" />
    </div>
  </component>
</template>
