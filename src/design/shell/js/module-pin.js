// A second binder on the same button (initShell run twice) gets a no-op teardown instead of a second listener.
function listenToClick(button, handler) {
  if (button.dataset.capModuleBound === 'true') return () => {};
  button.dataset.capModuleBound = 'true';
  const controller = new AbortController();
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handler();
  }, { signal: controller.signal });
  return () => {
    controller.abort();
    delete button.dataset.capModuleBound;
  };
}

function announce(button, type, detail) {
  button.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
}

export function bindModulePin(button) {
  return listenToClick(button, () => {
    const pinned = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(pinned));
    const icon = button.querySelector('i');
    if (icon) icon.className = pinned ? 'mdi mdi-star' : 'mdi mdi-star-outline';
    announce(button, 'cap:module-pin', { id: button.dataset.capModulePin, pinned });
  });
}

export function bindModuleRequest(button) {
  return listenToClick(button, () => {
    announce(button, 'cap:module-request', { id: button.dataset.capModuleRequest });
  });
}
