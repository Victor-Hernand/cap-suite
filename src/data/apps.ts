import type { AppCategory, AppLink } from './types';

export const appCategories: { id: AppCategory; label: string }[] = [
  { id: 'erp', label: 'ERP y Finanzas' },
  { id: 'microsoft365', label: 'Microsoft 365' },
  { id: 'portals', label: 'Portales Internos' },
  { id: 'tools', label: 'Herramientas' },
];

export const categoryStyles: Record<AppCategory, { tile: string }> = {
  erp: { tile: 'bg-amber-500/10 text-electric' },
  microsoft365: { tile: 'bg-sky-500/10 text-sky-800' },
  portals: { tile: 'bg-teal-500/10 text-accent' },
  tools: { tile: 'bg-indigo-500/10 text-indigo-700' },
};

export const apps: AppLink[] = [
  {
    id: 'erp-cap',
    name: 'ERP Corporativo',
    description: 'Sistema de facturación y administración del grupo.',
    url: 'https://erp.cap.hn',
    category: 'erp',
    featured: true,
  },
  {
    id: 'invoice-ninja',
    name: 'Invoice Ninja',
    description: 'Facturación y cotizaciones.',
    url: 'https://facturacion.cap.hn',
    category: 'erp',
    featured: false,
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Correo corporativo del grupo.',
    url: 'https://outlook.office.com',
    category: 'microsoft365',
    featured: true,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Chat, reuniones y llamadas internas.',
    url: 'https://teams.microsoft.com',
    category: 'microsoft365',
    featured: true,
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    description: 'Documentos y sitios compartidos por empresa.',
    url: 'https://cap365.sharepoint.com',
    category: 'microsoft365',
    featured: false,
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Archivos personales en la nube.',
    url: 'https://onedrive.live.com',
    category: 'microsoft365',
    featured: false,
  },
  {
    id: 'portal-rrhh',
    name: 'Portal RRHH',
    description: 'Vacaciones, permisos y planilla.',
    url: 'https://rrhh.cap.hn',
    category: 'portals',
    featured: true,
  },
  {
    id: 'portal-b2b',
    name: 'Portal B2B',
    description: 'Pedidos mayoristas de Inversiones S&M.',
    url: 'https://b2b.cap.hn',
    category: 'portals',
    featured: false,
    company: 'Inversiones S&M',
  },
  {
    id: 'asistencia',
    name: 'Control de Asistencia',
    description: 'Marcaje y reportes de asistencia facial.',
    url: 'https://asistencia.cap.hn',
    category: 'tools',
    featured: false,
  },
  {
    id: 'mesa-ayuda',
    name: 'Mesa de Ayuda TI',
    description: 'Tickets de soporte tecnológico.',
    url: 'https://soporte.cap.hn',
    category: 'tools',
    featured: true,
  },
];
