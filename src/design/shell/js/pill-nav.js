import { power3InOut, power3Out, prefersReducedMotion } from './motion.js';

export { power3InOut, power3Out };

export const BACK_EDGE_MS = 550;
export const FRONT_EDGE_MS = 360;

const ACTIVE_ITEM_SELECTOR = '[aria-current="page"], [aria-pressed="true"]';
const ACTIVE_ATTRIBUTES = ['aria-current', 'aria-pressed'];

export function pillInset(container, item) {
  return {
    top: item.offsetTop,
    right: container.scrollWidth - item.offsetLeft - item.offsetWidth,
    bottom: container.clientHeight - item.offsetTop - item.offsetHeight,
    left: item.offsetLeft,
  };
}

const interpolate = (from, to, progress) => from + (to - from) * progress;

// Un solo observador en el contenedor: también ve los ítems que el framework reemplaza.
function observeItems(container, onChange) {
  if (typeof MutationObserver !== 'function') return null;
  const observer = new MutationObserver((records) => {
    const itemsReplaced = records.some((record) => record.type === 'childList');
    onChange({ itemsReplaced });
  });
  observer.observe(container, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ACTIVE_ATTRIBUTES,
  });
  return observer;
}

// manageSelection: false cuando el framework es dueño de aria-pressed; la píldora solo pinta y sigue los atributos.
export function bindPillNav(container, { reducedMotion = prefersReducedMotion(), manageSelection = true } = {}) {
  // Los componentes Vue enlazan su propia píldora; initShell no debe enlazarla otra vez.
  if (container.dataset.capPillBound === 'true') return { moveTo() {}, refresh() {}, destroy() {} };
  container.dataset.capPillBound = 'true';

  const pill = container.querySelector(':scope > [data-cap-pill]');
  const listeners = new AbortController();
  const { signal } = listeners;
  let current = null;
  let frameId = null;

  const items = () => [...container.querySelectorAll(':scope > a, :scope > button')];
  const findActive = () => items().find((item) => item.matches(ACTIVE_ITEM_SELECTOR)) ?? null;

  const cancelAnimation = () => {
    cancelAnimationFrame(frameId);
    frameId = null;
  };

  // La píldora mide todo el contenido desplazable para poder cubrir ítems fuera de la vista.
  // Se mide con ella plegada: su propio ancho cuenta en scrollWidth y se trabaría al estrecharse.
  const fitPillToContent = () => {
    pill.style.width = '0px';
    pill.style.width = `${container.scrollWidth}px`;
  };

  const paint = (inset) => {
    const { top, right, bottom, left } = inset;
    current = inset;
    pill.style.visibility = '';
    pill.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round 999px)`;
  };

  const hide = () => {
    current = null;
    pill.style.visibility = 'hidden';
  };

  const animateTo = (target) => {
    const origin = current;
    const movingRight = target.left > origin.left;
    const startedAt = performance.now();

    const step = () => {
      const elapsed = performance.now() - startedAt;
      const backEdgeProgress = power3InOut(Math.min(1, elapsed / BACK_EDGE_MS));
      const frontEdgeProgress = power3Out(Math.min(1, elapsed / FRONT_EDGE_MS));
      // El borde delantero es el rápido y llega primero; el trasero lo alcanza (estira, no aplasta).
      const [leftProgress, rightProgress] = movingRight
        ? [backEdgeProgress, frontEdgeProgress]
        : [frontEdgeProgress, backEdgeProgress];

      paint({
        ...target,
        left: interpolate(origin.left, target.left, leftProgress),
        right: interpolate(origin.right, target.right, rightProgress),
      });
      frameId = elapsed < BACK_EDGE_MS ? requestAnimationFrame(step) : null;
    };
    frameId = requestAnimationFrame(step);
  };

  const moveTo = (item, { animate = true } = {}) => {
    cancelAnimation();
    if (!item || container.clientWidth === 0) return hide();
    fitPillToContent();
    const target = pillInset(container, item);
    if (animate && !reducedMotion && current) animateTo(target);
    else paint(target);
  };

  const refresh = () => moveTo(findActive(), { animate: false });

  const onItemClick = (event) => {
    const button = event.target.closest('button');
    if (button?.parentElement !== container) return;
    items().forEach((item) => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    container.dispatchEvent(
      new CustomEvent('cap:segmented-change', { bubbles: true, detail: { value: button.value } }),
    );
  };

  const itemsObserver = observeItems(container, ({ itemsReplaced }) =>
    moveTo(findActive(), { animate: !itemsReplaced }));

  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(refresh) : null;
  if (resizeObserver) resizeObserver.observe(container);
  else window.addEventListener('resize', refresh, { signal });

  if (manageSelection) container.addEventListener('click', onItemClick, { signal });
  refresh();

  return {
    moveTo,
    refresh,
    destroy() {
      cancelAnimation();
      itemsObserver?.disconnect();
      resizeObserver?.disconnect();
      listeners.abort();
      delete container.dataset.capPillBound;
    },
  };
}
