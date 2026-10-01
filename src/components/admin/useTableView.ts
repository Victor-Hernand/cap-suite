import { computed, ref, watch, type Ref } from 'vue';
import type { Column, Row } from './types';

const PAGE_SIZE = 10;

type SortDirection = 'asc' | 'desc';

const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

function compareValues(left: unknown, right: unknown): number {
  const leftEmpty = left === null || left === undefined || left === '';
  const rightEmpty = right === null || right === undefined || right === '';
  if (leftEmpty || rightEmpty) return Number(leftEmpty) - Number(rightEmpty);
  if (typeof left === 'boolean' || typeof right === 'boolean') return Number(right) - Number(left);
  return collator.compare(String(left), String(right));
}

/** Filtro de texto, orden por columna y paginación en cliente para las tablas del admin. */
export function useTableView(rows: Ref<Row[]>, columns: Ref<Column[]>) {
  const filterText = ref('');
  const sortKey = ref<string | null>(null);
  const sortDirection = ref<SortDirection>('asc');
  const page = ref(1);

  const filteredRows = computed(() => {
    const query = filterText.value.trim().toLowerCase();
    if (!query) return rows.value;
    return rows.value.filter((row) =>
      columns.value.some((column) => String(row[column.key] ?? '').toLowerCase().includes(query)),
    );
  });

  const sortedRows = computed(() => {
    const key = sortKey.value;
    if (!key) return filteredRows.value;
    const factor = sortDirection.value === 'asc' ? 1 : -1;
    return [...filteredRows.value].sort((left, right) => factor * compareValues(left[key], right[key]));
  });

  const totalFiltered = computed(() => sortedRows.value.length);
  // Subir/bajar solo tiene sentido viendo el orden manual completo: con orden por columna
  // o filtro activo, la fila vecina en la tabla no es su vecina real.
  const isManualOrder = computed(() => sortKey.value === null && filterText.value.trim() === '');
  const pageCount = computed(() => Math.max(1, Math.ceil(totalFiltered.value / PAGE_SIZE)));
  const pageRows = computed(() => sortedRows.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
  const rangeStart = computed(() => (totalFiltered.value === 0 ? 0 : (page.value - 1) * PAGE_SIZE + 1));
  const rangeEnd = computed(() => Math.min(page.value * PAGE_SIZE, totalFiltered.value));

  watch([filterText, sortKey, sortDirection], () => {
    page.value = 1;
  });

  /** Primer clic ordena ascendente, el segundo descendente y el tercero vuelve al orden manual. */
  function toggleSort(key: string) {
    if (sortKey.value !== key) {
      sortKey.value = key;
      sortDirection.value = 'asc';
    } else if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc';
    } else {
      sortKey.value = null;
    }
  }

  return {
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
  };
}
