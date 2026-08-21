export function readEnv(name: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  if (fromProcess !== undefined && fromProcess !== '') return fromProcess;
  const meta = import.meta as { env?: Record<string, string | undefined> };
  const fromVite = meta.env?.[name];
  return fromVite !== '' ? fromVite : undefined;
}
