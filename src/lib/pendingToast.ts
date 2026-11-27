// El admin recarga la página al guardar: el toast del resultado viaja en sessionStorage
// y lo muestra la página siguiente.
const PENDING_TOAST_KEY = 'cap-suite:pending-toast';

const TOAST_STATUSES: readonly string[] = ['ok', 'info', 'warning', 'error', 'neutral'];

type ToastWriter = Pick<Storage, 'setItem'>;
type ToastReader = Pick<Storage, 'getItem' | 'removeItem'>;

function isToast(value: unknown): value is CapToastOptions {
  if (typeof value !== 'object' || value === null) return false;
  const { status, title, detail } = value as Record<string, unknown>;
  return (
    TOAST_STATUSES.includes(String(status)) &&
    typeof title === 'string' &&
    (detail === undefined || typeof detail === 'string')
  );
}

export function storePendingToast(storage: ToastWriter, toast: CapToastOptions): void {
  storage.setItem(PENDING_TOAST_KEY, JSON.stringify(toast));
}

/** Devuelve el toast pendiente, una sola vez. */
export function takePendingToast(storage: ToastReader): CapToastOptions | null {
  const stored = storage.getItem(PENDING_TOAST_KEY);
  if (stored === null) return null;
  storage.removeItem(PENDING_TOAST_KEY);
  try {
    const parsed: unknown = JSON.parse(stored);
    return isToast(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
