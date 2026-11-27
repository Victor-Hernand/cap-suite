import { ref, type Ref } from 'vue';
import type { ActionResult } from './useActionForm';

type RunAction = (call: () => Promise<ActionResult<unknown>>, fields: [], onSuccess: () => void) => Promise<boolean>;

/**
 * Estado del diálogo de confirmación al eliminar: qué se va a eliminar y si la acción está en curso.
 * Si la acción falla, el diálogo se cierra y el motivo queda en el formError de useActionForm.
 */
export function useDeleteConfirmation<Target>(runAction: RunAction) {
  const pendingTarget = ref<Target | null>(null) as Ref<Target | null>;
  const deleting = ref(false);

  function request(target: Target) {
    pendingTarget.value = target;
  }

  function cancel() {
    if (!deleting.value) pendingTarget.value = null;
  }

  async function confirm(remove: (target: Target) => Promise<ActionResult<unknown>>, onSuccess: (target: Target) => void) {
    const target = pendingTarget.value;
    if (target === null || deleting.value) return;
    deleting.value = true;
    const succeeded = await runAction(() => remove(target), [], () => onSuccess(target));
    if (succeeded) return;
    deleting.value = false;
    pendingTarget.value = null;
  }

  return { pendingTarget, deleting, request, cancel, confirm };
}
