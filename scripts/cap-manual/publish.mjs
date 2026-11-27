#!/usr/bin/env node
import {
  createCapGestionClient,
  DEFAULT_CAP_GESTION_URL,
  DISCARD_PATH,
  DRAFTS_PATH,
  exitWithErrors,
  explainRequestError,
  parseCliArguments,
  PUBLISH_PATH,
  requireEnvironment,
  runAsMain,
} from './lib.mjs';

const USAGE = 'Uso: node publish.mjs --check --branch <rama> | --merged [--branch <rama>] [--commits <sha,…>] [--merge-sha <sha>] | --closed --branch <rama>';
const REQUIRED_VARIABLES = ['GITHUB_REPOSITORY', 'CAP_GESTION_TOKEN'];

const OPTIONS = {
  check: { type: 'boolean' },
  merged: { type: 'boolean' },
  closed: { type: 'boolean' },
  branch: { type: 'string' },
  commits: { type: 'string' },
  'merge-sha': { type: 'string' },
};

function splitCommits(commits) {
  return commits.split(',').map((sha) => sha.trim()).filter((sha) => sha !== '');
}

export function parsePublishArguments(args) {
  const { values, positionals } = parseCliArguments(args, OPTIONS, USAGE);
  if (positionals.length > 0) throw new Error(USAGE);
  const modes = ['check', 'merged', 'closed'].filter((mode) => values[mode]);
  if (modes.length !== 1) throw new Error(USAGE);

  const [mode] = modes;
  const { branch, commits, 'merge-sha': mergeSha } = values;
  if (mode !== 'merged' && branch === undefined) throw new Error(USAGE);
  if (mode === 'merged' && branch === undefined && commits === undefined) throw new Error(USAGE);
  return { mode, branch, commits: splitCommits(commits ?? ''), mergeSha };
}

export async function checkDrafts({ client, repository, branch }) {
  const { drafts } = await client.get(DRAFTS_PATH, { repository, branch });
  return drafts;
}

export async function publishMerged({ client, repository, branch, commits, mergeSha }) {
  if (branch === undefined && commits.length === 0) return [];
  const body = { repository };
  if (branch !== undefined) body.branch = branch;
  if (commits.length > 0) body.commits = commits;
  if (mergeSha !== undefined) body.merge_sha = mergeSha;
  const { published } = await client.postJson(PUBLISH_PATH, body);
  return published;
}

export async function discardBranch({ client, repository, branch }) {
  const { discarded } = await client.postJson(DISCARD_PATH, { repository, branch });
  return discarded;
}

async function runCheck(options) {
  const drafts = await checkDrafts(options);
  if (drafts.length === 0) {
    throw new Error(`Este PR es de tipo módulo o sistema y CAP Gestión no tiene un borrador de la rama ${options.branch}: corre /cap-manual y vuelve a intentar.`);
  }
  console.log(`CAP Gestión tiene ${drafts.length} borrador(es) de la rama ${options.branch}:`);
  drafts.forEach((draft) => console.log(`- ${draft.title} (${draft.author_name}): ${draft.url}`));
}

async function runMerged(options) {
  const published = await publishMerged(options);
  if (published.length === 0) {
    console.log('Ningún borrador de CAP Gestión coincide con la rama o los commits: nada que publicar.');
    return;
  }
  published.forEach((delivery) => console.log(`Publicado en CAP Gestión: ${delivery.slug} → ${delivery.url}`));
}

async function runClosed(options) {
  const discarded = await discardBranch(options);
  console.log(`Borradores descartados de la rama ${options.branch}: ${discarded}`);
}

const MODE_RUNNERS = { check: runCheck, merged: runMerged, closed: runClosed };

// El secret CAP_GESTION_URL es opcional: sin él se usa la URL de CAP Gestión de la empresa.
export function readPublishEnvironment(env) {
  const environment = requireEnvironment(env, REQUIRED_VARIABLES);
  return { repository: environment.GITHUB_REPOSITORY, url: env.CAP_GESTION_URL || DEFAULT_CAP_GESTION_URL, token: environment.CAP_GESTION_TOKEN };
}

async function main(...args) {
  try {
    const { mode, ...options } = parsePublishArguments(args);
    const { repository, url, token } = readPublishEnvironment(process.env);
    const client = createCapGestionClient({ url, token });
    await MODE_RUNNERS[mode]({ client, repository, ...options });
  } catch (error) {
    exitWithErrors(explainRequestError(error));
  }
}

await runAsMain(import.meta.url, main);
