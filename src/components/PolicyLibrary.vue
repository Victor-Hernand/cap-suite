<script setup lang="ts">
import { computed, ref } from 'vue';
import { departments } from '../data/departments';
import {
  badgeClassOf,
  labelOf,
  policyCountLabel,
  policyClassifications,
  policyStatuses,
  policyTypes,
  visiblePolicyStatuses,
} from '../data/policies';
import { formatVersionLine } from '../lib/dates';
import { cardClass, eyebrowClass } from '../lib/publicStyles';
import { inputClass, labelClass, primaryButtonClass, selectClass } from './admin/formStyles';
import {
  EMPTY_FILTERS,
  filterPolicies,
  filtersToQuery,
  groupPoliciesByDepartment,
  type PolicyCard,
  type PolicyFilters,
} from '../lib/policyFilter';

const props = withDefaults(defineProps<{ policies?: PolicyCard[]; initialFilters?: PolicyFilters }>(), {
  policies: () => [],
  initialFilters: () => ({ ...EMPTY_FILTERS }),
});

const filters = ref<PolicyFilters>({ ...props.initialFilters });
const visiblePolicies = computed(() => filterPolicies(props.policies, filters.value));
const departmentGroups = computed(() => groupPoliciesByDepartment(visiblePolicies.value));

function applyFilters(next: PolicyFilters) {
  filters.value = next;
  const query = filtersToQuery(next);
  history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
}

function updateFilter(key: keyof PolicyFilters, event: Event) {
  applyFilters({ ...filters.value, [key]: (event.target as HTMLInputElement | HTMLSelectElement).value });
}
</script>

<template>
  <div>
    <p
      v-if="props.policies.length === 0"
      class="mt-8 rounded-xl border border-edge bg-surface px-5 py-8 text-center text-sm text-body"
    >
      Aún no hay políticas publicadas.
    </p>

    <template v-else>
      <form
        class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
        role="search"
        aria-label="Filtrar políticas"
        @submit.prevent
      >
        <label class="block">
          <span :class="labelClass">Buscar por título</span>
          <input
            type="search"
            :value="filters.text"
            placeholder="Buscar…"
            :class="inputClass"
            @input="updateFilter('text', $event)"
          />
        </label>
        <label class="block">
          <span :class="labelClass">Departamento</span>
          <select :value="filters.department" :class="selectClass" @change="updateFilter('department', $event)">
            <option value="">Todos</option>
            <option v-for="department in departments" :key="department.slug" :value="department.name">
              {{ department.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span :class="labelClass">Tipo</span>
          <select :value="filters.type" :class="selectClass" @change="updateFilter('type', $event)">
            <option value="">Todos</option>
            <option v-for="type in policyTypes" :key="type.id" :value="type.id">{{ type.label }}</option>
          </select>
        </label>
        <label class="block">
          <span :class="labelClass">Clasificación</span>
          <select :value="filters.classification" :class="selectClass" @change="updateFilter('classification', $event)">
            <option value="">Todas</option>
            <option v-for="item in policyClassifications" :key="item.id" :value="item.id">{{ item.label }}</option>
          </select>
        </label>
        <label class="block">
          <span :class="labelClass">Estado</span>
          <select :value="filters.status" :class="selectClass" @change="updateFilter('status', $event)">
            <option value="">Vigente y En revisión</option>
            <option v-for="status in visiblePolicyStatuses" :key="status.id" :value="status.id">{{ status.label }}</option>
          </select>
        </label>
      </form>

      <p class="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted" aria-live="polite">{{ policyCountLabel(visiblePolicies.length) }}</p>

      <div
        v-if="visiblePolicies.length === 0"
        class="mt-8 rounded-xl border border-edge bg-surface px-5 py-8 text-center"
      >
        <p class="text-sm font-bold text-ink">Sin resultados</p>
        <p class="mt-1 text-sm text-body">Ninguna política coincide con los filtros elegidos.</p>
        <button
          type="button"
          :class="`mt-4 ${primaryButtonClass}`"
          @click="applyFilters({ ...EMPTY_FILTERS })"
        >
          Limpiar filtros
        </button>
      </div>

      <div v-else class="mt-8 space-y-10">
        <section v-for="group in departmentGroups" :key="group.department" :aria-label="group.department">
          <div class="flex items-baseline justify-between gap-4 border-b border-edge pb-2">
            <h2 :class="eyebrowClass">
              <a
                v-if="group.slug"
                :href="`/departamentos/${group.slug}`"
                class="underline decoration-edge-strong underline-offset-2 hover:text-ink hover:decoration-ink"
              >{{ group.department }}</a>
              <template v-else>{{ group.department }}</template>
            </h2>
            <span class="shrink-0 font-mono text-[10px] tracking-[0.18em] text-muted">
              {{ policyCountLabel(group.policies.length) }}
            </span>
          </div>
          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a
              v-for="policy in group.policies"
              :key="policy.slug"
              :href="`/politicas/${policy.slug}`"
              :class="[cardClass, 'group flex flex-col p-4 transition-all hover:-translate-y-0.5 hover:shadow-md']"
            >
              <span class="text-sm font-bold text-ink">{{ policy.title }}</span>
              <span class="mt-3 flex flex-wrap gap-1.5">
                <span :class="badgeClassOf(policy.type)">{{ labelOf(policyTypes, policy.type) }}</span>
                <span :class="badgeClassOf(policy.status)">{{ labelOf(policyStatuses, policy.status) }}</span>
                <span :class="badgeClassOf(policy.classification)">
                  {{ labelOf(policyClassifications, policy.classification) }}
                </span>
              </span>
              <span v-if="policy.version" class="mt-3 font-mono text-[10px] tracking-[0.12em] text-muted">
                {{ formatVersionLine(policy.version, policy.effectiveDate) }}
              </span>
            </a>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
