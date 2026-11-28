<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import CapAvatar from './CapAvatar.vue';
import CapBellButton from './CapBellButton.vue';
import CapModuleSwitcher from './CapModuleSwitcher.vue';
import CapNotifications from './CapNotifications.vue';
import CapSectionNav from './CapSectionNav.vue';
import { usePopover } from './composables/usePopover.js';
import { bindCommandK } from '../shell/js/command-k.js';
import { company } from '../company.js';

const props = defineProps({
  title: { type: String, required: true },
  systemName: { type: String, default: '' },
  mark: { type: String, default: company.mark },
  breadcrumbs: { type: Array, default: () => [] },
  sections: { type: Array, default: () => [] },
  user: { type: Object, required: true },
  notifications: { type: Array, default: () => [] },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
  backHref: { type: String, default: '' },
  topbarSearch: { type: Boolean, default: true },
  notificationsHref: { type: String, default: '' },
  modules: { type: Array, default: () => [] },
  modulesHref: { type: String, default: '' },
});

const emit = defineEmits(['mark-all-read', 'notification', 'search', 'view-all']);

const { isOpen: notificationsOpen, toggle: toggleNotifications, close: closeNotifications } = usePopover('cap-notifications');
const { isOpen: modulesOpen, toggle: toggleModules, close: closeModules } = usePopover('cap-modules');

const closeAndEmit = (eventName, ...payload) => {
  closeNotifications();
  emit(eventName, ...payload);
};

const searchLabel = ref(null);
let releaseCommandK = () => {};

const unreadCount = computed(() => props.notifications.filter((notification) => notification.unread).length);
const topbarShowsTitle = computed(() => Boolean(props.backHref) || !props.systemName);
const showSections = computed(() => props.sections.length >= 2);

onMounted(() => {
  const searchInput = searchLabel.value?.querySelector('input');
  if (searchInput) releaseCommandK = bindCommandK(searchInput);
});
onBeforeUnmount(() => releaseCommandK());
</script>

<template>
  <header class="cap-shell-header cap-glass" :class="{ 'cap-shell-header--with-nav': showSections }">
    <div>
      <nav v-if="breadcrumbs.length" class="cap-shell-header__crumbs" aria-label="Migas de pan">
        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.label">
          <span v-if="index > 0" aria-hidden="true"> › </span>
          <component :is="linkComponent" v-if="crumb.href" :[linkProp]="crumb.href">{{ crumb.label }}</component>
          <template v-else>{{ crumb.label }}</template>
        </template>
      </nav>
      <h1 class="cap-shell-header__title">{{ title }}</h1>
    </div>
    <CapSectionNav v-if="showSections" :sections="sections" :link-component="linkComponent" :link-prop="linkProp" />
    <label v-if="$slots.search" ref="searchLabel" class="cap-shell-header__search">
      <i class="mdi mdi-magnify" aria-hidden="true" />
      <slot name="search" />
      <kbd class="cap-shell-header__kbd">⌘K</kbd>
    </label>
    <div class="cap-shell-header__actions">
      <slot name="header-actions" />
      <button
        v-if="modules.length"
        class="cap-shell-header__icon-button"
        type="button"
        aria-label="Cambiar de módulo"
        :aria-expanded="String(modulesOpen)"
        aria-controls="cap-modules"
        @click="toggleModules"
      >
        <i class="mdi mdi-apps" aria-hidden="true" />
      </button>
      <CapBellButton
        button-class="cap-shell-header__icon-button"
        :expanded="notificationsOpen"
        :unread-count="unreadCount"
        @click="toggleNotifications"
      />
      <CapAvatar :user="user" />
    </div>
  </header>

  <header class="cap-shell-topbar cap-glass">
    <component :is="linkComponent" v-if="backHref" class="cap-shell-topbar__icon-button" :[linkProp]="backHref" aria-label="Volver">
      <i class="mdi mdi-arrow-left" aria-hidden="true" />
    </component>
    <span v-else class="cap-shell-logo" aria-hidden="true">{{ mark }}</span>
    <h1 v-if="topbarShowsTitle" class="cap-shell-topbar__title">{{ title }}</h1>
    <template v-else>
      <span class="cap-shell-topbar__title">{{ systemName }}</span>
      <h1 class="cap-shell-topbar__hidden-title">{{ title }}</h1>
    </template>
    <button v-if="topbarSearch" class="cap-shell-topbar__icon-button" type="button" aria-label="Buscar" @click="emit('search')">
      <i class="mdi mdi-magnify" aria-hidden="true" />
    </button>
    <slot name="topbar-actions" />
    <CapBellButton
      button-class="cap-shell-topbar__icon-button"
      :expanded="notificationsOpen"
      :unread-count="unreadCount"
      @click="toggleNotifications"
    />
  </header>

  <CapSectionNav v-if="showSections" :sections="sections" mobile :link-component="linkComponent" :link-prop="linkProp" />

  <CapNotifications
    :hidden="!notificationsOpen"
    :notifications="notifications"
    :view-all-href="notificationsHref"
    :link-component="linkComponent"
    :link-prop="linkProp"
    @mark-all-read="emit('mark-all-read')"
    @notification="closeAndEmit('notification', $event)"
    @view-all="closeAndEmit('view-all')"
  />

  <CapModuleSwitcher
    v-if="modules.length"
    :modules="modules"
    :all-href="modulesHref"
    :hidden="!modulesOpen"
    :link-component="linkComponent"
    :link-prop="linkProp"
    @navigate="closeModules"
  />
</template>
