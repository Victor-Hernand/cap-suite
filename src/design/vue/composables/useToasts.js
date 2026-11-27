import { readonly, ref } from 'vue';
import { createToastQueue } from '../../shell/js/toast-queue.js';

const toasts = ref([]);
const queue = createToastQueue((visibleToasts) => {
  toasts.value = visibleToasts;
});

export function useToasts() {
  return {
    toasts: readonly(toasts),
    show: queue.show,
    dismiss: queue.dismiss,
    pause: queue.pause,
    resume: queue.resume,
  };
}
