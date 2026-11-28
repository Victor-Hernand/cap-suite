#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  buildManualForm,
  createCapGestionClient,
  DRAFTS_PATH,
  exitWithErrors,
  explainRequestError,
  hasUncommittedChanges,
  parseCliArguments,
  readGitContext,
  resolveCapGestionCredentials,
  runAsMain,
  validateManualDirectory,
} from './lib.mjs';

const USAGE = 'Uso: node draft.mjs <carpeta-del-manual> [--pr <url-del-pr>]';
const SCRIPT_FILE_NAME = 'guion.json';

export function parseDraftArguments(args) {
  const parsed = parseCliArguments(args, { pr: { type: 'string' } }, USAGE);
  const { pr: pullRequestUrl } = parsed.values;
  const [directory, ...extraPositionals] = parsed.positionals;
  if (!directory || extraPositionals.length > 0) throw new Error(USAGE);
  if (pullRequestUrl !== undefined && !pullRequestUrl.startsWith('https://')) throw new Error(USAGE);
  return { directory, pullRequestUrl };
}

export function assertDraftAllowed({ branch, hasScript, scriptHasUncommittedChanges }) {
  if (branch === 'main') {
    throw new Error('No se envía un borrador desde main: crea una rama para el módulo y vuelve a correr el comando.');
  }
  if (branch === 'HEAD') {
    throw new Error('No estás en ninguna rama (HEAD separado): cámbiate a la rama del módulo y vuelve a correr el comando.');
  }
  if (!hasScript) {
    throw new Error(`Falta ${SCRIPT_FILE_NAME} en la carpeta del manual: el repositorio lo guarda para regenerar las capturas.`);
  }
  if (scriptHasUncommittedChanges) {
    throw new Error(`${SCRIPT_FILE_NAME} tiene cambios sin commit: haz commit de ${SCRIPT_FILE_NAME} y vuelve a correr el comando.`);
  }
}

export async function sendDraft({ directory, client, git: { repository, branch, commitSha }, pullRequestUrl }) {
  const errors = validateManualDirectory(directory);
  if (errors.length > 0) throw new Error(errors.join('\n'));
  const form = buildManualForm(directory, {
    repository,
    slug: basename(directory),
    branch,
    commit_sha: commitSha,
    pull_request_url: pullRequestUrl,
  });
  return client.postForm(DRAFTS_PATH, form);
}

function requireManualDirectory(directory) {
  if (!existsSync(directory)) throw new Error(`No existe la carpeta del manual: ${directory}`);
}

async function main(...args) {
  try {
    const { directory, pullRequestUrl } = parseDraftArguments(args);
    const credentials = resolveCapGestionCredentials(process.env);
    requireManualDirectory(directory);
    const git = readGitContext(directory);
    assertDraftAllowed({
      branch: git.branch,
      hasScript: existsSync(join(directory, SCRIPT_FILE_NAME)),
      scriptHasUncommittedChanges: hasUncommittedChanges(directory, SCRIPT_FILE_NAME),
    });
    const client = createCapGestionClient(credentials);
    const draft = await sendDraft({ directory, client, git, pullRequestUrl });
    console.log(`Borrador enviado a CAP Gestión: ${draft.url}`);
  } catch (error) {
    exitWithErrors(explainRequestError(error));
  }
}

await runAsMain(import.meta.url, main);
