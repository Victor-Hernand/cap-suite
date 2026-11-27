import { onEscape } from './on-escape.js';
import { trapFocus } from './focus-trap.js';

export function bindConfirmDialog(dialog) {
  const accept = dialog.querySelector('[data-cap-confirm-accept]');
  if (!accept) return () => {};
  const ownerDocument = dialog.ownerDocument;
  const panel = dialog.querySelector('.cap-dialog__panel') ?? dialog;
  const cancel = dialog.querySelector('[data-cap-confirm-cancel]');
  const acknowledgement = dialog.querySelector('[data-cap-confirm-ack]');
  let releaseFocus = null;
  let releaseEscape = null;

  const syncAccept = () => {
    accept.disabled = Boolean(acknowledgement) && !acknowledgement.checked;
  };

  const open = () => {
    if (acknowledgement) acknowledgement.checked = false;
    syncAccept();
    accept.removeAttribute('aria-busy');
    dialog.hidden = false;
    releaseFocus = trapFocus(panel, cancel);
    releaseEscape = onEscape(ownerDocument, close);
  };

  const close = () => {
    dialog.hidden = true;
    releaseFocus?.();
    releaseEscape?.();
    releaseFocus = null;
    releaseEscape = null;
  };

  const onDocumentClick = (event) => {
    const opener = event.target.closest('[data-cap-confirm-open]');
    if (opener?.dataset.capConfirmOpen === dialog.id) open();
  };
  const onAccept = () => {
    accept.setAttribute('aria-busy', 'true');
    dialog.dispatchEvent(new CustomEvent('cap:confirm', { bubbles: true, detail: { id: dialog.id } }));
  };
  const closeButtons = dialog.querySelectorAll('[data-cap-confirm-close], [data-cap-confirm-cancel]');

  ownerDocument.addEventListener('click', onDocumentClick);
  acknowledgement?.addEventListener('change', syncAccept);
  accept.addEventListener('click', onAccept);
  closeButtons.forEach((button) => button.addEventListener('click', close));

  return () => {
    ownerDocument.removeEventListener('click', onDocumentClick);
    releaseEscape?.();
    acknowledgement?.removeEventListener('change', syncAccept);
    accept.removeEventListener('click', onAccept);
    closeButtons.forEach((button) => button.removeEventListener('click', close));
  };
}
