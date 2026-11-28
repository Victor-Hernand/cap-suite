import { onBeforeUnmount, onMounted } from 'vue';
import { bindPillNav } from '../../shell/js/pill-nav.js';

export function usePillNav(containerRef, options = {}) {
  let pillNav = null;
  onMounted(() => { pillNav = bindPillNav(containerRef.value, options); });
  onBeforeUnmount(() => pillNav?.destroy());
}
