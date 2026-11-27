<script setup lang="ts">
import { ref, watch } from 'vue';
import SortableHeader from './SortableHeader.vue';
import { tableCellClass, tableClass, tableHeadClass } from '../../lib/capClasses';
import type { Column, Row } from './types';
import type { SortState } from './useTableView';

const props = defineProps<{
  columns: Column[];
  rows: Row[];
  sortState: (key: string) => SortState;
}>();

const emit = defineEmits<{ sort: [key: string] }>();

defineSlots<{
  cell(slotProps: { row: Row; column: Column }): unknown;
  actions(slotProps: { row: Row }): unknown;
}>();

// Las filas entran escalonadas solo al montar; al ordenar, filtrar o paginar se reemplazan al instante.
const staggerRows = ref(true);
watch(
  () => props.rows,
  () => {
    staggerRows.value = false;
  },
);
</script>

<template>
  <div class="isolate rounded-cap-card border border-cap-divider bg-cap-card">
    <table :class="tableClass">
      <thead>
        <tr>
          <SortableHeader
            v-for="(column, index) in props.columns"
            :key="column.key"
            :class="index === 0 ? 'rounded-tl-cap-card' : ''"
            :label="column.label"
            :sort-state="props.sortState(column.key)"
            @sort="emit('sort', column.key)"
          />
          <th scope="col" class="w-12 rounded-tr-cap-card" :class="tableHeadClass"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody
        class="[&>tr:last-child>td:first-child]:rounded-bl-cap-card [&>tr:last-child>td:last-child]:rounded-br-cap-card"
        :class="{ 'cap-stagger-rows': staggerRows }"
      >
        <tr v-for="row in props.rows" :key="row.id" class="transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2">
          <td v-for="column in props.columns" :key="column.key" :class="tableCellClass">
            <slot name="cell" :row="row" :column="column" />
          </td>
          <td :class="[tableCellClass, 'w-12 text-right']">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
