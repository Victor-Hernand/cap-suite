<script setup lang="ts">
import { pagerButtonClass } from './formStyles';

const page = defineModel<number>('page', { required: true });

const props = defineProps<{
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  columnSpan: number;
}>();
</script>

<template>
  <tfoot v-if="props.pageCount > 1">
    <tr>
      <td :colspan="props.columnSpan" class="border-t border-edge px-4 py-2">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-body">
          <span>Mostrando {{ props.rangeStart }}–{{ props.rangeEnd }} de {{ props.total }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :class="pagerButtonClass"
              :disabled="page === 1"
              @click="page -= 1"
            >Anterior</button>
            <span>Página {{ page }} de {{ props.pageCount }}</span>
            <button
              type="button"
              :class="pagerButtonClass"
              :disabled="page === props.pageCount"
              @click="page += 1"
            >Siguiente</button>
          </div>
        </div>
      </td>
    </tr>
  </tfoot>
</template>
