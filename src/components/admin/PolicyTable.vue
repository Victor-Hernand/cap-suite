<script setup lang="ts">
import { toRef } from 'vue';
import { actions } from 'astro:actions';
import CapAlert from '../../design/vue/CapAlert.vue';
import CapButton from '../../design/vue/CapButton.vue';
import CapConfirmDialog from '../../design/vue/CapConfirmDialog.vue';
import AdminEmptyState from './AdminEmptyState.vue';
import AdminListCard from './AdminListCard.vue';
import AdminTable from './AdminTable.vue';
import RowActionsMenu from './RowActionsMenu.vue';
import TableFilter from './TableFilter.vue';
import TablePager from './TablePager.vue';
import { navigateWithToast, useActionForm } from './useActionForm';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useTableView } from './useTableView';
import { deleteDialogTitle, outcomeTitle, type EntityNames } from './entityLabels';
import type { Column, Row, RowAction } from './types';
import { policyBadgeClass } from '../../lib/policyBadges';
import { tableLinkClass } from '../../lib/capClasses';

const props = withDefaults(defineProps<{ rows?: Row[]; summary?: string }>(), { rows: () => [], summary: '' });

const POLICY: EntityNames = { singular: 'política', plural: 'políticas', gender: 'f' };
const NEW_POLICY_HREF = '/admin/politicas/nueva';

const columns: Column[] = [
  { key: 'title', label: 'Título' },
  { key: 'department', label: 'Departamento', kind: 'muted' },
  { key: 'typeLabel', label: 'Tipo', kind: 'muted' },
  { key: 'statusLabel', label: 'Estado' },
  { key: 'version', label: 'Versión', kind: 'muted' },
];

const { filterText, page, pageCount, pageRows, rangeStart, rangeEnd, totalFiltered, toggleSort, sortState } =
  useTableView(toRef(props, 'rows'), columns);
const { formError, runAction } = useActionForm();
const removal = useDeleteConfirmation<Row>(runAction);
const { pendingTarget: pendingDeleteRow, deleting } = removal;

const editHref = (row: Row) => `/admin/politicas/${row.id}`;

const rowActions = (row: Row): RowAction[] => [
  { key: 'edit', label: 'Editar', icon: 'pencil-outline', href: editHref(row) },
  { key: 'delete', label: 'Eliminar', icon: 'delete-outline', danger: true },
];

function onRowAction(row: Row, key: string) {
  if (key === 'delete') removal.request(row);
}

function confirmDelete() {
  removal.confirm(
    (row) => actions.policies.remove({ id: row.id }),
    (row) => navigateWithToast({ status: 'ok', title: outcomeTitle(POLICY, 'deleted'), detail: String(row.title) }),
  );
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-cap-text-soft">{{ props.summary }}</p>
      <div v-if="props.rows.length > 0" class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <TableFilter v-model="filterText" label="Filtrar políticas" />
        <CapButton :href="NEW_POLICY_HREF" icon="plus">Nueva política</CapButton>
      </div>
    </div>

    <CapAlert v-if="formError" status="error" title="No se completó la acción" :detail="formError" />

    <AdminEmptyState
      v-if="props.rows.length === 0"
      icon="file-document-outline"
      title="Aún no hay políticas"
      detail="Crea la primera; se guarda como borrador hasta publicarla."
    >
      <CapButton :href="NEW_POLICY_HREF" icon="plus">Nueva política</CapButton>
    </AdminEmptyState>

    <AdminEmptyState
      v-else-if="totalFiltered === 0"
      filtered
      icon="magnify"
      title="Ningún registro coincide con los filtros"
      :detail="`No hay políticas que contengan «${filterText.trim()}».`"
    >
      <CapButton variant="secondary" @click="filterText = ''">Limpiar filtros</CapButton>
    </AdminEmptyState>

    <div v-else>
      <AdminTable class="hidden lg:block" :columns="columns" :rows="pageRows" :sort-state="sortState" @sort="toggleSort">
        <template #cell="{ row, column }">
          <a
            v-if="column.key === 'title'"
            :href="editHref(row)"
            class="block max-w-sm truncate"
            :class="tableLinkClass"
            :title="String(row.title)"
          >{{ row.title }}</a>
          <span v-else-if="column.key === 'statusLabel'" :class="policyBadgeClass(String(row.status))">
            <span class="h-1.5 w-1.5 rounded-full bg-current" />{{ row.statusLabel }}
          </span>
          <span v-else class="block max-w-xs truncate text-cap-text-soft" :title="String(row[column.key] ?? '')">
            {{ row[column.key] || '—' }}
          </span>
        </template>
        <template #actions="{ row }">
          <RowActionsMenu
            :menu-id="`policy-${row.id}-actions`"
            :record-label="String(row.title)"
            :actions="rowActions(row)"
            @select="onRowAction(row, $event)"
          />
        </template>
      </AdminTable>

      <ul class="flex flex-col gap-3 lg:hidden">
        <li v-for="row in pageRows" :key="row.id">
          <AdminListCard
            icon="file-document-outline"
            :title="String(row.title)"
            :subtitle="[row.department, row.typeLabel, row.version].filter(Boolean).join(' · ')"
            :href="editHref(row)"
          >
            <span :class="policyBadgeClass(String(row.status))"><span class="h-1.5 w-1.5 rounded-full bg-current" />{{ row.statusLabel }}</span>
            <RowActionsMenu
              :menu-id="`policy-${row.id}-actions-mobile`"
              :record-label="String(row.title)"
              :actions="rowActions(row)"
              @select="onRowAction(row, $event)"
            />
          </AdminListCard>
        </li>
      </ul>

      <TablePager
        v-if="pageCount > 1"
        v-model:page="page"
        :page-count="pageCount"
        :range-start="rangeStart"
        :range-end="rangeEnd"
        :total="totalFiltered"
      />
    </div>

    <CapConfirmDialog
      :open="pendingDeleteRow !== null"
      :title="pendingDeleteRow ? deleteDialogTitle(POLICY, String(pendingDeleteRow.title)) : ''"
      message="Desaparece del portal de inmediato. No se puede deshacer."
      confirm-label="Eliminar política"
      icon="delete-outline"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="removal.cancel"
    />
  </div>
</template>
