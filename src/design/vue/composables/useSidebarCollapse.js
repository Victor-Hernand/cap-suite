import { onBeforeUnmount, onMounted, ref } from 'vue';
import { bindSidebarPeek, resolveCollapsed } from '../../shell/js/collapse.js';
import { writeCollapsed } from '../../shell/js/storage.js';

export function useSidebarCollapse(sidebarRef) {
  const collapsed = ref(typeof window === 'undefined' ? false : resolveCollapsed(window.innerWidth));

  function toggle() {
    collapsed.value = !collapsed.value;
    writeCollapsed(collapsed.value);
  }

  let unbindPeek = () => {};
  onMounted(() => { unbindPeek = bindSidebarPeek(sidebarRef.value); });
  onBeforeUnmount(() => unbindPeek());

  return { collapsed, toggle };
}
