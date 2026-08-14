import type { SearchItem } from './types';
import { apps } from './apps';
import { resources } from './resources';
import { contacts } from './contacts';
import { companies } from './companies';

export const siteConfig = {
  name: 'CAP Suite',
  tagline: 'Todos los sistemas del grupo, en un solo lugar',
  heroDescription:
    'El punto de acceso unificado de Grupo Empresarial CAP: sistemas, materiales, contactos y las empresas que forman el grupo.',
  nav: [
    { label: 'Inicio', href: '/' },
    { label: 'Aplicaciones', href: '/apps' },
    { label: 'Recursos', href: '/recursos' },
    { label: 'Contactos', href: '/contactos' },
    { label: 'Empresas', href: '/empresas' },
  ],
  footerNote: 'Portal interno de Grupo Empresarial CAP · Tegucigalpa, Honduras',
};

export function buildSearchItems(): SearchItem[] {
  return [
    ...apps.map((app) => ({
      name: app.name,
      description: app.description,
      url: app.url,
      section: 'Aplicaciones',
    })),
    ...resources.map((resource) => ({
      name: resource.name,
      description: resource.description,
      url: resource.url,
      section: 'Recursos',
    })),
    ...contacts.map((contact) => ({
      name: contact.name,
      description: `${contact.role} · ${contact.department}`,
      url: `mailto:${contact.email}`,
      section: 'Contactos',
    })),
    ...companies.map((company) => ({
      name: company.name,
      description: company.segment,
      url: '/empresas',
      section: 'Empresas',
    })),
  ];
}
