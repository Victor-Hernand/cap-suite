export function readEnv(name: string): string | undefined {
  const value = typeof process !== 'undefined' ? process.env[name] : undefined;
  return value !== undefined && value !== '' ? value : undefined;
}
