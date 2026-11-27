const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function trapFocus(container, initialFocus) {
  const previouslyFocused = container.ownerDocument.activeElement;
  const focusables = () => [...container.querySelectorAll(FOCUSABLE_SELECTOR)];

  const cycle = (event) => {
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = container.ownerDocument.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', cycle);
  (initialFocus ?? focusables()[0])?.focus();

  return () => {
    container.removeEventListener('keydown', cycle);
    previouslyFocused?.focus?.();
  };
}
