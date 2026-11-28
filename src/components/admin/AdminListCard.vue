<script setup lang="ts">
import { brandTileClass, cardCompactClass } from '../../lib/capClasses';

const props = withDefaults(defineProps<{ icon: string; title: string; subtitle?: string; href?: string }>(), {
  subtitle: '',
  href: '',
});
</script>

<template>
  <article :class="['flex min-h-16 items-center gap-3', cardCompactClass]">
    <span :class="brandTileClass" aria-hidden="true">
      <i class="mdi text-xl leading-none" :class="`mdi-${props.icon}`" />
    </span>
    <span class="min-w-0 flex-1">
      <a
        v-if="props.href"
        :href="props.href"
        class="block truncate text-sm font-semibold text-cap-brand hover:underline dark:text-cap-brand-soft"
        :title="props.title"
      >{{ props.title }}</a>
      <span v-else class="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100" :title="props.title">{{ props.title }}</span>
      <span v-if="props.subtitle" class="block truncate text-xs text-cap-text-soft" :title="props.subtitle">{{ props.subtitle }}</span>
    </span>
    <span class="flex shrink-0 items-center gap-2"><slot /></span>
  </article>
</template>
