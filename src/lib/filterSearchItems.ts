import type { SearchItem } from '../data/types';

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function filterSearchItems(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const text = normalizeText(query.trim());
  if (!text) return items.slice(0, limit);
  return items
    .filter((item) => normalizeText(`${item.name} ${item.description} ${item.section}`).includes(text))
    .slice(0, limit);
}
