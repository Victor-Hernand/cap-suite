import { findDepartmentByName, findDepartmentBySlug, type Department } from '../data/departments';
import { policyClassifications, policyTypes, visiblePolicyStatusIds, type PolicyStatus } from '../data/policies';
import type { PolicySummary } from './policies';

export type PolicyCard = Omit<PolicySummary, 'id'>;

export interface PolicyFilters {
  department: string;
  type: string;
  classification: string;
  status: string;
}

export const EMPTY_FILTERS: PolicyFilters = { department: '', type: '', classification: '', status: '' };

const HIDDEN_BY_DEFAULT_STATUS: PolicyStatus = 'obsolete';

function matchesStatus(policy: PolicyCard, statusFilter: string): boolean {
  if (statusFilter) return policy.status === statusFilter;
  return policy.status !== HIDDEN_BY_DEFAULT_STATUS;
}

export function filterPolicies(policies: PolicyCard[], filters: PolicyFilters): PolicyCard[] {
  return policies.filter((policy) => {
    if (!matchesStatus(policy, filters.status)) return false;
    if (filters.department && policy.department !== filters.department) return false;
    if (filters.type && policy.type !== filters.type) return false;
    return !filters.classification || policy.classification === filters.classification;
  });
}

export interface PolicyDepartmentGroup {
  department: string;
  /** Ausente cuando el departamento ya no está en el catálogo y no tiene página propia. */
  slug: string | undefined;
  policies: PolicyCard[];
}

/** Agrupa en el orden del catálogo de departamentos; los que no están en él van al final. */
export function groupPoliciesByDepartment(
  policies: PolicyCard[],
  departments: readonly Department[],
): PolicyDepartmentGroup[] {
  const policiesByDepartment = new Map<string, PolicyCard[]>();
  for (const policy of policies) {
    const departmentPolicies = policiesByDepartment.get(policy.department) ?? [];
    departmentPolicies.push(policy);
    policiesByDepartment.set(policy.department, departmentPolicies);
  }

  const groups: PolicyDepartmentGroup[] = [];
  for (const { name, slug } of departments) {
    const departmentPolicies = policiesByDepartment.get(name);
    if (!departmentPolicies) continue;
    groups.push({ department: name, slug, policies: departmentPolicies });
    policiesByDepartment.delete(name);
  }
  for (const [department, departmentPolicies] of policiesByDepartment) {
    groups.push({ department, slug: undefined, policies: departmentPolicies });
  }
  return groups;
}

function validOrEmpty(value: string | null, validIds: readonly string[]): string {
  return value !== null && validIds.includes(value) ? value : '';
}

export function filtersFromQuery(params: URLSearchParams, departments: readonly Department[]): PolicyFilters {
  return {
    department: findDepartmentBySlug(departments, params.get('departamento') ?? '')?.name ?? '',
    type: validOrEmpty(params.get('tipo'), policyTypes.map((type) => type.id)),
    classification: validOrEmpty(params.get('clasificacion'), policyClassifications.map((item) => item.id)),
    status: validOrEmpty(params.get('estado'), visiblePolicyStatusIds),
  };
}

export function filtersToQuery(filters: PolicyFilters, departments: readonly Department[]): string {
  const params = new URLSearchParams();
  const entries: [string, string][] = [
    ['departamento', findDepartmentByName(departments, filters.department)?.slug ?? ''],
    ['tipo', filters.type],
    ['clasificacion', filters.classification],
    ['estado', filters.status],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
  }
  return params.toString();
}
