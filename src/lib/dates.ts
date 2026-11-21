export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** "v2.1 · 02/06/2026", sin las partes que falten. */
export function formatVersionLine(version: string | null, effectiveDate: string | null): string {
  return [version, formatDate(effectiveDate)].filter(Boolean).join(' · ');
}

/** Fecha de hoy como YYYY-MM-DD en la zona horaria local (toISOString usaría UTC). */
export function todayIsoDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}
