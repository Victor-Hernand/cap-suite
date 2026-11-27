const DURATION_MS_BY_STATUS = { ok: 5000, info: 5000, warning: 8000, error: 8000, neutral: 8000 };
const MAX_VISIBLE = 3;

export function createToastQueue(
  onChange,
  { now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout } = {},
) {
  let toasts = [];
  let nextId = 1;
  const timers = new Map();

  const notify = () => onChange(list());
  const list = () => toasts.map((toast) => ({ ...toast }));
  const find = (id) => toasts.find((toast) => toast.id === id);

  const stopTimer = (id) => {
    const timer = timers.get(id);
    if (!timer) return null;
    clearTimer(timer.handle);
    timers.delete(id);
    return timer;
  };

  const startTimer = (toast) => {
    const handle = setTimer(() => dismiss(toast.id), toast.remainingMs);
    timers.set(toast.id, { handle, startedAt: now() });
  };

  function dismiss(id) {
    if (!find(id)) return;
    stopTimer(id);
    toasts = toasts.filter((toast) => toast.id !== id);
    notify();
  }

  const clear = () => {
    for (const id of [...timers.keys()]) stopTimer(id);
    toasts = [];
    notify();
  };

  const pause = (id) => {
    const toast = find(id);
    const timer = stopTimer(id);
    if (toast && timer) toast.remainingMs = Math.max(0, toast.remainingMs - (now() - timer.startedAt));
  };

  const resume = (id) => {
    const toast = find(id);
    if (toast && !timers.has(id)) startTimer(toast);
  };

  const show = (options) => {
    const durationMs = DURATION_MS_BY_STATUS[options.status] ?? DURATION_MS_BY_STATUS.info;
    const toast = { ...options, id: `cap-toast-${nextId++}`, durationMs, remainingMs: durationMs };
    toasts.push(toast);
    startTimer(toast);
    while (toasts.length > MAX_VISIBLE) dismiss(toasts[0].id);
    notify();
    return toast.id;
  };

  return { show, dismiss, pause, resume, clear, list };
}
