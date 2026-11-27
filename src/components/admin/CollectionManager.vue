<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { actions } from 'astro:actions';
import CapAlert from '../../design/vue/CapAlert.vue';
import CapButton from '../../design/vue/CapButton.vue';
import CapConfirmDialog from '../../design/vue/CapConfirmDialog.vue';
import AdminEmptyState from './AdminEmptyState.vue';
import AdminListCard from './AdminListCard.vue';
import AdminTable from './AdminTable.vue';
import CollectionCell from './CollectionCell.vue';
import FormModal from './FormModal.vue';
import RowActionsMenu from './RowActionsMenu.vue';
import TableFilter from './TableFilter.vue';
import TablePager from './TablePager.vue';
import { statusBadgeClass } from '../../design/statuses.js';
import { sectionTitleClass } from '../../lib/capClasses';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useTableView } from './useTableView';
import { navigateWithToast, useActionForm } from './useActionForm';
import { createFirstLabel, deleteDialogTitle, newEntityLabel, outcomeTitle, type EntityNames } from './entityLabels';
import { UNSORTED_COLLECTIONS, type Collection, type Column, type Field, type Row, type RowAction } from './types';

const props = withDefaults(
  defineProps<{
    collection: Collection;
    rows: Row[];
    columns: Column[];
    fields: Field[];
    entityName: string;
    entityNamePlural: string;
    /** Género gramatical de la entidad: "Nuevo recurso" / "Nueva empresa". */
    entityGender: 'm' | 'f';
    /** Texto de la barra de acciones, a la izquierda del botón de crear. */
    summary?: string;
    /** Título de la lista cuando va dentro de una tarjeta con otras listas; reemplaza al texto de la barra. */
    title?: string;
    /** Con varias listas en la pantalla no llevan filtro de texto: un solo buscador por pantalla. */
    filterable?: boolean;
    /** Con varias listas en la pantalla, solo una lleva el botón de crear primario. */
    createVariant?: 'primary' | 'secondary';
    /** Valores que no se editan en el formulario y se envían en crear y editar. */
    fixedValues?: Record<string, string>;
  }>(),
  { summary: '', title: '', filterable: true, createVariant: 'primary', fixedValues: () => ({}) },
);

const COLLECTION_ICONS: Record<Collection, string> = {
  apps: 'application-outline',
  resources: 'file-document-outline',
  contacts: 'account-outline',
  companies: 'domain',
  manuals: 'book-open-outline',
  departments: 'office-building-outline',
  departmentProcesses: 'sitemap-outline',
  departmentFormats: 'file-outline',
  departmentLinks: 'link-variant',
  departmentNotices: 'bullhorn-outline',
};

const entity = computed<EntityNames>(() => ({
  singular: props.entityName,
  plural: props.entityNamePlural,
  gender: props.entityGender,
}));
const group = computed(() => actions[props.collection]);
const isSortable = computed(() => !UNSORTED_COLLECTIONS.includes(props.collection));
const titleColumn = computed(() => props.columns[0]);
const detailColumns = computed(() => props.columns.slice(1).filter((column) => column.kind !== 'toggle'));

const { filterText, page, pageCount, pageRows, rangeStart, rangeEnd, totalFiltered, isManualOrder, toggleSort, sortState } =
  useTableView(toRef(props, 'rows'), toRef(props, 'columns'));
const { submitting, formError, fieldErrors, resetErrors, runAction, submit } = useActionForm();

const modalOpen = ref(false);
const editingRow = ref<Row | null>(null);
const removal = useDeleteConfirmation<Row>(runAction);
const { pendingTarget: pendingDeleteRow, deleting } = removal;

const newLabel = computed(() => newEntityLabel(entity.value));

const cellText = (row: Row, column: Column) => String(row[column.key] ?? '') || '—';
const recordLabel = (row: Row) => cellText(row, titleColumn.value);
const detailText = (row: Row) =>
  detailColumns.value
    .map((column) => String(row[column.key] ?? ''))
    .filter(Boolean)
    .join(' · ');
const activeToggleLabels = (row: Row) =>
  props.columns.filter((column) => column.kind === 'toggle' && row[column.key]).map((column) => column.label);

function openForm(row: Row | null = null) {
  editingRow.value = row;
  resetErrors();
  modalOpen.value = true;
}

function closeForm() {
  modalOpen.value = false;
  resetErrors();
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
  for (const [name, value] of Object.entries(props.fixedValues)) formData.set(name, value);
  if (editingRow.value) formData.set('id', String(editingRow.value.id));
  const action = editingRow.value ? group.value.update : group.value.create;
  const toast: CapToastOptions = {
    status: 'ok',
    title: outcomeTitle(entity.value, editingRow.value ? 'updated' : 'created'),
    detail: String(formData.get(props.fields[0].name) ?? ''),
  };
  submit(props.fields, formData, () => action(formData), () => navigateWithToast(toast));
}

function confirmDelete() {
  removal.confirm(
    (row) => group.value.remove({ id: row.id }),
    (row) => navigateWithToast({ status: 'ok', title: outcomeTitle(entity.value, 'deleted'), detail: recordLabel(row) }),
  );
}

function toggleFeatured(row: Row) {
  if (props.collection !== 'apps') return;
  runAction(() => actions.apps.toggleFeatured({ id: row.id, featured: !row.featured }));
}

function rowActions(row: Row, { includeFeatured }: { includeFeatured: boolean }): RowAction[] {
  const rowActionList: RowAction[] = [{ key: 'edit', label: 'Editar', icon: 'pencil-outline' }];
  if (includeFeatured && props.collection === 'apps') {
    rowActionList.push(
      row.featured
        ? { key: 'featured', label: 'Quitar de destacadas', icon: 'star-off-outline' }
        : { key: 'featured', label: 'Destacar', icon: 'star-outline' },
    );
  }
  // Subir y bajar solo tienen sentido viendo el orden manual completo.
  if (isSortable.value && isManualOrder.value) {
    rowActionList.push({ key: 'up', label: 'Subir', icon: 'arrow-up' }, { key: 'down', label: 'Bajar', icon: 'arrow-down' });
  }
  rowActionList.push({ key: 'delete', label: 'Eliminar', icon: 'delete-outline', danger: true });
  return rowActionList;
}

function onRowAction(row: Row, key: string) {
  if (key === 'edit') openForm(row);
  else if (key === 'delete') removal.request(row);
  else if (key === 'featured') toggleFeatured(row);
  else if (key === 'up' || key === 'down') runAction(() => group.value.move({ id: row.id, direction: key }));
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 v-if="props.title" :class="sectionTitleClass">{{ props.title }}</h2>
      <p v-else class="text-sm text-cap-text-soft">{{ props.summary }}</p>
      <div v-if="props.rows.length > 0" class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <TableFilter v-if="props.filterable" v-model="filterText" :label="`Filtrar ${props.entityNamePlural}`" />
        <CapButton :variant="props.createVariant" icon="plus" @click="openForm()">{{ newLabel }}</CapButton>
      </div>
    </div>

    <CapAlert v-if="formError && !modalOpen" status="error" title="No se completó la acción" :detail="formError" />

    <AdminEmptyState
      v-if="props.rows.length === 0"
      :compact="Boolean(props.title)"
      :icon="COLLECTION_ICONS[props.collection]"
      :title="`Aún no hay ${props.entityNamePlural}`"
      :detail="`${createFirstLabel(entity)} para que aparezca en el portal.`"
    >
      <CapButton :variant="props.createVariant" icon="plus" @click="openForm()">{{ newLabel }}</CapButton>
    </AdminEmptyState>

    <AdminEmptyState
      v-else-if="totalFiltered === 0"
      filtered
      icon="magnify"
      title="Ningún registro coincide con los filtros"
      :detail="`No hay ${props.entityNamePlural} que contengan «${filterText.trim()}».`"
    >
      <CapButton variant="secondary" @click="filterText = ''">Limpiar filtros</CapButton>
    </AdminEmptyState>

    <div v-else>
      <AdminTable class="hidden lg:block" :columns="props.columns" :rows="pageRows" :sort-state="sortState" @sort="toggleSort">
        <template #cell="{ row, column }">
          <CollectionCell
            :row="row"
            :column="column"
            :text="cellText(row, column)"
            :record-label="recordLabel(row)"
            @toggle="toggleFeatured(row)"
          />
        </template>
        <template #actions="{ row }">
          <RowActionsMenu
            :menu-id="`${props.collection}-${row.id}-actions`"
            :record-label="recordLabel(row)"
            :actions="rowActions(row, { includeFeatured: false })"
            @select="onRowAction(row, $event)"
          />
        </template>
      </AdminTable>

      <ul class="flex flex-col gap-3 lg:hidden">
        <li v-for="row in pageRows" :key="row.id">
          <AdminListCard
            :icon="COLLECTION_ICONS[props.collection]"
            :title="recordLabel(row)"
            :subtitle="detailText(row)"
            :href="titleColumn.kind === 'link' && titleColumn.hrefKey ? String(row[titleColumn.hrefKey]) : ''"
          >
            <span v-for="label in activeToggleLabels(row)" :key="label" :class="statusBadgeClass('neutral')">{{ label }}</span>
            <RowActionsMenu
              :menu-id="`${props.collection}-${row.id}-actions-mobile`"
              :record-label="recordLabel(row)"
              :actions="rowActions(row, { includeFeatured: true })"
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

    <FormModal
      v-if="modalOpen"
      :title="editingRow ? `Editar ${props.entityName}` : newLabel"
      :submit-label="editingRow ? 'Guardar cambios' : `Crear ${props.entityName}`"
      :fields="props.fields"
      :initial-values="initialValues"
      :submitting="submitting"
      :form-error="formError"
      :field-errors="fieldErrors"
      @close="closeForm"
      @submit="submitForm"
    />

    <CapConfirmDialog
      :open="pendingDeleteRow !== null"
      :title="pendingDeleteRow ? deleteDialogTitle(entity, recordLabel(pendingDeleteRow)) : ''"
      message="Desaparece del portal de inmediato. No se puede deshacer."
      :confirm-label="`Eliminar ${props.entityName}`"
      icon="delete-outline"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="removal.cancel"
    />
  </div>
</template>
