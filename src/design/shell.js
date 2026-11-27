import { applyCollapsed, bindSidebarCollapse, bindSidebarPeek, resolveCollapsed } from './shell/js/collapse.js';
import { bindCommandK } from './shell/js/command-k.js';
import { bindConfirmDialog } from './shell/js/confirm.js';
import { bindCountUp } from './shell/js/count-up.js';
import { bindKanban } from './shell/js/kanban.js';
import { bindLoginForm } from './shell/js/login-form.js';
import { bindModulePin, bindModuleRequest } from './shell/js/module-pin.js';
import { bindNotificationFilter } from './shell/js/notification-filter.js';
import { bindPasswordToggle } from './shell/js/password.js';
import { bindPillNav } from './shell/js/pill-nav.js';
import { bindPopover } from './shell/js/popover.js';
import { bindSheet } from './shell/js/sheet.js';
import { toggleTheme } from './shell/js/theme.js';
import { mountToaster } from './shell/js/toasts.js';

const findControlledPanel = (root, trigger) =>
  root.querySelector(`[id="${trigger.getAttribute('aria-controls')}"]`);

function bindEach(root, selector, bind) {
  return [...root.querySelectorAll(selector)].map(bind);
}

function bindSidebars(root) {
  return bindEach(root, '[data-cap-sidebar]', (sidebar) => {
    applyCollapsed(sidebar, resolveCollapsed(window.innerWidth));
    return bindSidebarCollapse(sidebar);
  });
}

function bindThemeToggle(button) {
  button.addEventListener('click', toggleTheme);
  return () => button.removeEventListener('click', toggleTheme);
}

function bindToasters(root) {
  return bindEach(root, '[data-cap-toaster]', (container) => mountToaster(container).destroy);
}

export function initShell(root = document) {
  const teardowns = [
    ...bindSidebars(root),
    ...bindEach(root, '[data-cap-sidebar]', bindSidebarPeek),
    ...bindEach(root, '[data-cap-search]', bindCommandK),
    ...bindEach(root, '[data-cap-sheet-trigger]', (trigger) =>
      bindSheet(trigger, findControlledPanel(root, trigger))),
    ...bindEach(root, '[data-cap-popover-trigger]', (trigger) =>
      bindPopover(trigger, findControlledPanel(root, trigger))),
    ...bindEach(root, '[data-cap-pill-nav]', (container) => bindPillNav(container).destroy),
    ...bindEach(root, '[data-cap-kanban]', (board) => bindKanban(board).destroy),
    ...bindEach(root, '[data-cap-count]', (element) => bindCountUp(element)),
    ...bindToasters(root),
    ...bindEach(root, '[data-cap-confirm]', bindConfirmDialog),
    ...bindEach(root, '[data-cap-theme-toggle]', bindThemeToggle),
    ...bindEach(root, '[data-cap-password-toggle]', bindPasswordToggle),
    ...bindEach(root, '[data-cap-notifications]', bindNotificationFilter),
    ...bindEach(root, '[data-cap-login-form]', bindLoginForm),
    ...bindEach(root, '[data-cap-module-pin]', bindModulePin),
    ...bindEach(root, '[data-cap-module-request]', bindModuleRequest),
  ];
  return () => teardowns.forEach((teardown) => teardown());
}
