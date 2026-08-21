export function logoSrc(logoPath: string | null): string | undefined {
  if (!logoPath) return undefined;
  if (logoPath.startsWith('http')) return logoPath;
  return `/files/${logoPath}`;
}
