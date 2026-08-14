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
  collaboratorsLabel: '500+',
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
      id: `app-${app.id}`,
      name: app.name,
      description: app.description,
      url: app.url,
      section: 'Aplicaciones',
    })),
    ...resources.map((resource) => ({
      id: `resource-${resource.id}`,
      name: resource.name,
      description: resource.description,
      url: resource.url,
      section: 'Recursos',
    })),
    ...contacts.map((contact) => ({
      id: `contact-${contact.email}`,
      name: contact.name,
      description: `${contact.role} · ${contact.department}`,
      url: `mailto:${contact.email}`,
      section: 'Contactos',
    })),
    ...companies.map((company) => ({
      id: `company-${company.id}`,
      name: company.name,
      description: company.segment,
      url: '/empresas',
      section: 'Empresas',
    })),
  ];
}
