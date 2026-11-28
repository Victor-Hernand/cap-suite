import { onEscape } from './on-escape.js';
import { readCollapsed, writeCollapsed } from './storage.js';

const RAIL_MIN_WIDTH = 1024;
const PEEK_OPEN_DELAY_MS = 120;
const PEEK_CLOSE_DELAY_MS = 240;

export function defaultCollapsed(viewportWidth) {
  return viewportWidth >= RAIL_MIN_WIDTH;
}

export function resolveCollapsed(viewportWidth) {
  return readCollapsed() ?? defaultCollapsed(viewportWidth);
}

export function applyCollapsed(sidebar, collapsed) {
  sidebar.dataset.collapsed = String(collapsed);
  const button = sidebar.querySelector('[data-cap-collapse]');
  if (!button) return;
  button.setAttribute('aria-expanded', String(!collapsed));
  button.setAttribute('aria-label', collapsed ? 'Expandir menú' : 'Contraer menú');
}

export function bindSidebarCollapse(sidebar) {
  const button = sidebar.querySelector('[data-cap-collapse]');
  if (!button) return () => {};
  const toggle = () => {
    const collapsed = sidebar.dataset.collapsed !== 'true';
    applyCollapsed(sidebar, collapsed);
    writeCollapsed(collapsed);
  };
  button.addEventListener('click', toggle);
  return () => button.removeEventListener('click', toggle);
}

// Asoma el riel como panel flotante sin cambiar la preferencia guardada.
export function bindSidebarPeek(sidebar) {
  let pendingTimer = null;

  const schedule = (action, delay) => {
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(action, delay);
  };
  const openPeek = () => {
    if (sidebar.dataset.collapsed === 'true') sidebar.dataset.peek = 'open';
  };
  const closePeek = () => {
    clearTimeout(pendingTimer);
    delete sidebar.dataset.peek;
  };

  const onPointerEnter = (event) => {
    if (event.pointerType !== 'touch') schedule(openPeek, PEEK_OPEN_DELAY_MS);
  };
  const onPointerLeave = (event) => {
    if (event.pointerType !== 'touch') schedule(closePeek, PEEK_CLOSE_DELAY_MS);
  };
  const onFocusIn = (event) => {
    if (event.target.matches(':focus-visible')) schedule(openPeek, 0);
  };
  const onFocusOut = (event) => {
    if (!sidebar.contains(event.relatedTarget)) schedule(closePeek, PEEK_CLOSE_DELAY_MS);
  };

  const listeners = new AbortController();
  const { signal } = listeners;
  const releaseEscape = onEscape(sidebar, closePeek);
  sidebar.querySelector('[data-cap-collapse]')?.addEventListener('click', closePeek, { signal });
  sidebar.addEventListener('pointerenter', onPointerEnter, { signal });
  sidebar.addEventListener('pointerleave', onPointerLeave, { signal });
  sidebar.addEventListener('focusin', onFocusIn, { signal });
  sidebar.addEventListener('focusout', onFocusOut, { signal });

  return () => {
    closePeek();
    releaseEscape();
    listeners.abort();
  };
}
