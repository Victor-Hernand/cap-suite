<script setup lang="ts">
import { usePopover } from '../../design/vue/composables/usePopover.js';
import { iconButtonClass } from '../../lib/capClasses';
import type { RowAction } from './types';

const props = defineProps<{
  /** Id único en la página: lo usa el popover para saber qué clics caen dentro del menú. */
  menuId: string;
  recordLabel: string;
  actions: RowAction[];
}>();

const emit = defineEmits<{ select: [key: string] }>();

const { isOpen, toggle, close } = usePopover(props.menuId);

const itemClass =
  'flex h-10 w-full items-center gap-2 px-3 text-sm transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2 dark:hover:bg-cap-card';
const neutralItemClass = `${itemClass} text-gray-800 dark:text-gray-100`;
const dangerItemClass = `${itemClass} text-cap-status-error-ink`;

function choose(action: RowAction) {
  close();
  emit('select', action.key);
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      :aria-label="`Acciones de ${props.recordLabel}`"
      title="Acciones"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-controls="props.menuId"
      :class="iconButtonClass"
      @click="toggle"
    >
      <i class="mdi mdi-dots-vertical text-xl leading-none" aria-hidden="true" />
    </button>
    <Transition
      enter-active-class="transition duration-cap-fast ease-cap-enter"
      enter-from-class="opacity-0 scale-[0.98]"
      leave-active-class="transition duration-cap-fast ease-cap-exit"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        :id="props.menuId"
        role="menu"
        class="absolute right-0 top-full z-cap-dropdown mt-1 w-48 origin-top rounded-cap-control border border-cap-divider bg-cap-card py-1 shadow-md dark:bg-cap-card-2"
      >
        <template v-for="action in props.actions" :key="action.key">
          <a
            v-if="action.href"
            role="menuitem"
            :href="action.href"
            :class="action.danger ? dangerItemClass : neutralItemClass"
          >
            <i class="mdi text-xl leading-none" :class="`mdi-${action.icon}`" aria-hidden="true" />{{ action.label }}
          </a>
          <button
            v-else
            role="menuitem"
            type="button"
            :class="action.danger ? dangerItemClass : neutralItemClass"
            @click="choose(action)"
          >
            <i class="mdi text-xl leading-none" :class="`mdi-${action.icon}`" aria-hidden="true" />{{ action.label }}
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>
