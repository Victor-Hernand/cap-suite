const COLLAPSED_KEY = 'cap-shell:sidebar-collapsed';

export function readItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeItem(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage can be blocked (private mode, disabled cookies); stored preferences are optional.
  }
}

export function readCollapsed() {
  const stored = readItem(COLLAPSED_KEY);
  return stored === null ? null : stored === 'true';
}

export function writeCollapsed(collapsed) {
  writeItem(COLLAPSED_KEY, collapsed);
}
