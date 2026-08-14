import type { Resource, ResourceType } from './types';

export const resourceTypes: { id: ResourceType; label: string }[] = [
  { id: 'manual', label: 'Manuales' },
  { id: 'template', label: 'Plantillas' },
  { id: 'folder', label: 'Carpetas Compartidas' },
  { id: 'link', label: 'Enlaces' },
];

export const resourceStyles: Record<ResourceType, { icon: string; tile: string }> = {
  manual: { icon: '📘', tile: 'bg-sky-500/10 text-sky-800' },
  template: { icon: '📝', tile: 'bg-indigo-500/10 text-indigo-700' },
  folder: { icon: '📁', tile: 'bg-amber-500/10 text-electric' },
  link: { icon: '🔗', tile: 'bg-teal-500/10 text-accent' },
};

export const resources: Resource[] = [
  {
    id: 'manual-erp',
    name: 'Manual del ERP',
    description: 'Guía de uso del sistema de facturación.',
    url: 'https://cap365.sharepoint.com/manuales/erp',
    type: 'manual',
  },
  {
    id: 'manual-induccion',
    name: 'Manual de Inducción',
    description: 'Bienvenida y políticas para personal nuevo.',
    url: 'https://cap365.sharepoint.com/manuales/induccion',
    type: 'manual',
  },
  {
    id: 'plantilla-memo',
    name: 'Plantilla de Memorándum',
    description: 'Formato oficial para comunicados internos.',
    url: 'https://cap365.sharepoint.com/plantillas/memo',
    type: 'template',
  },
  {
    id: 'plantilla-presentacion',
    name: 'Plantilla de Presentación',
    description: 'PowerPoint con la identidad del grupo.',
    url: 'https://cap365.sharepoint.com/plantillas/ppt',
    type: 'template',
  },
  {
    id: 'carpeta-gerencia',
    name: 'Carpeta de Gerencia',
    description: 'Documentos compartidos de gerencia general.',
    url: 'https://cap365.sharepoint.com/gerencia',
    type: 'folder',
  },
  {
    id: 'directorio-proveedores',
    name: 'Directorio de Proveedores',
    description: 'Listado maestro de proveedores del grupo.',
    url: 'https://cap365.sharepoint.com/proveedores',
    type: 'link',
  },
];
