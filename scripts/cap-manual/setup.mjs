#!/usr/bin/env node
import { createInterface } from 'node:readline';
import {
  createCapGestionClient,
  credentialsFilePath,
  DEFAULT_CAP_GESTION_URL,
  DRAFTS_PATH,
  exitWithErrors,
  explainRequestError,
  parseCliArguments,
  readStoredCredentials,
  resolveCapGestionCredentials,
  runAsMain,
  SETUP_HINT,
  writeStoredCredentials,
} from './lib.mjs';

const USAGE = 'Uso: node setup.mjs [--check]';
const EMPTY_TOKEN_MESSAGE = 'No escribiste ningún token: pídelo a tu administrador de CAP Gestión y vuelve a correr el comando.';

export function parseSetupArguments(args) {
  const { values, positionals } = parseCliArguments(args, { check: { type: 'boolean' } }, USAGE);
  if (positionals.length > 0) throw new Error(USAGE);
  return { check: Boolean(values.check) };
}

// CAP Gestión no tiene una ruta de "quién soy": consultar borradores de una rama inexistente
// solo prueba que el token entra (200) o no (401/403) sin tocar nada.
export async function verifyCredentials({ url, token, fetchImplementation = fetch }) {
  const client = createCapGestionClient({ url, token, fetchImplementation });
  try {
    await client.get(DRAFTS_PATH, { repository: 'cap-manual/setup', branch: 'cap-manual-setup' });
  } catch (error) {
    throw new Error(explainRequestError(error));
  }
}

function normalizeUrl(answer, fallback) {
  const url = answer.trim() || fallback;
  return url.replace(/\/+$/, '');
}

// Las respuestas se encolan por si llegan antes de la pregunta (entrada por tubería).
function createPrompter({ input, output }) {
  const terminal = Boolean(input.isTTY);
  const readlineInterface = createInterface({ input, output, terminal });
  const pendingLines = [];
  const waitingAskers = [];
  let closed = false;

  readlineInterface.on('line', (line) => (waitingAskers.length > 0 ? waitingAskers.shift()(line) : pendingLines.push(line)));
  readlineInterface.once('close', () => {
    closed = true;
    waitingAskers.splice(0).forEach((resolve) => resolve(''));
  });

  const nextLine = () => {
    if (pendingLines.length > 0) return Promise.resolve(pendingLines.shift());
    if (closed) return Promise.resolve('');
    return new Promise((resolve) => waitingAskers.push(resolve));
  };

  const ask = (prompt) => {
    readlineInterface.setPrompt(prompt);
    readlineInterface.prompt();
    return nextLine();
  };

  // En una terminal readline hace el eco de lo que se escribe: se silencia mientras se teclea el token.
  const askHidden = async (prompt) => {
    output.write(prompt);
    if (!terminal) return nextLine();
    readlineInterface.setPrompt('');
    const writeToOutput = readlineInterface._writeToOutput;
    readlineInterface._writeToOutput = () => {};
    try {
      return await nextLine();
    } finally {
      readlineInterface._writeToOutput = writeToOutput;
      output.write('\n');
    }
  };

  return { ask, askHidden, close: () => readlineInterface.close() };
}

async function askCredentials(prompter, stored) {
  const defaultUrl = stored.url || DEFAULT_CAP_GESTION_URL;
  const url = normalizeUrl(await prompter.ask(`URL de CAP Gestión [${defaultUrl}]: `), defaultUrl);
  const tokenPrompt = stored.token
    ? 'Token personal (Enter conserva el guardado; no se muestra al escribir): '
    : 'Token personal (no se muestra al escribir): ';
  const token = (await prompter.askHidden(tokenPrompt)).trim() || stored.token;
  if (!token) throw new Error(EMPTY_TOKEN_MESSAGE);
  return { url, token };
}

export async function runSetup({ env, input, output, fetchImplementation = fetch }) {
  const filePath = credentialsFilePath(env);
  const stored = readStoredCredentials(filePath) ?? {};
  output.write('Configuración de tu acceso a CAP Gestión (una vez por máquina, sirve para todos tus proyectos).\n');
  const prompter = createPrompter({ input, output });
  try {
    const credentials = await askCredentials(prompter, stored);
    output.write('Comprobando el acceso…\n');
    await verifyCredentials({ ...credentials, fetchImplementation });
    writeStoredCredentials(filePath, credentials);
    output.write(`✔ Conectado a CAP Gestión (${credentials.url}).\n`);
    output.write(`✔ Token guardado en ${filePath} (solo tu usuario puede leerlo).\n`);
  } finally {
    prompter.close();
  }
}

export async function runCheck({ env, output, fetchImplementation = fetch }) {
  const credentials = resolveCapGestionCredentials(env);
  output.write(`Token: ${credentials.source}\n`);
  try {
    await verifyCredentials({ ...credentials, fetchImplementation });
  } catch (error) {
    throw new Error(`${error.message} ${SETUP_HINT}`);
  }
  output.write(`✔ Conectado a CAP Gestión (${credentials.url}).\n`);
}

async function main(...args) {
  try {
    const { check } = parseSetupArguments(args);
    if (check) await runCheck({ env: process.env, output: process.stdout });
    else await runSetup({ env: process.env, input: process.stdin, output: process.stdout });
  } catch (error) {
    exitWithErrors(error.message);
  }
}

await runAsMain(import.meta.url, main);
