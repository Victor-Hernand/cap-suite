import type { AppCategory, ResourceType } from './types';

export const appCategories: { id: AppCategory; label: string }[] = [
  { id: 'erp', label: 'ERP FastBI' },
  { id: 'microsoft365', label: 'Microsoft 365' },
  { id: 'portals', label: 'Portales' },
  { id: 'tools', label: 'Operación y Soporte' },
  { id: 'talent', label: 'Talento Humano' },
  { id: 'marketing', label: 'Marketing y Clientes' },
];

export const resourceTypes: { id: ResourceType; label: string; badge: string; icon: string }[] = [
  { id: 'manual', label: 'Manuales', badge: 'Manual', icon: 'book-open-outline' },
  { id: 'template', label: 'Plantillas', badge: 'Plantilla', icon: 'file-document-outline' },
  { id: 'folder', label: 'Carpetas compartidas', badge: 'Carpeta', icon: 'folder-outline' },
  { id: 'link', label: 'Enlaces', badge: 'Enlace', icon: 'link-variant' },
];
