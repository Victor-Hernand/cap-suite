import type { SearchItem } from '../data/types';

export function filterSearchItems(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const text = query.trim().toLowerCase();
  if (!text) return items.slice(0, limit);
  return items
    .filter((item) => `${item.name} ${item.description} ${item.section}`.toLowerCase().includes(text))
    .slice(0, limit);
}
