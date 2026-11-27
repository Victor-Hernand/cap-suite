import { onBeforeUnmount, onMounted, toValue, watch } from 'vue';
import { onEscape } from '../../shell/js/on-escape.js';

export function useEscapeKey(active, handler) {
  let releaseEscape = null;

  const release = () => {
    releaseEscape?.();
    releaseEscape = null;
  };

  const sync = () => {
    release();
    if (toValue(active)) releaseEscape = onEscape(document, handler);
  };

  onMounted(sync);
  watch(() => toValue(active), sync, { flush: 'post' });
  onBeforeUnmount(release);
}
