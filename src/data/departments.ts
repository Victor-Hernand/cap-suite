export interface Department {
  slug: string;
  name: string;
}

// Catálogo inicial: se carga en la tabla departments cuando está vacía. Después los
// departamentos se crean y renombran desde el admin.
export const DEFAULT_DEPARTMENTS: readonly Department[] = [
  { slug: 'gerencia-administrativa', name: 'Gerencia Administrativa' },
  { slug: 'gerencia-operativa', name: 'Gerencia Operativa' },
  { slug: 'talento-humano', name: 'Talento Humano' },
  { slug: 'legal', name: 'Legal' },
  { slug: 'contabilidad-general', name: 'Contabilidad General' },
  { slug: 'finanzas-y-tesoreria', name: 'Finanzas y Tesorería' },
  { slug: 'compras-e-importaciones', name: 'Compras e Importaciones' },
  { slug: 'comercial-e-inteligencia-de-negocios', name: 'Comercial e Inteligencia de Negocios' },
  { slug: 'marketing-y-desarrollo-digital', name: 'Marketing y Desarrollo Digital' },
  { slug: 'mejora-continua-y-automatizacion', name: 'Mejora Continua y Automatización' },
  { slug: 'tecnologia-y-desarrollo', name: 'Tecnología y Desarrollo' },
  { slug: 'cadena-de-suministro', name: 'Cadena de Suministro B2B y B2C' },
  { slug: 'servicios-generales', name: 'Servicios Generales' },
  { slug: 'proyectos-e-infraestructura', name: 'Proyectos e Infraestructura' },
  { slug: 'flota-vehicular', name: 'Flota Vehicular' },
  { slug: 'soporte-tecnico-y-activos-fijos', name: 'Soporte Técnico y Activos Fijos' },
  { slug: 'auditoria-y-control-interno', name: 'Auditoría y Control Interno' },
];

export const noticeKinds = [
  { id: 'warning', label: 'Aviso' },
  { id: 'info', label: 'Informativo' },
] as const;

export type NoticeKind = (typeof noticeKinds)[number]['id'];

export function findDepartmentBySlug(departments: readonly Department[], slug: string): Department | undefined {
  return departments.find((department) => department.slug === slug);
}

export function findDepartmentByName(departments: readonly Department[], name: string): Department | undefined {
  return departments.find((department) => department.name === name);
}

export function departmentOptionsOf(departments: readonly Department[]) {
  return departments.map(({ name }) => ({ value: name, label: name }));
}

/** Nombres de departamento anteriores al catálogo de 17 y el nombre actual al que pasan. */
export const LEGACY_DEPARTMENT_NAMES: Record<string, string> = {
  Gerencia: 'Gerencia Administrativa',
  Administración: 'Gerencia Administrativa',
  Auditoría: 'Auditoría y Control Interno',
  Contabilidad: 'Contabilidad General',
  Finanzas: 'Finanzas y Tesorería',
  'Créditos y Cobros': 'Finanzas y Tesorería',
  Compras: 'Compras e Importaciones',
  Logística: 'Cadena de Suministro B2B y B2C',
  Bodega: 'Cadena de Suministro B2B y B2C',
  Operaciones: 'Gerencia Operativa',
  Ventas: 'Comercial e Inteligencia de Negocios',
  Mercadeo: 'Marketing y Desarrollo Digital',
  'Recursos Humanos': 'Talento Humano',
  Tecnología: 'Tecnología y Desarrollo',
};
