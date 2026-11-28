import { initShell } from './shell.js';
import { showToast } from './shell/js/toasts.js';

window.capToast = showToast;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initShell());
} else {
  initShell();
}
