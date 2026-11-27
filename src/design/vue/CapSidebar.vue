<script setup>
import { useTemplateRef } from 'vue';
import CapAvatar from './CapAvatar.vue';
import CapSidebarItem from './CapSidebarItem.vue';
import { useSidebarCollapse } from './composables/useSidebarCollapse.js';
import { toggleTheme } from '../shell/js/theme.js';
import { company } from '../company.js';

defineProps({
  systemName: { type: String, required: true },
  owner: { type: String, default: company.name },
  mark: { type: String, default: company.mark },
  menu: { type: Array, required: true },
  user: { type: Object, required: true },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const emit = defineEmits(['logout']);

const { collapsed, toggle } = useSidebarCollapse(useTemplateRef('sidebar'));
</script>

<template>
  <aside ref="sidebar" class="cap-shell-sidebar cap-glass" :data-collapsed="String(collapsed)">
    <button
      class="cap-shell-sidebar__collapse"
      type="button"
      data-cap-collapse
      :aria-expanded="String(!collapsed)"
      :aria-label="collapsed ? 'Expandir menú' : 'Contraer menú'"
      @click="toggle"
    >
      <i class="mdi mdi-chevron-left" aria-hidden="true" />
    </button>

    <div class="cap-shell-sidebar__brand">
      <span class="cap-shell-logo" aria-hidden="true">{{ mark }}</span>
      <div class="cap-shell-sidebar__brand-text">
        <strong class="cap-shell-sidebar__brand-name">{{ systemName }}</strong>
        <small class="cap-shell-sidebar__brand-owner">{{ owner }}</small>
      </div>
    </div>

    <nav class="cap-shell-sidebar__nav" aria-label="Menú principal">
      <template v-for="group in menu" :key="group.label">
        <p class="cap-shell-sidebar__group-label">{{ group.label }}</p>
        <CapSidebarItem v-for="item in group.items" :key="item.label" :item="item" :link-component="linkComponent" :link-prop="linkProp" />
      </template>
    </nav>

    <div class="cap-shell-sidebar__spacer" />

    <button class="cap-shell-sidebar__item cap-shell-sidebar__theme" type="button" aria-label="Alternar modo oscuro" @click="toggleTheme">
      <i class="cap-shell-sidebar__icon mdi mdi-weather-night" aria-hidden="true" />
      <span class="cap-shell-sidebar__label">Modo oscuro</span>
      <span class="cap-shell-sidebar__switch" aria-hidden="true" />
      <span class="cap-shell-sidebar__tooltip" aria-hidden="true">Modo oscuro</span>
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
  </aside>
</template>
