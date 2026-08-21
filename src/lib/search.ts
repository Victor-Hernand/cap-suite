import type { SearchItem } from '../data/types';
import { type Db, listApps, listResources, listContacts, listCompanies } from './db';

export function buildSearchItems(db: Db): SearchItem[] {
  return [
    ...listApps(db).map((app) => ({
      id: `app-${app.id}`,
      name: app.name,
      description: app.description,
      url: app.url,
      section: 'Aplicaciones',
    })),
    ...listResources(db).map((resource) => ({
      id: `resource-${resource.id}`,
      name: resource.name,
      description: resource.description,
      url: resource.url ?? `/files/${resource.filePath}`,
      section: 'Recursos',
    })),
    ...listContacts(db).map((contact) => ({
      id: `contact-${contact.email}`,
      name: contact.name,
      description: `${contact.role} · ${contact.department}`,
      url: `mailto:${contact.email}`,
      section: 'Contactos',
    })),
    ...listCompanies(db).map((company) => ({
      id: `company-${company.slug}`,
      name: company.name,
      description: company.segment,
      url: '/empresas',
      section: 'Empresas',
    })),
  ];
}
