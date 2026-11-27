<script setup>
const STATS_CARDS = 4;
const TABLE_COLUMNS = 4;
const KANBAN_COLUMNS = 3;
const KANBAN_CARDS = 3;

defineProps({
  variant: { type: String, default: 'line' },
  rows: { type: Number, default: 8 },
  label: { type: String, default: 'Cargando' },
});
</script>

<template>
  <div v-if="variant === 'table'" class="cap-skeleton-table" role="status" :aria-label="label">
    <span class="cap-skeleton-table__head" aria-hidden="true" />
    <div v-for="row in rows" :key="row" class="cap-skeleton-table__row" aria-hidden="true">
      <span v-for="column in TABLE_COLUMNS" :key="column" class="cap-skeleton" />
    </div>
  </div>

  <div v-else-if="variant === 'stats'" class="cap-skeleton-stats" role="status" :aria-label="label">
    <div v-for="card in STATS_CARDS" :key="card" class="cap-skeleton-stats__card" aria-hidden="true">
      <span class="cap-skeleton cap-skeleton--label" />
      <span class="cap-skeleton cap-skeleton--value" />
    </div>
  </div>

  <div v-else-if="variant === 'kanban'" class="cap-skeleton-kanban" role="status" :aria-label="label">
    <div v-for="column in KANBAN_COLUMNS" :key="column" class="cap-skeleton-kanban__column" aria-hidden="true">
      <span class="cap-skeleton cap-skeleton--label" />
      <div v-for="card in KANBAN_CARDS" :key="card" class="cap-skeleton-kanban__card">
        <span class="cap-skeleton cap-skeleton--label" />
        <span class="cap-skeleton" />
      </div>
    </div>
  </div>

  <span v-else class="cap-skeleton" aria-hidden="true" />
</template>
