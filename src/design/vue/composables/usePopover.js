import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { belongsToPanel } from '../../shell/js/popover.js';
import { useEscapeKey } from './useEscapeKey.js';

// One header popover is open at a time: opening a panel closes whichever was open.
const activePanelId = ref(null);

export function usePopover(panelId) {
  const isOpen = computed(() => activePanelId.value === panelId);
  let opener = null;

  const close = () => {
    if (isOpen.value) activePanelId.value = null;
  };

  const toggle = (event) => {
    opener = event.currentTarget;
    activePanelId.value = isOpen.value ? null : panelId;
  };

  const onDocumentClick = (event) => {
    if (isOpen.value && !belongsToPanel(event.target, panelId)) close();
  };

  useEscapeKey(isOpen, () => {
    close();
    opener?.focus();
  });
  onMounted(() => document.addEventListener('click', onDocumentClick));
  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
    close();
  });

  return { isOpen, toggle, close };
}
