<script setup>
import { computed } from 'vue';

const DEFAULT_ICONS = {
  error: 'alert-circle-outline',
  ok: 'check-circle-outline',
  warning: 'alert-outline',
  info: 'information-outline',
};

const props = defineProps({
  status: { type: String, required: true },
  title: { type: String, required: true },
  detail: { type: String, default: '' },
  icon: { type: String, default: '' },
});

const role = computed(() => (props.status === 'error' ? 'alert' : 'status'));
</script>

<template>
  <div class="cap-alert" :class="`cap-alert--${status}`" :role="role">
    <i class="cap-alert__icon mdi" :class="`mdi-${icon || DEFAULT_ICONS[status]}`" aria-hidden="true" />
    <div><strong class="cap-alert__title">{{ title }}</strong><span v-if="detail" class="cap-alert__detail">{{ detail }}</span></div>
  </div>
</template>
