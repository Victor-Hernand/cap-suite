import type { AppCategory } from './types';

export const appCategories: { id: AppCategory; label: string }[] = [
  { id: 'erp', label: 'ERP FastBI' },
  { id: 'microsoft365', label: 'Microsoft 365' },
  { id: 'portals', label: 'Portales' },
  { id: 'tools', label: 'Operación y Soporte' },
  { id: 'talent', label: 'Talento Humano' },
  { id: 'marketing', label: 'Marketing y Clientes' },
];

export const categoryStyles: Record<AppCategory, { tile: string }> = {
  erp: { tile: 'bg-amber-500/10 text-electric' },
  microsoft365: { tile: 'bg-sky-500/10 text-sky-800' },
  portals: { tile: 'bg-teal-500/10 text-accent' },
  tools: { tile: 'bg-indigo-500/10 text-indigo-700' },
  talent: { tile: 'bg-rose-500/10 text-rose-700' },
  marketing: { tile: 'bg-fuchsia-500/10 text-fuchsia-700' },
};
