<script setup>
import { pinInPlace, TOAST_ENTERING_CLASS, TOAST_LEAVING_CLASS, TOAST_MOVING_CLASS } from '../shell/js/toast-motion.js';
import { useToasts } from './composables/useToasts.js';

const STATUS_ICONS = {
  ok: 'mdi-check-circle-outline',
  info: 'mdi-information-outline',
  warning: 'mdi-alert-outline',
  error: 'mdi-alert-circle-outline',
  neutral: 'mdi-archive-outline',
};

const { toasts, dismiss, pause, resume } = useToasts();

function selectAction(toast) {
  toast.action.onSelect();
  dismiss(toast.id);
}
</script>

<template>
  <TransitionGroup
    tag="div"
    class="cap-toaster"
    name="cap-toast"
    appear
    :enter-active-class="TOAST_ENTERING_CLASS"
    :leave-active-class="TOAST_LEAVING_CLASS"
    :move-class="TOAST_MOVING_CLASS"
    @before-leave="pinInPlace"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="cap-toast"
      :class="`cap-toast--${toast.status}`"
      :role="toast.status === 'error' ? 'alert' : 'status'"
      :style="{ '--cap-toast-duration': `${toast.durationMs}ms` }"
      @mouseenter="pause(toast.id)"
      @focusin="pause(toast.id)"
      @mouseleave="resume(toast.id)"
      @focusout="resume(toast.id)"
    >
      <span class="cap-toast__icon"><i class="mdi" :class="STATUS_ICONS[toast.status]" aria-hidden="true" /></span>
      <div class="cap-toast__body">
        <strong class="cap-toast__title">{{ toast.title }}</strong>
        <span v-if="toast.detail" class="cap-toast__detail">{{ toast.detail }}</span>
        <button v-if="toast.action" class="cap-toast__action" type="button" @click="selectAction(toast)">{{ toast.action.label }}</button>
        <span class="cap-toast__progress" />
      </div>
      <button class="cap-toast__close" type="button" aria-label="Cerrar notificación" @click="dismiss(toast.id)">
        <i class="mdi mdi-close" aria-hidden="true" />
      </button>
    </div>
  </TransitionGroup>
</template>
