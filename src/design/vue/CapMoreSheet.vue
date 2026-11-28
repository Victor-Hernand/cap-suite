<script setup>
import CapSidebarChild from './CapSidebarChild.vue';
import { onBeforeUnmount, onMounted, ref, toRef } from 'vue';
import CapAvatar from './CapAvatar.vue';
import CapModuleSwitcherItem from './CapModuleSwitcherItem.vue';
import { useEscapeKey } from './composables/useEscapeKey.js';
import { useFocusTrap } from './composables/useFocusTrap.js';
import { iconClass, itemAriaLabel } from './helpers.js';
import { createDragToClose } from '../shell/js/sheet.js';
import { toggleTheme } from '../shell/js/theme.js';

const props = defineProps({
  open: { type: Boolean, default: false },
  menu: { type: Array, default: () => [] },
  modules: { type: Array, default: () => [] },
  user: { type: Object, required: true },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const emit = defineEmits(['close', 'logout']);

const sheetRef = ref(null);
const isOpen = toRef(props, 'open');

useFocusTrap(sheetRef, isOpen);
useEscapeKey(isOpen, () => emit('close'));

const drag = createDragToClose(() => props.open, () => emit('close'));

const closeAfterNavigation = (event) => {
  if (event.target.closest('a')) emit('close');
};

onMounted(() => document.addEventListener('pointerup', drag.end));
onBeforeUnmount(() => document.removeEventListener('pointerup', drag.end));
</script>

<template>
  <div
    id="cap-more-sheet"
    ref="sheetRef"
    class="cap-shell-sheet"
    role="dialog"
    aria-modal="true"
    aria-label="Menú completo"
    :data-open="String(open)"
  >
    <div class="cap-shell-sheet__backdrop" @click="emit('close')" />
    <div class="cap-shell-sheet__panel cap-glass" @click="closeAfterNavigation">
      <div class="cap-shell-sheet__handle" @pointerdown="drag.start" />
      <template v-if="modules.length">
        <p class="cap-shell-sidebar__group-label">Módulos</p>
        <nav class="cap-module-switcher__grid" aria-label="Módulos">
          <CapModuleSwitcherItem
            v-for="module in modules"
            :key="module.id"
            :module="module"
            :link-component="linkComponent"
            :link-prop="linkProp"
          />
        </nav>
      </template>
      <template v-for="group in menu" :key="group.label">
        <p class="cap-shell-sidebar__group-label">{{ group.label }}</p>
        <template v-for="item in group.items" :key="item.label">
          <component
            :is="linkComponent"
            class="cap-shell-sidebar__item"
            :[linkProp]="item.href ?? '#'"
            :aria-current="item.active ? 'page' : undefined"
            :aria-label="itemAriaLabel(item)"
          >
            <i class="cap-shell-sidebar__icon mdi" :class="iconClass(item)" aria-hidden="true" />{{ item.label }}<span
              v-if="item.count"
              class="cap-shell-sidebar__count"
              :class="{ 'cap-shell-sidebar__count--urgent': item.urgent }"
            >{{ item.count }}</span>
          </component>
          <div v-if="item.children?.length" class="cap-shell-sidebar__children">
            <CapSidebarChild v-for="child in item.children" :key="child.label" :child="child" :link-component="linkComponent" :link-prop="linkProp" />
          </div>
        </template>
      </template>
      <button class="cap-shell-sidebar__item" type="button" aria-label="Alternar modo oscuro" @click="toggleTheme">
        <i class="cap-shell-sidebar__icon mdi mdi-weather-night" aria-hidden="true" />Modo oscuro<span class="cap-shell-sidebar__switch" aria-hidden="true" />
      </button>
      <div class="cap-shell-sidebar__user">
        <CapAvatar :user="user" />
        <div class="cap-shell-sidebar__user-text">
          <strong class="cap-shell-sidebar__user-name">{{ user.name }}</strong>
          <small class="cap-shell-sidebar__user-mail">{{ user.email }}</small>
        </div>
        <button class="cap-shell-sidebar__user-menu" type="button" aria-label="Cerrar sesión" @click="emit('logout')">
          <i class="mdi mdi-logout" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
