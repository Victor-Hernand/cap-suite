<script setup>
import { computed, ref } from 'vue';
import CapHeader from './CapHeader.vue';
import CapMoreSheet from './CapMoreSheet.vue';
import CapSidebar from './CapSidebar.vue';
import CapTabBar from './CapTabBar.vue';
import CapToaster from './CapToaster.vue';
import { grantedModulesOf } from './helpers.js';
import { company } from '../company.js';

const MAX_TABS = 4;

const props = defineProps({
  systemName: { type: String, required: true },
  owner: { type: String, default: company.name },
  mark: { type: String, default: company.mark },
  menu: { type: Array, required: true },
  tabs: { type: Array, default: () => [] },
  user: { type: Object, required: true },
  title: { type: String, required: true },
  breadcrumbs: { type: Array, default: () => [] },
  sections: { type: Array, default: () => [] },
  notifications: { type: Array, default: () => [] },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
  backHref: { type: String, default: '' },
  topbarSearch: { type: Boolean, default: true },
  fabLabel: { type: String, default: '' },
  notificationsHref: { type: String, default: '' },
  modules: { type: Array, default: () => [] },
  modulesHref: { type: String, default: '' },
});

const emit = defineEmits(['fab', 'logout', 'mark-all-read', 'notification', 'search', 'view-all']);

const moreOpen = ref(false);
const visibleTabs = computed(() => props.tabs.slice(0, MAX_TABS));
const grantedModules = computed(() => grantedModulesOf(props.modules));
</script>

<template>
  <div class="cap-shell">
    <CapSidebar
      :system-name="systemName"
      :owner="owner"
      :mark="mark"
      :menu="menu"
      :user="user"
      :link-component="linkComponent"
      :link-prop="linkProp"
      @logout="emit('logout')"
    />

    <div class="cap-shell__main">
      <CapHeader
        :title="title"
        :system-name="systemName"
        :mark="mark"
        :breadcrumbs="breadcrumbs"
        :sections="sections"
        :user="user"
        :notifications="notifications"
        :link-component="linkComponent"
        :link-prop="linkProp"
        :notifications-href="notificationsHref"
        :modules="grantedModules"
        :modules-href="modulesHref"
        :back-href="backHref"
        :topbar-search="topbarSearch"
        @mark-all-read="emit('mark-all-read')"
        @notification="emit('notification', $event)"
        @search="emit('search')"
        @view-all="emit('view-all')"
      >
        <template v-if="$slots.search" #search><slot name="search" /></template>
        <template #header-actions><slot name="header-actions" /></template>
        <template #topbar-actions><slot name="topbar-actions" /></template>
      </CapHeader>

      <main class="cap-shell__content"><slot /></main>
    </div>

    <CapTabBar :tabs="visibleTabs" :link-component="linkComponent" :link-prop="linkProp" :more-open="moreOpen" @more="moreOpen = !moreOpen" />

    <button v-if="fabLabel" class="cap-shell-fab" type="button" :aria-label="fabLabel" @click="emit('fab')">
      <i class="mdi mdi-plus" aria-hidden="true" />
    </button>

    <CapMoreSheet
      :open="moreOpen"
      :menu="menu"
      :modules="grantedModules"
      :user="user"
      :link-component="linkComponent"
      :link-prop="linkProp"
      @close="moreOpen = false"
      @logout="emit('logout')"
    />

    <CapToaster />
  </div>
</template>
