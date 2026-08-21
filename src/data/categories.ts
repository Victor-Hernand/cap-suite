import type { AppCategory, ResourceType } from './types';

export const appCategories: { id: AppCategory; label: string }[] = [
  { id: 'erp', label: 'ERP FastBI' },
  { id: 'microsoft365', label: 'Microsoft 365' },
  { id: 'portals', label: 'Portales' },
  { id: 'tools', label: 'Operación y Soporte' },
  { id: 'talent', label: 'Talento Humano' },
  { id: 'marketing', label: 'Marketing y Clientes' },
];

export const resourceTypes: { id: ResourceType; label: string; badge: string }[] = [
  { id: 'manual', label: 'Manuales', badge: 'MANUAL' },
  { id: 'template', label: 'Plantillas', badge: 'PLANTILLA' },
  { id: 'folder', label: 'Carpetas compartidas', badge: 'CARPETA' },
  { id: 'link', label: 'Enlaces', badge: 'ENLACE' },
];
