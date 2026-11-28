<script setup>
import { computed } from 'vue';

const props = defineProps({
  buttonClass: { type: String, required: true },
  expanded: { type: Boolean, default: false },
  unreadCount: { type: Number, default: 0 },
});

const label = computed(() =>
  props.unreadCount ? `Notificaciones, ${props.unreadCount} sin leer` : 'Notificaciones',
);
</script>

<template>
  <button
    :class="buttonClass"
    type="button"
    :aria-label="label"
    :aria-expanded="String(expanded)"
    aria-controls="cap-notifications"
  >
    <i class="mdi mdi-bell-outline" aria-hidden="true" />
    <span v-if="unreadCount" class="cap-shell-header__badge-dot" aria-hidden="true" />
  </button>
</template>
