import type { SearchItem } from '../data/types';
import { labelOf, policyTypes } from '../data/policies';
import { listVisiblePolicies } from './policies';
import { listDepartments } from './departments';
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
    ...listVisiblePolicies(db).map((policy) => ({
      id: `policy-${policy.id}`,
      name: policy.title,
      description: `${labelOf(policyTypes, policy.type)} · ${policy.department}`,
      url: `/politicas/${policy.slug}`,
      section: 'Políticas',
    })),
    ...listDepartments(db).map((department) => ({
      id: `department-${department.slug}`,
      name: department.name,
      description: 'Departamento',
      url: `/departamentos/${department.slug}`,
      section: 'Departamentos',
    })),
  ];
}
