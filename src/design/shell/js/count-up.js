import { power3Out, prefersReducedMotion } from './motion.js';

export const COUNT_UP_MS = 900;

const COUNT_SELECTOR = '[data-cap-count]';
const FALLBACK_MARGIN_MS = 100;
const MILLION = 1e6;
const THOUSAND = 1e3;

// Construir un Intl.NumberFormat es caro y la animación formatea en cada frame.
const numberFormatters = new Map();

function formatNumber(value, maximumFractionDigits) {
  if (!numberFormatters.has(maximumFractionDigits)) {
    numberFormatters.set(maximumFractionDigits, new Intl.NumberFormat('es-HN', { maximumFractionDigits }));
  }
  return numberFormatters.get(maximumFractionDigits).format(value);
}

function formatCompactCurrency(value) {
  if (value >= MILLION) return `L ${formatNumber(value / MILLION, 2)} M`;
  if (value >= THOUSAND) return `L ${formatNumber(value / THOUSAND, 0)} K`;
  return `L ${formatNumber(value, 0)}`;
}

export function formatCount(value, format) {
  if (format === 'percent') return `${formatNumber(value, 0)} %`;
  if (format === 'currency-compact') return formatCompactCurrency(value);
  return formatNumber(value, 0);
}

function findCountElements(root) {
  const descendants = [...root.querySelectorAll(COUNT_SELECTOR)];
  return root.matches?.(COUNT_SELECTOR) ? [root, ...descendants] : descendants;
}

// Vue guarda la referencia a su nodo de texto de `{{ }}`: reemplazarlo rompería las actualizaciones posteriores.
function writeText(element, text) {
  const firstNode = element.firstChild;
  if (firstNode?.nodeType === Node.TEXT_NODE) firstNode.data = text;
  else element.textContent = text;
}

function animateElement(element, { reducedMotion, hidden }) {
  const finalValue = Number(element.dataset.capCount);
  if (!Number.isFinite(finalValue)) return () => {};

  const { capFormat } = element.dataset;
  const writeValue = (value) => writeText(element, formatCount(value, capFormat));
  element.dataset.capCountDone = 'true';

  if (reducedMotion || hidden) {
    writeValue(finalValue);
    return () => {};
  }

  let frameId = null;
  const startedAt = performance.now();
  writeValue(0);

  const step = () => {
    const progress = Math.min(1, (performance.now() - startedAt) / COUNT_UP_MS);
    writeValue(finalValue * power3Out(progress));
    frameId = progress < 1 ? requestAnimationFrame(step) : null;
  };
  frameId = requestAnimationFrame(step);

  // Respaldo: en pestañas en segundo plano los frames no llegan y la cifra quedaría a medias.
  const fallbackId = setTimeout(() => writeValue(finalValue), COUNT_UP_MS + FALLBACK_MARGIN_MS);

  return () => {
    cancelAnimationFrame(frameId);
    clearTimeout(fallbackId);
  };
}

export function bindCountUp(
  root = document,
  { reducedMotion = prefersReducedMotion(), hidden = document.hidden } = {},
) {
  const pending = findCountElements(root).filter((element) => element.dataset.capCountDone !== 'true');
  const releases = pending.map((element) => animateElement(element, { reducedMotion, hidden }));
  return () => releases.forEach((release) => release());
}
