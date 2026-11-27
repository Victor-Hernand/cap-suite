<script setup lang="ts">
import { computed, ref } from 'vue';
import CapSegmented from '../design/vue/CapSegmented.vue';
import type { Department } from '../data/departments';
import {
  labelOf,
  policyCountLabel,
  policyClassifications,
  policyStatuses,
  policyTypes,
  visiblePolicyStatuses,
} from '../data/policies';
import { policyBadgeClass } from '../lib/policyBadges';
import { formatVersionLine } from '../lib/dates';
import EmptyState from './EmptyState.vue';
import { cardClass, fieldLabelClass, fieldSelectClass, sectionTitleClass, statusDotClass } from '../lib/capClasses';
import {
  EMPTY_FILTERS,
  filterPolicies,
  filtersToQuery,
  groupPoliciesByDepartment,
  type PolicyCard,
  type PolicyFilters,
} from '../lib/policyFilter';

type SelectFilterKey = Exclude<keyof PolicyFilters, 'status'>;

const props = withDefaults(
  defineProps<{ policies?: PolicyCard[]; departments?: Department[]; initialFilters?: PolicyFilters }>(),
  {
    policies: () => [],
    departments: () => [],
    initialFilters: () => ({ ...EMPTY_FILTERS }),
  },
);

const filters = ref<PolicyFilters>({ ...props.initialFilters });
const visiblePolicies = computed(() => filterPolicies(props.policies, filters.value));
const departmentGroups = computed(() => groupPoliciesByDepartment(visiblePolicies.value, props.departments));

const statusItems = computed(() =>
  [{ id: '', label: 'Actuales' }, ...visiblePolicyStatuses].map((status) => ({
    label: status.label,
    value: status.id,
    count: filterPolicies(props.policies, { ...filters.value, status: status.id }).length,
  })),
);

const selectFilters = computed(() => [
  {
    key: 'department' as const,
    label: 'Departamento',
    emptyLabel: 'Todos',
    options: props.departments.map((department) => ({ id: department.name, label: department.name })),
  },
  { key: 'type' as const, label: 'Tipo', emptyLabel: 'Todos', options: policyTypes },
  { key: 'classification' as const, label: 'Clasificación', emptyLabel: 'Todas', options: policyClassifications },
]);

function applyFilters(next: PolicyFilters) {
  filters.value = next;
  const query = filtersToQuery(next, props.departments);
  history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
}

function updateStatus(status: string) {
  applyFilters({ ...filters.value, status });
}

function updateSelectFilter(key: SelectFilterKey, event: Event) {
  applyFilters({ ...filters.value, [key]: (event.target as HTMLSelectElement).value });
}
</script>

<template>
  <EmptyState
    v-if="props.policies.length === 0"
    icon="file-document-outline"
    title="Aún no hay políticas publicadas"
    detail="Cuando se publique la primera, aparecerá aquí agrupada por departamento."
  />

  <template v-else>
    <form class="flex flex-col gap-4" role="search" aria-label="Filtrar políticas" @submit.prevent>
      <CapSegmented
        class="self-start"
        :model-value="filters.status"
        label="Filtrar por estado"
        :items="statusItems"
        @update:model-value="updateStatus"
      />
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div v-for="filter in selectFilters" :key="filter.key">
          <label :for="`policy-filter-${filter.key}`" :class="fieldLabelClass">{{ filter.label }}</label>
          <select
            :id="`policy-filter-${filter.key}`"
            :value="filters[filter.key]"
            :class="fieldSelectClass"
            @change="updateSelectFilter(filter.key, $event)"
          >
            <option value="">{{ filter.emptyLabel }}</option>
            <option v-for="option in filter.options" :key="option.id" :value="option.id">{{ option.label }}</option>
          </select>
        </div>
      </div>
    </form>

    <p class="text-sm text-cap-text-soft tabular-nums" aria-live="polite">{{ policyCountLabel(visiblePolicies.length) }}</p>

    <EmptyState
      v-if="visiblePolicies.length === 0"
      filtered
      icon="filter-off-outline"
      title="Ninguna política coincide con los filtros"
      detail="Prueba con otro estado, tipo o departamento."
    >
      <button type="button" class="cap-button cap-button--secondary" @click="applyFilters({ ...EMPTY_FILTERS })">
        Limpiar filtros
      </button>
    </EmptyState>

    <template v-else>
      <section
        v-for="group in departmentGroups"
        :key="group.department"
        :aria-label="group.department"
        :class="cardClass"
      >
        <div class="flex items-baseline justify-between gap-4">
          <h2 :class="sectionTitleClass">
            <a
              v-if="group.slug"
              :href="`/departamentos/${group.slug}`"
              class="underline decoration-gray-400 underline-offset-2 hover:decoration-current"
            >{{ group.department }}</a>
            <template v-else>{{ group.department }}</template>
          </h2>
          <span class="shrink-0 text-xs text-cap-text-soft tabular-nums">{{ policyCountLabel(group.policies.length) }}</span>
        </div>
        <ul class="mt-3 divide-y divide-cap-divider">
          <li v-for="policy in group.policies" :key="policy.slug">
            <a
              :href="`/politicas/${policy.slug}`"
              class="-mx-3 flex flex-col gap-2 rounded-cap-control px-3 py-3 transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span class="min-w-0">
                <span class="block text-sm font-medium text-cap-brand dark:text-cap-brand-soft">{{ policy.title }}</span>
                <span class="mt-1.5 flex flex-wrap gap-1.5">
                  <span :class="policyBadgeClass(policy.type)">{{ labelOf(policyTypes, policy.type) }}</span>
                  <span :class="policyBadgeClass(policy.status)"><span :class="statusDotClass" />{{ labelOf(policyStatuses, policy.status) }}</span>
                  <span :class="policyBadgeClass(policy.classification)">{{ labelOf(policyClassifications, policy.classification) }}</span>
                </span>
              </span>
              <span v-if="policy.version" class="shrink-0 text-xs text-cap-text-soft tabular-nums">
                {{ formatVersionLine(policy.version, policy.effectiveDate) }}
              </span>
            </a>
          </li>
        </ul>
      </section>
    </template>
  </template>
</template>
