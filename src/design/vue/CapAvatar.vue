<script setup>
import { computed } from 'vue';
import { initialsOf } from './helpers.js';

const props = defineProps({
  user: { type: Object, required: true },
});

const initials = computed(() => initialsOf(props.user.name));
</script>

<template>
  <span class="cap-shell-avatar" aria-hidden="true">
    <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="">
    <template v-else>{{ initials }}</template>
  </span>
</template>
