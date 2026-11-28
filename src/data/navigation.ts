import type { counts } from '../lib/db';

export type NavItem = { label: string; href: string; icon: string; count?: number };
export type NavGroup = { label: string; items: NavItem[] };
export type Counts = ReturnType<typeof counts>;
export type ShellUser = { name: string; caption: string; logoutAction: string };
export type PortalLink = { label: string; href: string };

const EXACT_MATCH_HREFS = new Set(['/', '/admin']);
const MOBILE_DESTINATION_LIMIT = 4;
const OUTLINE_SUFFIX = '-outline';

export const publicNavigation: NavGroup[] = [
  {
    label: 'Portal',
    items: [
      { label: 'Inicio', href: '/', icon: 'home-outline' },
      { label: 'Aplicaciones', href: '/apps', icon: 'apps' },
      { label: 'Recursos', href: '/recursos', icon: 'folder-outline' },
      { label: 'Políticas', href: '/politicas', icon: 'file-document-outline' },
      { label: 'Departamentos', href: '/departamentos', icon: 'office-building-outline' },
    ],
  },
  {
    label: 'Directorio',
    items: [
      { label: 'Contactos', href: '/contactos', icon: 'account-box-outline' },
      { label: 'Empresas', href: '/empresas', icon: 'domain' },
    ],
  },
];

export function buildAdminNavigation(totals: Counts): NavGroup[] {
  return [
    {
      label: 'General',
      items: [{ label: 'Panel', href: '/admin', icon: 'view-dashboard-outline' }],
    },
    {
      label: 'Contenido',
      items: [
        { label: 'Aplicaciones', href: '/admin/apps', icon: 'apps', count: totals.apps },
        { label: 'Recursos', href: '/admin/recursos', icon: 'folder-outline', count: totals.resources },
        { label: 'Políticas', href: '/admin/politicas', icon: 'file-document-outline', count: totals.policies },
        { label: 'Departamentos', href: '/admin/departamentos', icon: 'office-building-outline', count: totals.departments },
        { label: 'Manuales', href: '/admin/manual', icon: 'book-open-outline', count: totals.manuals },
      ],
    },
    {
      label: 'Directorio',
      items: [
        { label: 'Contactos', href: '/admin/contactos', icon: 'account-box-outline', count: totals.contacts },
        { label: 'Empresas', href: '/admin/empresas', icon: 'domain', count: totals.companies },
      ],
    },
  ];
}

function withoutTrailingSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function isActiveHref(pathname: string, href: string): boolean {
  const path = withoutTrailingSlash(pathname);
  if (path === href) return true;
  if (EXACT_MATCH_HREFS.has(href)) return false;
  return path.startsWith(`${href}/`);
}

export function mobileDestinations(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) => group.items).slice(0, MOBILE_DESTINATION_LIMIT);
}

export function itemIconClass(item: NavItem, active: boolean): string {
  const useFilledVariant = active && item.icon.endsWith(OUTLINE_SUFFIX);
  const name = useFilledVariant ? item.icon.slice(0, -OUTLINE_SUFFIX.length) : item.icon;
  return `mdi-${name}`;
}

export function itemAriaLabel(item: NavItem): string {
  return item.count ? `${item.label}, ${item.count}` : item.label;
}
