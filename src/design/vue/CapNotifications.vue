<script setup>
import { computed, ref } from 'vue';
import { groupBy } from './helpers.js';

const props = defineProps({
  notifications: { type: Array, default: () => [] },
  viewAllHref: { type: String, default: '' },
  linkComponent: { type: [String, Object], default: 'a' },
  linkProp: { type: String, default: 'href' },
});

const emit = defineEmits(['mark-all-read', 'notification', 'view-all']);

const showUnreadOnly = ref(false);

const unreadCount = computed(() => props.notifications.filter((notification) => notification.unread).length);
const visibleNotifications = computed(() =>
  showUnreadOnly.value ? props.notifications.filter((notification) => notification.unread) : props.notifications,
);
const groups = computed(() =>
  [...groupBy(visibleNotifications.value, (notification) => notification.group)].map(([label, items]) => ({ label, items })),
);

const itemAttributes = (notification) =>
  notification.href
    ? { [props.linkProp]: notification.href }
    : {
        role: 'button',
        tabindex: '0',
        onKeydown: (event) => {
          if (event.key === 'Enter') emit('notification', notification.id);
        },
      };
</script>

<template>
  <section id="cap-notifications" class="cap-notifications cap-glass" aria-label="Notificaciones">
    <div class="cap-notifications__header">
      <h2 class="cap-notifications__title">Notificaciones</h2>
      <button class="cap-notifications__mark-read" type="button" @click="emit('mark-all-read')">Marcar todo como leído</button>
    </div>
    <div class="cap-notifications__tabs">
      <button class="cap-notifications__tab" type="button" :aria-pressed="String(!showUnreadOnly)" @click="showUnreadOnly = false">Todas</button>
      <button class="cap-notifications__tab" type="button" :aria-pressed="String(showUnreadOnly)" @click="showUnreadOnly = true">
        No leídas<span v-if="unreadCount" class="cap-notifications__tab-count">{{ unreadCount }}</span>
      </button>
    </div>
    <p v-if="groups.length === 0" class="cap-notifications__group">
      {{ showUnreadOnly ? 'No tienes notificaciones sin leer.' : 'No tienes notificaciones.' }}
    </p>
    <template v-for="group in groups" :key="group.label">
      <p class="cap-notifications__group">{{ group.label }}</p>
      <component
        :is="notification.href ? linkComponent : 'div'"
        v-for="notification in group.items"
        :key="notification.id"
        v-bind="itemAttributes(notification)"
        class="cap-notifications__item"
        :data-unread="notification.unread ? 'true' : undefined"
        @click="emit('notification', notification.id)"
      >
        <span class="cap-notifications__icon" :class="{ 'cap-notifications__icon--alert': notification.alert }">
          <i class="mdi" :class="`mdi-${notification.icon}`" aria-hidden="true" />
        </span>
        <div class="cap-notifications__text">
          <strong class="cap-notifications__item-title">{{ notification.title }}</strong>
          <small v-if="notification.detail" class="cap-notifications__detail">{{ notification.detail }}</small>
        </div>
        <span class="cap-notifications__time">{{ notification.time }}</span>
      </component>
    </template>
    <component :is="linkComponent" v-if="viewAllHref" class="cap-notifications__footer" :[linkProp]="viewAllHref" @click="emit('view-all')">Ver todas</component>
    <button v-else class="cap-notifications__footer" type="button" @click="emit('view-all')">Ver todas</button>
  </section>
</template>
