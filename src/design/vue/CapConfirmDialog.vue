<script setup>
import { ref, toRef, useId, watch } from 'vue';
import { useEscapeKey } from './composables/useEscapeKey.js';
import { useFocusTrap } from './composables/useFocusTrap.js';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  icon: { type: String, default: 'alert-outline' },
  acknowledgeLabel: { type: String, default: '' },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['confirm', 'cancel']);

const titleId = useId();
const messageId = useId();
const panelRef = ref(null);
const cancelButtonRef = ref(null);
const acknowledged = ref(false);
const isOpen = toRef(props, 'open');

useFocusTrap(panelRef, isOpen, cancelButtonRef);
useEscapeKey(isOpen, () => emit('cancel'));
watch(isOpen, () => {
  acknowledged.value = false;
});
</script>

<template>
  <div v-if="open" class="cap-dialog">
    <div class="cap-dialog__backdrop" />
    <div ref="panelRef" class="cap-dialog__panel" role="alertdialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="messageId">
      <button class="cap-dialog__close" type="button" aria-label="Cerrar" @click="emit('cancel')">
        <i class="mdi mdi-close" aria-hidden="true" />
      </button>
      <span class="cap-dialog__icon"><i class="mdi" :class="`mdi-${icon}`" aria-hidden="true" /></span>
      <h2 :id="titleId" class="cap-dialog__title">{{ title }}</h2>
      <p :id="messageId" class="cap-dialog__text">{{ message }}</p>
      <label v-if="acknowledgeLabel" class="cap-check cap-dialog__ack">
        <input v-model="acknowledged" class="cap-check__box" type="checkbox">{{ acknowledgeLabel }}
      </label>
      <div class="cap-dialog__actions">
        <button ref="cancelButtonRef" class="cap-button cap-button--secondary" type="button" @click="emit('cancel')">Cancelar</button>
        <button
          class="cap-button cap-button--danger-solid"
          type="button"
          :disabled="loading || (Boolean(acknowledgeLabel) && !acknowledged)"
          :aria-busy="loading ? 'true' : undefined"
          @click="emit('confirm')"
        >{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>
