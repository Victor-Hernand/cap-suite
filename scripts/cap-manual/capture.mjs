import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  exitWithErrors,
  hasImageExtension,
  IMAGES_FOLDER,
  isValidImageStem,
  requireDirectoryArgument,
  runAsMain,
} from './lib.mjs';

const DEFAULT_VIEWPORT = { width: 1440, height: 900 };
const MAX_WAIT_MILLISECONDS = 10000;
const ACTION_KEYS = ['goto', 'click', 'fill', 'select', 'wait', 'screenshot'];
const SCREENSHOT_ONLY_KEYS = ['caption', 'fullPage'];
const LOGIN_FIELDS = ['url', 'userSelector', 'passwordSelector', 'submitSelector'];

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

function validateSelectorValue(action, value, position) {
  if (isPlainObject(value) && isNonEmptyString(value.selector) && typeof value.value === 'string') return [];
  return [`${position}: "${action}" requiere { "selector": "...", "value": "..." }.`];
}

function validateScreenshotStep(step, position) {
  const errors = [];
  if (hasImageExtension(step.screenshot)) {
    errors.push(`${position}: el nombre de captura "${step.screenshot}" no debe llevar extensión; se agrega .png automáticamente.`);
  } else if (!isValidImageStem(step.screenshot)) {
    errors.push(`${position}: el nombre de captura "${step.screenshot}" no es válido: usa minúsculas, números, punto, guion y sin extensión.`);
  }
  if ('caption' in step && !isNonEmptyString(step.caption)) {
    errors.push(`${position}: caption debe ser un texto no vacío.`);
  }
  if ('fullPage' in step && typeof step.fullPage !== 'boolean') {
    errors.push(`${position}: fullPage debe ser true o false.`);
  }
  return errors;
}

function validateActionValue(action, step, position) {
  if (action === 'fill' || action === 'select') return validateSelectorValue(action, step[action], position);
  if (action === 'wait') {
    const milliseconds = step.wait;
    const isValid = Number.isInteger(milliseconds) && milliseconds >= 0 && milliseconds <= MAX_WAIT_MILLISECONDS;
    return isValid ? [] : [`${position}: wait debe ser un entero de milisegundos entre 0 y ${MAX_WAIT_MILLISECONDS}.`];
  }
  if (!isNonEmptyString(step[action])) return [`${position}: "${action}" debe ser un texto no vacío.`];
  return action === 'screenshot' ? validateScreenshotStep(step, position) : [];
}

function validateStep(step, index) {
  const position = `Paso ${index + 1}`;
  if (!isPlainObject(step)) return [`${position}: debe ser un objeto.`];

  const keys = Object.keys(step);
  const unknownKeys = keys.filter((key) => !ACTION_KEYS.includes(key) && !SCREENSHOT_ONLY_KEYS.includes(key));
  if (unknownKeys.length > 0) return [`${position}: clave no admitida: ${unknownKeys.join(', ')}.`];

  const actions = keys.filter((key) => ACTION_KEYS.includes(key));
  if (actions.length !== 1) return [`${position}: debe tener una sola acción entre ${ACTION_KEYS.join(', ')}.`];

  const [action] = actions;
  const strayKeys = keys.filter((key) => SCREENSHOT_ONLY_KEYS.includes(key));
  if (action !== 'screenshot' && strayKeys.length > 0) {
    return [`${position}: ${strayKeys.join(', ')} solo se admite junto a screenshot.`];
  }
  return validateActionValue(action, step, position);
}

function validateLogin(login) {
  if (!isPlainObject(login)) return ['login debe ser un objeto.'];
  return LOGIN_FIELDS.filter((field) => !isNonEmptyString(login[field])).map(
    (field) => `login.${field} es obligatorio y debe ser un texto.`,
  );
}

function validateViewport(viewport) {
  const isValid = isPlainObject(viewport) && Number.isFinite(viewport.width) && Number.isFinite(viewport.height);
  return isValid ? [] : ['viewport debe tener width y height numéricos.'];
}

function validateUniqueScreenshotNames(steps) {
  const names = steps.filter((step) => isPlainObject(step) && typeof step.screenshot === 'string').map((step) => step.screenshot);
  const repeated = new Set(names.filter((name, index) => names.indexOf(name) !== index));
  return [...repeated].map((name) => `El nombre de captura "${name}" está repetido; cada screenshot debe tener un nombre único.`);
}

export function validateScript(script) {
  if (!isPlainObject(script)) return ['El guion debe ser un objeto JSON.'];
  const errors = [];
  if (!isNonEmptyString(script.baseUrl)) errors.push('baseUrl es obligatorio y debe ser un texto.');
  if ('viewport' in script) errors.push(...validateViewport(script.viewport));
  if ('login' in script) errors.push(...validateLogin(script.login));
  if (!Array.isArray(script.steps) || script.steps.length === 0) {
    errors.push('steps debe ser una lista con al menos un paso.');
  } else {
    errors.push(...script.steps.flatMap(validateStep), ...validateUniqueScreenshotNames(script.steps));
  }
  return errors;
}

function resolveLogin(login, env) {
  const missing = ['CAP_MANUAL_USER', 'CAP_MANUAL_PASSWORD'].filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`El guion usa login: define las variables de entorno ${missing.join(' y ')}.`);
  }
  return { ...login, user: env.CAP_MANUAL_USER, password: env.CAP_MANUAL_PASSWORD };
}

export function resolveScript(script, env) {
  const resolved = {
    baseUrl: env.CAP_MANUAL_BASE_URL || script.baseUrl,
    viewport: script.viewport ?? DEFAULT_VIEWPORT,
    steps: script.steps,
  };
  if (script.login) resolved.login = resolveLogin(script.login, env);
  return resolved;
}

async function performLogin(page, baseUrl, login) {
  await page.goto(new URL(login.url, baseUrl).href);
  await page.fill(login.userSelector, login.user);
  await page.fill(login.passwordSelector, login.password);
  await page.click(login.submitSelector);
  await page.waitForLoadState('networkidle');
}

async function performStep(page, step, context) {
  if ('goto' in step) return page.goto(new URL(step.goto, context.baseUrl).href);
  if ('click' in step) return page.click(step.click);
  if ('fill' in step) return page.fill(step.fill.selector, step.fill.value);
  if ('select' in step) return page.selectOption(step.select.selector, step.select.value);
  if ('wait' in step) return page.waitForTimeout(step.wait);
  const file = `${step.screenshot}.png`;
  await page.screenshot({ path: join(context.outputDirectory, file), fullPage: step.fullPage !== false });
  context.captures.push({ file, caption: step.caption ?? step.screenshot });
}

export async function runScript(resolved, outputDirectory, browserFactory) {
  mkdirSync(outputDirectory, { recursive: true });
  const captures = [];
  const browser = await browserFactory();
  try {
    const page = await browser.newPage({ viewport: resolved.viewport });
    if (resolved.login) await performLogin(page, resolved.baseUrl, resolved.login);
    for (const step of resolved.steps) {
      await performStep(page, step, { baseUrl: resolved.baseUrl, outputDirectory, captures });
    }
  } finally {
    await browser.close();
  }
  return captures;
}

export function capturesMarkdown(captures) {
  return captures.map(({ file, caption }) => `![${caption}](${IMAGES_FOLDER}/${file})`).join('\n');
}

const PLAYWRIGHT_MODULE = 'playwright';

async function loadChromium() {
  try {
    return (await import(/* @vite-ignore */ PLAYWRIGHT_MODULE)).chromium;
  } catch {
    exitWithErrors('No se encontró Playwright. Instálalo con: npm install --save-dev playwright && npx playwright install chromium');
  }
}

async function main(directory) {
  requireDirectoryArgument(directory, 'capture.mjs');

  let script;
  try {
    script = JSON.parse(readFileSync(join(directory, 'guion.json'), 'utf8'));
  } catch (error) {
    exitWithErrors(`No se pudo leer guion.json en ${directory}: ${error.message}`);
  }
  const errors = validateScript(script);
  if (errors.length > 0) exitWithErrors(errors);

  let resolved;
  try {
    resolved = resolveScript(script, process.env);
  } catch (error) {
    exitWithErrors(error.message);
  }

  const chromium = await loadChromium();
  const captures = await runScript(resolved, join(directory, IMAGES_FOLDER), () => chromium.launch());
  console.log(capturesMarkdown(captures));
}

await runAsMain(import.meta.url, main);
