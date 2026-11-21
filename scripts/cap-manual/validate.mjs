#!/usr/bin/env node
import { exitWithErrors, requireDirectoryArgument, runAsMain, validateManualDirectory } from './lib.mjs';

function main(directory) {
  requireDirectoryArgument(directory, 'validate.mjs');
  const errors = validateManualDirectory(directory);
  if (errors.length > 0) exitWithErrors(errors);
  console.log(`OK: el manual en ${directory} es válido.`);
}

await runAsMain(import.meta.url, main);
