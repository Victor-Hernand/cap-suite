const OUTLINE_SUFFIX = '-outline';

export function iconClass(item) {
  const useFilledVariant = item.active && item.icon.endsWith(OUTLINE_SUFFIX);
  const name = useFilledVariant ? item.icon.slice(0, -OUTLINE_SUFFIX.length) : item.icon;
  return `mdi-${name}`;
}

export function itemAriaLabel(item) {
  if (!item.count) return item.label;
  const noun = item.urgent ? 'urgente' : 'pendiente';
  return `${item.label}, ${item.count} ${noun}${item.count === 1 ? '' : 's'}`;
}

export function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

// Laravel hands tinyint columns over as 0/1, so any falsy granted locks the module; a missing key does not.
export function isLockedModule(module) {
  return 'granted' in module && !module.granted;
}

export function grantedModulesOf(modules) {
  return modules.filter((module) => !isLockedModule(module));
}

export function groupBy(items, keyOf) {
  const itemsByKey = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (itemsByKey.has(key)) itemsByKey.get(key).push(item);
    else itemsByKey.set(key, [item]);
  }
  return itemsByKey;
}
