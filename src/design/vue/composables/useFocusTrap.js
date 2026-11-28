import { onBeforeUnmount, onMounted, watch } from 'vue';
import { trapFocus } from '../../shell/js/focus-trap.js';

export function useFocusTrap(containerRef, active, initialFocusRef = null) {
  let releaseFocus = null;

  const release = () => {
    releaseFocus?.();
    releaseFocus = null;
  };

  const engage = () => {
    release();
    if (active.value && containerRef.value) {
      releaseFocus = trapFocus(containerRef.value, initialFocusRef?.value ?? undefined);
    }
  };

  onMounted(engage);
  watch(active, engage, { flush: 'post' });
  onBeforeUnmount(release);
}
