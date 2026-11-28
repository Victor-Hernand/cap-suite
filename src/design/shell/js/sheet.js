import { onEscape } from './on-escape.js';
import { trapFocus } from './focus-trap.js';

export const DRAG_CLOSE_DISTANCE = 80;

export function createDragToClose(isOpen, close) {
  let dragStartY = null;
  return {
    start(event) {
      dragStartY = event.clientY;
    },
    end(event) {
      const dragDistance = dragStartY === null ? 0 : event.clientY - dragStartY;
      dragStartY = null;
      if (isOpen() && dragDistance > DRAG_CLOSE_DISTANCE) close();
    },
  };
}

export function bindSheet(trigger, sheet) {
  if (!sheet) return () => {};
  const ownerDocument = sheet.ownerDocument;
  const backdrop = sheet.querySelector('[data-cap-sheet-backdrop]');
  const handle = sheet.querySelector('[data-cap-sheet-handle]');
  let releaseFocus = null;
  let releaseEscape = null;

  const isOpen = () => sheet.dataset.open === 'true';

  const release = () => {
    releaseFocus?.();
    releaseEscape?.();
    releaseFocus = null;
    releaseEscape = null;
  };

  const open = () => {
    release();
    sheet.dataset.open = 'true';
    trigger.setAttribute('aria-expanded', 'true');
    releaseFocus = trapFocus(sheet);
    releaseEscape = onEscape(ownerDocument, close);
  };

  function close() {
    sheet.dataset.open = 'false';
    trigger.setAttribute('aria-expanded', 'false');
    release();
  }

  const drag = createDragToClose(isOpen, close);
  const onTriggerClick = () => (isOpen() ? close() : open());

  trigger.addEventListener('click', onTriggerClick);
  backdrop?.addEventListener('click', close);
  handle?.addEventListener('pointerdown', drag.start);
  ownerDocument.addEventListener('pointerup', drag.end);

  return () => {
    trigger.removeEventListener('click', onTriggerClick);
    backdrop?.removeEventListener('click', close);
    handle?.removeEventListener('pointerdown', drag.start);
    ownerDocument.removeEventListener('pointerup', drag.end);
    release();
  };
}
