<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { actions } from 'astro:actions';
import FormModal from './FormModal.vue';
import { useTableView } from './useTableView';
import { useActionForm } from './useActionForm';
import { alertErrorClass, inputClass, pagerButtonClass, primaryButtonClass } from './formStyles';
import type { Collection, Column, Field, Row } from './types';

const props = defineProps<{
  collection: Collection;
  rows: Row[];
  columns: Column[];
  fields: Field[];
  entityName: string;
  entityNamePlural: string;
  /** Género gramatical de la entidad: "Nuevo recurso" / "Nueva empresa". */
  entityGender: 'm' | 'f';
}>();

const group = computed(() => actions[props.collection]);
const {
  filterText,
  sortKey,
  sortDirection,
  page,
  pageCount,
  pageRows,
  rangeStart,
  rangeEnd,
  totalFiltered,
  isManualOrder,
  toggleSort,
} = useTableView(toRef(props, 'rows'), toRef(props, 'columns'));
const { submitting, formError, fieldErrors, resetErrors, runAction, submit } = useActionForm();

const modalOpen = ref(false);
const editingRow = ref<Row | null>(null);
const pendingDeleteId = ref<number | null>(null);

const newLabel = computed(() => `${props.entityGender === 'f' ? 'Nueva' : 'Nuevo'} ${props.entityName}`);
const firstOneLabel = computed(() => (props.entityGender === 'f' ? 'la primera' : 'el primero'));
const columnSpan = computed(() => props.columns.length + 1);

const SORT_STATE = {
  none: { icon: '↕', aria: 'none' },
  asc: { icon: '↑', aria: 'ascending' },
  desc: { icon: '↓', aria: 'descending' },
} as const;

function sortState(key: string) {
  return SORT_STATE[sortKey.value === key ? sortDirection.value : 'none'];
}

function openForm(row: Row | null = null) {
  editingRow.value = row;
  resetErrors();
  modalOpen.value = true;
}

const initialValues = computed(() => {
  const values: Record<string, string> = {};
  for (const field of props.fields) {
    const raw = editingRow.value?.[field.name];
    values[field.name] = raw === null || raw === undefined ? '' : String(raw);
  }
  return values;
});

function submitForm(formData: FormData) {
  if (editingRow.value) formData.set('id', String(editingRow.value.id));
  const action = editingRow.value ? group.value.update : group.value.create;
  submit(props.fields, formData, () => action(formData));
}

function removeRow(id: number) {
  pendingDeleteId.value = null;
  runAction(() => group.value.remove({ id }));
}

function moveRowBy(id: number, direction: 'up' | 'down') {
  runAction(() => group.value.move({ id, direction }));
}

function toggleFeatured(row: Row) {
  if (props.collection !== 'apps') return;
  runAction(() => actions.apps.toggleFeatured({ id: row.id, featured: !row.featured }));
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <input
        v-model="filterText"
        type="search"
        placeholder="Filtrar…"
        aria-label="Filtrar la tabla"
        :class="[inputClass, 'w-56']"
      />
      <button type="button" :class="primaryButtonClass" @click="openForm()">
        + {{ newLabel }}
      </button>
    </div>

    <p v-if="formError && !modalOpen" :class="[alertErrorClass, 'mt-3']" role="alert">{{ formError }}</p>

    <div class="mt-4 overflow-x-auto rounded-xl border border-edge bg-surface">
      <div v-if="props.rows.length === 0" class="px-5 py-10 text-center text-sm text-body">
        Aún no hay {{ props.entityNamePlural }}. Crea {{ firstOneLabel }} con el botón «{{ newLabel }}».
      </div>
      <div v-else-if="totalFiltered === 0" class="px-5 py-10 text-center text-sm text-body">
        Nada coincide con «{{ filterText }}».
      </div>
      <table v-else class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-edge font-mono text-[9px] uppercase tracking-widest text-muted">
            <th
              v-for="column in props.columns"
              :key="column.key"
              class="px-4 py-2 font-medium"
              :aria-sort="sortState(column.key).aria"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-widest hover:text-ink"
                :class="sortKey === column.key ? 'text-ink' : ''"
                :title="`Ordenar por ${column.label.toLowerCase()}`"
                @click="toggleSort(column.key)"
              >
                {{ column.label }} <span aria-hidden="true">{{ sortState(column.key).icon }}</span>
              </button>
            </th>
            <th class="px-4 py-2"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pageRows" :key="row.id" class="border-b border-edge/60 last:border-b-0">
            <td v-for="column in props.columns" :key="column.key" class="px-4 py-3">
              <span
                v-if="column.kind === 'led'"
                class="flex min-w-[7rem] max-w-[16rem] items-center gap-2"
                :title="String(row[column.key] ?? '')"
              >
                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :style="{ background: String(row.ledColor ?? '#15181D') }"></span>
                <span class="truncate">{{ row[column.key] ?? '—' }}</span>
              </span>
              <button
                v-else-if="column.kind === 'toggle'"
                type="button"
                class="relative h-4 w-7 rounded-full transition-colors"
                :class="row[column.key] ? 'bg-green-600' : 'bg-edge-strong'"
                :aria-label="row[column.key] ? 'Quitar de destacadas' : 'Destacar'"
                @click="toggleFeatured(row)"
              >
                <span
                  class="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
                  :class="row[column.key] ? 'right-0.5' : 'left-0.5'"
                ></span>
              </button>
              <span
                v-else
                class="block min-w-[7rem] max-w-[16rem] truncate"
                :class="column.kind === 'muted' ? 'text-muted' : 'font-semibold text-ink'"
                :title="String(row[column.key] ?? '')"
              >{{ row[column.key] ?? '—' }}</span>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <template v-if="isManualOrder">
                <button type="button" class="px-1 text-muted hover:text-ink" aria-label="Subir" @click="moveRowBy(row.id, 'up')">↑</button>
                <button type="button" class="px-1 text-muted hover:text-ink" aria-label="Bajar" @click="moveRowBy(row.id, 'down')">↓</button>
              </template>
              <button type="button" class="ml-2 font-semibold text-ink hover:underline" @click="openForm(row)">Editar</button>
              <button
                v-if="pendingDeleteId !== row.id"
                type="button"
                class="ml-2 text-red-700"
                aria-label="Eliminar"
                @click="pendingDeleteId = row.id"
              >✕</button>
              <button
                v-else
                type="button"
                class="ml-2 rounded bg-red-700 px-2 py-0.5 text-xs font-bold text-white"
                @click="removeRow(row.id)"
              >¿Eliminar?</button>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="pageCount > 1">
          <tr>
            <td :colspan="columnSpan" class="border-t border-edge px-4 py-2">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-body">
                <span>Mostrando {{ rangeStart }}–{{ rangeEnd }} de {{ totalFiltered }}</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    :class="pagerButtonClass"
                    :disabled="page === 1"
                    @click="page -= 1"
                  >Anterior</button>
                  <span>Página {{ page }} de {{ pageCount }}</span>
                  <button
                    type="button"
                    :class="pagerButtonClass"
                    :disabled="page === pageCount"
                    @click="page += 1"
                  >Siguiente</button>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <FormModal
      v-if="modalOpen"
      :title="editingRow ? `Editar ${props.entityName}` : newLabel"
      :submit-label="`Guardar ${props.entityName}`"
      :fields="props.fields"
      :initial-values="initialValues"
      :submitting="submitting"
      :form-error="formError"
      :field-errors="fieldErrors"
      @close="modalOpen = false"
      @submit="submitForm"
    />
  </div>
</template>
