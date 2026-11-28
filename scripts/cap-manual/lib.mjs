import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const MANUAL_FILE_NAME = 'manual.md';
export const IMAGES_FOLDER = 'capturas';

export const IMAGE_MIME_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const IMAGE_EXTENSIONS = Object.keys(IMAGE_MIME_TYPES);

export const MANUAL_RULES = {
  slug: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  image: new RegExp(`^[a-z0-9._-]+\\.(${IMAGE_EXTENSIONS.join('|')})$`),
  maxManualBytes: 1048576,
  maxImageBytes: 2097152,
  maxImages: 40,
  types: ['module', 'system'],
};

const IMAGE_EXTENSION_SUFFIX = new RegExp(`\\.(${IMAGE_EXTENSIONS.join('|')})$`);
const IMAGE_STEM = /^[a-z0-9._-]+$/;
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*([^)\s]+)[^)]*\)/g;
const FRONTMATTER_DELIMITER = '---';
const UNRESOLVED_PLACEHOLDER = /\{\{[^}]+\}\}/;

export function exitWithErrors(errors) {
  [errors].flat().forEach((line) => console.error(line));
  process.exit(1);
}

export function parseCliArguments(args, options, usage) {
  try {
    return parseArgs({ args, options, allowPositionals: true, strict: true });
  } catch {
    throw new Error(usage);
  }
}

export function requireDirectoryArgument(directory, scriptName) {
  if (!directory) exitWithErrors(`Uso: node ${scriptName} <carpeta-del-manual>`);
}

function isEntryPoint(importMetaUrl) {
  return Boolean(process.argv[1]) && importMetaUrl === pathToFileURL(realpathSync(process.argv[1])).href;
}

export async function runAsMain(importMetaUrl, main) {
  if (isEntryPoint(importMetaUrl)) await main(...process.argv.slice(2));
}

export function hasImageExtension(name) {
  return IMAGE_EXTENSION_SUFFIX.test(name);
}

export function isValidImageStem(name) {
  return IMAGE_STEM.test(name);
}

function stripQuotes(value) {
  return value.replace(/^(["'])(.*)\1$/, '$2');
}

function parseFrontmatterLine(line) {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex === -1) return null;
  return [line.slice(0, separatorIndex).trim(), stripQuotes(line.slice(separatorIndex + 1).trim())];
}

export function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0].trim() !== FRONTMATTER_DELIMITER) {
    throw new Error('El manual debe empezar con un bloque frontmatter delimitado por ---.');
  }
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === FRONTMATTER_DELIMITER);
  if (closingIndex === -1) {
    throw new Error('El bloque frontmatter del manual no está cerrado con ---.');
  }
  const data = Object.fromEntries(lines.slice(1, closingIndex).map(parseFrontmatterLine).filter(Boolean));
  return { data, body: lines.slice(closingIndex + 1).join('\n') };
}

function allImageTargets(body) {
  return [...body.matchAll(MARKDOWN_IMAGE)].map((match) => match[1]);
}

export function referencedImages(body) {
  return allImageTargets(body).filter((target) => target.startsWith(`${IMAGES_FOLDER}/`));
}

export function readManual(directory) {
  const path = join(directory, MANUAL_FILE_NAME);
  if (!existsSync(path)) throw new Error(`No existe ${MANUAL_FILE_NAME} en ${directory}.`);
  const text = readFileSync(path, 'utf8');
  return { path, text, ...parseFrontmatter(text) };
}

function validateFrontmatterFields(data) {
  const errors = [];
  if (!data.title) errors.push(`El campo title del frontmatter de ${MANUAL_FILE_NAME} es obligatorio.`);
  if (!data.system) errors.push(`El campo system del frontmatter de ${MANUAL_FILE_NAME} es obligatorio.`);
  if (!MANUAL_RULES.types.includes(data.type)) {
    errors.push(`El campo type del frontmatter de ${MANUAL_FILE_NAME} debe ser uno de: ${MANUAL_RULES.types.join(', ')}.`);
  }
  return errors;
}

function validateUnresolvedPlaceholder(text) {
  const placeholder = text.match(UNRESOLVED_PLACEHOLDER)?.[0];
  if (!placeholder) return [];
  return [`${MANUAL_FILE_NAME} todavía contiene un placeholder sin resolver (${placeholder}): reemplázalo por su valor real, por ejemplo el nombre de la empresa de tokens.json › company.`];
}

function validateImageReferences(body, imagesDirectory) {
  const errors = [];
  for (const target of allImageTargets(body)) {
    if (!target.startsWith(`${IMAGES_FOLDER}/`)) {
      errors.push(`La imagen ${target} debe referenciarse como ${IMAGES_FOLDER}/<archivo>.`);
      continue;
    }
    const fileName = target.slice(IMAGES_FOLDER.length + 1);
    if (!MANUAL_RULES.image.test(fileName)) {
      errors.push(`El nombre de imagen ${fileName} no es válido: usa minúsculas, números, punto, guion y extensión png, jpg, jpeg o webp.`);
    } else if (!existsSync(join(imagesDirectory, fileName))) {
      errors.push(`La imagen referenciada ${target} no existe en la carpeta ${IMAGES_FOLDER}.`);
    }
  }
  return errors;
}

function validateImageFiles(imagesDirectory) {
  if (!existsSync(imagesDirectory)) return [];
  const fileNames = readdirSync(imagesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && MANUAL_RULES.image.test(entry.name))
    .map((entry) => entry.name);
  const errors = [];
  if (fileNames.length > MANUAL_RULES.maxImages) {
    errors.push(`La carpeta ${IMAGES_FOLDER} tiene ${fileNames.length} imágenes; el máximo es ${MANUAL_RULES.maxImages}.`);
  }
  for (const fileName of fileNames) {
    if (statSync(join(imagesDirectory, fileName)).size > MANUAL_RULES.maxImageBytes) {
      errors.push(`La imagen ${IMAGES_FOLDER}/${fileName} supera el máximo de 2 MB.`);
    }
  }
  return errors;
}

export function validateManualDirectory(directory) {
  const errors = [];
  const slug = basename(directory);
  if (!MANUAL_RULES.slug.test(slug)) {
    errors.push(`El slug "${slug}" (nombre de la carpeta) no es válido: usa minúsculas, números y guiones simples.`);
  }

  let manual;
  try {
    manual = readManual(directory);
  } catch (error) {
    return [...errors, error.message];
  }
  if (statSync(manual.path).size > MANUAL_RULES.maxManualBytes) {
    errors.push(`${MANUAL_FILE_NAME} supera el máximo de 1 MB.`);
  }

  const imagesDirectory = join(directory, IMAGES_FOLDER);
  return [
    ...errors,
    ...validateFrontmatterFields(manual.data),
    ...validateUnresolvedPlaceholder(manual.text),
    ...validateImageReferences(manual.body, imagesDirectory),
    ...validateImageFiles(imagesDirectory),
  ];
}

const CHANGE_TYPES = ['fix', 'mejora', 'modulo', 'sistema'];
const CHANGE_TYPE_LINE = /^[ \t]*\**Tipo\**[ \t]*:\**[ \t]*(.+)$/im;

export function changeTypeFromPullRequestBody(body) {
  const declaredValue = body.match(CHANGE_TYPE_LINE)?.[1];
  if (!declaredValue) return null;
  const firstWord = declaredValue
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .split(/\s+/)[0];
  return CHANGE_TYPES.includes(firstWord) ? firstWord : null;
}

export function requireEnvironment(env, names, hint = '') {
  const missing = names.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}.${hint ? ` ${hint}` : ''}`);
  }
  return Object.fromEntries(names.map((name) => [name, env[name]]));
}

export const DEFAULT_CAP_GESTION_URL = 'https://gestion.capgrupo.com';
const SETUP_COMMAND = 'node scripts/cap-manual/setup.mjs';
export const SETUP_HINT = `Corre ${SETUP_COMMAND} y pega el token que te dio tu administrador de CAP Gestión.`;

export function credentialsFilePath(env) {
  const configHome = env.XDG_CONFIG_HOME || join(env.HOME || homedir(), '.config');
  return join(configHome, 'cap-gestion', 'credentials.json');
}

export function readStoredCredentials(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    const { url, token } = JSON.parse(readFileSync(filePath, 'utf8'));
    return { url, token };
  } catch {
    throw new Error(`No pude leer ${filePath}: vuelve a correr ${SETUP_COMMAND}.`);
  }
}

// Solo el dueño puede leer el archivo: guarda su token personal.
export function writeStoredCredentials(filePath, { url, token }) {
  mkdirSync(dirname(filePath), { recursive: true, mode: 0o700 });
  writeFileSync(filePath, `${JSON.stringify({ url, token }, null, 2)}\n`, { mode: 0o600 });
}

// Las variables de entorno mandan (CI y quien ya las tenga); si no, el archivo de setup.mjs.
// `source` describe de dónde salió el token, para mostrarlo al usuario.
export function resolveCapGestionCredentials(env) {
  const filePath = credentialsFilePath(env);
  const stored = readStoredCredentials(filePath) ?? {};
  const token = env.CAP_GESTION_TOKEN || stored.token;
  if (!token) throw new Error(`No hay un token de CAP Gestión configurado en esta máquina. ${SETUP_HINT}`);
  return {
    url: env.CAP_GESTION_URL || stored.url || DEFAULT_CAP_GESTION_URL,
    token,
    source: env.CAP_GESTION_TOKEN ? 'variable de entorno CAP_GESTION_TOKEN' : filePath,
  };
}

export const DRAFTS_PATH = '/api/entregas/borradores';
export const PUBLISH_PATH = '/api/entregas/publicar';
export const DISCARD_PATH = '/api/entregas/descartar';

export class CapGestionError extends Error {
  constructor(status, body) {
    super(`CAP Gestión respondió HTTP ${status}: ${body}`);
    this.name = 'CapGestionError';
    this.status = status;
  }
}

export function explainRequestError(error) {
  if (error instanceof CapGestionError && error.status === 401) {
    return 'CAP Gestión rechazó tu token (HTTP 401): no es válido, fue revocado o tu usuario está desactivado; pide uno nuevo a un administrador de CAP Gestión.';
  }
  if (error instanceof CapGestionError && error.status === 403) {
    return 'CAP Gestión respondió HTTP 403: tu usuario no tiene acceso a Entregas; pídelo a un administrador.';
  }
  return error.message;
}

function parseJsonBody(body) {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('CAP Gestión respondió algo que no es JSON: revisa CAP_GESTION_URL.');
  }
}

async function readJsonResponse(response) {
  const body = await response.text();
  if (!response.ok) throw new CapGestionError(response.status, body);
  return body === '' ? null : parseJsonBody(body);
}

async function fetchOrExplain(fetchImplementation, baseUrl, path, init) {
  try {
    return await fetchImplementation(`${baseUrl}${path}`, init);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    throw new Error(`No se pudo conectar con CAP Gestión en ${baseUrl}: revisa CAP_GESTION_URL.`);
  }
}

export function createCapGestionClient({ url, token, fetchImplementation = fetch }) {
  const baseUrl = url.replace(/\/+$/, '');
  const baseHeaders = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const send = async (path, init) => readJsonResponse(await fetchOrExplain(fetchImplementation, baseUrl, path, init));

  return {
    get: (path, query = {}) => {
      const queryString = new URLSearchParams(query).toString();
      return send(queryString ? `${path}?${queryString}` : path, { method: 'GET', headers: baseHeaders });
    },
    postJson: (path, body) => send(path, {
      method: 'POST',
      headers: { ...baseHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    postForm: (path, form) => send(path, { method: 'POST', headers: baseHeaders, body: form }),
  };
}

function runGitCommand(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function repositoryFromRemoteUrl(remoteUrl) {
  const pathPart = remoteUrl.trim().replace(/^[a-z+]+:\/\/[^/]+\//i, '').replace(/^[^@\s]+@[^:\s]+:/, '');
  const parts = pathPart.replace(/\/+$/, '').replace(/\.git$/, '').split('/');
  if (parts.length < 2 || parts.some((part) => part === '' || /\s/.test(part))) return null;
  return parts.slice(-2).join('/');
}

function readOriginUrl(directory) {
  try {
    return runGitCommand(['remote', 'get-url', 'origin'], directory);
  } catch {
    throw new Error('El repositorio no tiene un remoto "origin": agrégalo con git remote add origin <url>.');
  }
}

function requireGitRepository(directory) {
  try {
    runGitCommand(['rev-parse', '--is-inside-work-tree'], directory);
  } catch {
    throw new Error(`La carpeta ${directory} no está dentro de un repositorio git: corre el comando desde el repositorio del proyecto.`);
  }
}

export function readGitContext(directory) {
  requireGitRepository(directory);
  const remoteUrl = readOriginUrl(directory);
  const repository = repositoryFromRemoteUrl(remoteUrl);
  if (!repository) {
    throw new Error(`No se entiende la URL del remoto "origin" (${remoteUrl}): se esperaba owner/repo.`);
  }
  return {
    repository,
    branch: runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'], directory),
    commitSha: runGitCommand(['rev-parse', 'HEAD'], directory),
  };
}

export function hasUncommittedChanges(directory, fileName) {
  return runGitCommand(['status', '--porcelain', '--', fileName], directory) !== '';
}

function fileFromDisk(path, type) {
  return new File([readFileSync(path)], basename(path), { type });
}

export function buildManualForm(directory, fields) {
  const { path: manualPath, body } = readManual(directory);
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (typeof value === 'string' && value !== '') form.append(name, value);
  }
  form.append('manual', fileFromDisk(manualPath, 'text/markdown'));
  for (const imagePath of new Set(referencedImages(body))) {
    form.append('images[]', fileFromDisk(join(directory, imagePath), IMAGE_MIME_TYPES[extname(imagePath).slice(1)]));
  }
  return form;
}
