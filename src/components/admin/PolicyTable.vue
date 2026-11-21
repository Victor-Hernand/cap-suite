<script setup lang="ts">
import { ref, toRef } from 'vue';
import { actions } from 'astro:actions';
import DeleteRowButton from './DeleteRowButton.vue';
import SortableHeader from './SortableHeader.vue';
import TablePager from './TablePager.vue';
import { useActionForm } from './useActionForm';
import { useTableView } from './useTableView';
import { alertErrorClass, inputClass, primaryButtonClass } from './formStyles';
import type { Column, Row } from './types';
import { badgeClassOf } from '../../data/policies';

const props = withDefaults(defineProps<{ rows?: Row[] }>(), { rows: () => [] });

const columns: Column[] = [
  { key: 'title', label: 'Título' },
  { key: 'department', label: 'Departamento', kind: 'muted' },
  { key: 'typeLabel', label: 'Tipo', kind: 'muted' },
  { key: 'statusLabel', label: 'Estado' },
  { key: 'version', label: 'Versión', kind: 'muted' },
];
const columnSpan = columns.length + 1;

const { filterText, sortKey, page, pageCount, pageRows, rangeStart, rangeEnd, totalFiltered, toggleSort, sortState } =
  useTableView(toRef(props, 'rows'), columns);
const { formError, runAction } = useActionForm();
const pendingDeleteId = ref<number | null>(null);

function removePolicy(id: number) {
  pendingDeleteId.value = null;
  runAction(() => actions.policies.remove({ id }));
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
      <a href="/admin/politicas/nueva" :class="[primaryButtonClass, 'shrink-0 whitespace-nowrap']">+ Nueva política</a>
    </div>

    <p v-if="formError" :class="[alertErrorClass, 'mt-3']" role="alert">{{ formError }}</p>

    <div class="mt-4 overflow-x-auto rounded-xl border border-edge bg-surface">
      <div v-if="props.rows.length === 0" class="px-5 py-10 text-center text-sm text-body">
        Aún no hay políticas. Crea la primera con el botón «Nueva política».
      </div>
      <div v-else-if="totalFiltered === 0" class="px-5 py-10 text-center text-sm text-body">
        Nada coincide con «{{ filterText }}».
      </div>
      <table v-else class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-edge font-mono text-[9px] uppercase tracking-widest text-muted">
            <SortableHeader
              v-for="column in columns"
              :key="column.key"
              :label="column.label"
              :sort-state="sortState(column.key)"
              :active="sortKey === column.key"
              @sort="toggleSort(column.key)"
            />
            <th class="px-4 py-2"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pageRows" :key="row.id" class="border-b border-edge/60 last:border-b-0">
            <td class="px-4 py-3">
              <a
                :href="`/admin/politicas/${row.id}`"
                class="block min-w-[10rem] max-w-[22rem] truncate font-semibold text-ink hover:underline"
                :title="String(row.title)"
              >{{ row.title }}</a>
            </td>
            <td class="px-4 py-3 text-muted">{{ row.department }}</td>
            <td class="px-4 py-3 text-muted">{{ row.typeLabel }}</td>
            <td class="px-4 py-3">
              <span :class="badgeClassOf(String(row.status))">{{ row.statusLabel }}</span>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-muted">{{ row.version || '—' }}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <a :href="`/admin/politicas/${row.id}`" class="font-semibold text-ink hover:underline">Editar</a>
              <DeleteRowButton
                :pending="pendingDeleteId === row.id"
                @request="pendingDeleteId = row.id"
                @confirm="removePolicy(row.id)"
              />
            </td>
          </tr>
        </tbody>
        <TablePager
          v-model:page="page"
          :page-count="pageCount"
          :range-start="rangeStart"
          :range-end="rangeEnd"
          :total="totalFiltered"
          :column-span="columnSpan"
        />
      </table>
    </div>
  </div>
</template>
