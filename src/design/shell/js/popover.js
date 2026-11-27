import { onEscape } from './on-escape.js';

const sessionByPanel = new WeakMap();

export function belongsToPanel(target, panelId) {
  return Boolean(target.closest(`#${panelId}, [aria-controls="${panelId}"]`));
}

export function bindPopover(trigger, panel) {
  if (!panel) return () => {};
  const ownerDocument = panel.ownerDocument;

  const endSession = () => {
    sessionByPanel.get(panel)?.releaseEscape();
    sessionByPanel.delete(panel);
  };

  const isOpenedByThisTrigger = () => !panel.hidden && sessionByPanel.get(panel)?.trigger === trigger;

  const closeAndFocusTrigger = () => {
    if (!isOpenedByThisTrigger()) return;
    setOpen(false);
    trigger.focus();
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    endSession();
    if (open) sessionByPanel.set(panel, { trigger, releaseEscape: onEscape(ownerDocument, closeAndFocusTrigger) });
  };

  const onTriggerClick = () => setOpen(panel.hidden);
  const onDocumentClick = (event) => {
    if (isOpenedByThisTrigger() && !belongsToPanel(event.target, panel.id)) setOpen(false);
  };

  trigger.addEventListener('click', onTriggerClick);
  ownerDocument.addEventListener('click', onDocumentClick);

  return () => {
    trigger.removeEventListener('click', onTriggerClick);
    ownerDocument.removeEventListener('click', onDocumentClick);
    if (sessionByPanel.get(panel)?.trigger === trigger) endSession();
  };
}
