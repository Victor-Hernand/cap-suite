import { captureTops, pinInPlace, playEnter, playExit, slideFromPreviousTops } from './toast-motion.js';
import { createToastQueue } from './toast-queue.js';

const STATUS_ICONS = {
  ok: 'mdi-check-circle-outline',
  info: 'mdi-information-outline',
  warning: 'mdi-alert-outline',
  error: 'mdi-alert-circle-outline',
  neutral: 'mdi-archive-outline',
};

let activeToaster = null;

export function showToast(options) {
  return activeToaster?.show(options);
}

function elementFactory(ownerDocument) {
  return (tag, className, text) => {
    const element = ownerDocument.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
}

function createIcon(createElement, status) {
  const wrapper = createElement('span', 'cap-toast__icon');
  const icon = createElement('i', `mdi ${STATUS_ICONS[status]}`);
  icon.setAttribute('aria-hidden', 'true');
  wrapper.append(icon);
  return wrapper;
}

function createBody(createElement, toast, queue) {
  const body = createElement('div', 'cap-toast__body');
  body.append(createElement('strong', 'cap-toast__title', toast.title));
  if (toast.detail) body.append(createElement('span', 'cap-toast__detail', toast.detail));
  if (toast.action) {
    const action = createElement('button', 'cap-toast__action', toast.action.label);
    action.type = 'button';
    action.addEventListener('click', () => {
      toast.action.onSelect();
      queue.dismiss(toast.id);
    });
    body.append(action);
  }
  body.append(createElement('span', 'cap-toast__progress'));
  return body;
}

function createCloseButton(createElement, toast, queue) {
  const close = createElement('button', 'cap-toast__close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Cerrar notificación');
  const icon = createElement('i', 'mdi mdi-close');
  icon.setAttribute('aria-hidden', 'true');
  close.append(icon);
  close.addEventListener('click', () => queue.dismiss(toast.id));
  return close;
}

function renderToast(createElement, toast, queue) {
  const element = createElement('div', `cap-toast cap-toast--${toast.status}`);
  element.setAttribute('role', toast.status === 'error' ? 'alert' : 'status');
  element.style.setProperty('--cap-toast-duration', `${toast.durationMs}ms`);
  element.append(
    createIcon(createElement, toast.status),
    createBody(createElement, toast, queue),
    createCloseButton(createElement, toast, queue),
  );
  const pause = () => queue.pause(toast.id);
  const resume = () => queue.resume(toast.id);
  element.addEventListener('mouseenter', pause);
  element.addEventListener('focusin', pause);
  element.addEventListener('mouseleave', resume);
  element.addEventListener('focusout', resume);
  return element;
}

export function mountToaster(container) {
  const createElement = elementFactory(container.ownerDocument);
  const elementsById = new Map();
  const initialToasts = [...container.querySelectorAll(':scope > [data-cap-toast]')];

  const render = (toasts) => {
    const visibleIds = new Set(toasts.map((toast) => toast.id));
    const leavingElements = [];
    for (const [id, element] of elementsById) {
      if (visibleIds.has(id)) continue;
      leavingElements.push(element);
      elementsById.delete(id);
    }
    const previousTops = captureTops([...elementsById.values()]);
    pinInPlace(...leavingElements);
    for (const element of leavingElements) playExit(element, () => element.remove());
    for (const toast of toasts) {
      if (elementsById.has(toast.id)) continue;
      const element = renderToast(createElement, toast, queue);
      elementsById.set(toast.id, element);
      container.append(element);
      playEnter(element);
    }
    slideFromPreviousTops(previousTops);
  };

  const queue = createToastQueue(render);
  const api = {
    show: queue.show,
    dismiss: queue.dismiss,
    destroy() {
      queue.clear();
      if (activeToaster === api) activeToaster = null;
    },
  };

  for (const element of initialToasts) {
    const { status = 'info', title = '', detail } = element.dataset;
    element.remove();
    queue.show({ status, title, detail });
  }
  activeToaster = api;
  return api;
}
