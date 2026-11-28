<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CapSegmented from './CapSegmented.vue';
import { initialsOf } from './helpers.js';
import { bindKanban } from '../shell/js/kanban.js';

const props = defineProps({
  columns: { type: Array, required: true },
  cards: { type: Array, required: true },
  label: { type: String, default: 'Tablero' },
  pickerLabel: { type: String, default: 'Etapa' },
});

const emit = defineEmits(['move', 'add', 'column-menu', 'card-menu']);

const PRIORITY_LABELS = { high: 'Prioridad alta', medium: 'Prioridad media' };
const priorityLabel = (priority) => PRIORITY_LABELS[priority] ?? 'Prioridad normal';

const board = ref(null);
const activeColumn = ref(props.columns[0]?.id);
let controls = null;
let pendingFocusId = null;

const pickerItems = computed(() => props.columns.map(({ id, title }) => ({ label: title, value: id })));

const cardsByColumn = computed(() => {
  const groups = Object.fromEntries(props.columns.map((column) => [column.id, []]));
  props.cards.forEach((card) => groups[card.column]?.push(card));
  return groups;
});

// El vdom es la verdad: el nodo vuelve a su origen y la tarjeta solo cambia de columna
// cuando el padre actualiza `cards`. Si no lo hace, el movimiento queda rechazado.
const restoreAndEmitMove = (event) => {
  const { cardId, from, fromIndex } = event.detail;
  const focusWasInBoard = board.value.contains(document.activeElement);
  controls.moveCard(cardId, from, fromIndex);
  if (focusWasInBoard) {
    pendingFocusId = cardId;
    controls.findCard(cardId)?.focus();
  }
  emit('move', event.detail);
};

// Vue recrea el <article> que cambia de lista y el foco cae en <body>. Si el usuario ya lo
// llevó a otra parte, no se le quita.
const focusPendingCard = () => {
  if (pendingFocusId === null) return;
  const focusWasDropped = !document.activeElement || document.activeElement === document.body;
  if (focusWasDropped || board.value.contains(document.activeElement)) controls.findCard(pendingFocusId)?.focus();
  pendingFocusId = null;
};

onMounted(() => {
  controls = bindKanban(board.value);
  board.value.addEventListener('cap:kanban-move', restoreAndEmitMove);
});

onBeforeUnmount(() => {
  board.value?.removeEventListener('cap:kanban-move', restoreAndEmitMove);
  controls?.destroy();
});

watch(() => props.cards, async () => {
  await nextTick();
  controls?.refresh();
  focusPendingCard();
}, { deep: true });

watch(() => props.columns, (columns) => {
  if (!columns.some((column) => column.id === activeColumn.value)) activeColumn.value = columns[0]?.id;
});
</script>

<template>
  <div>
    <CapSegmented
      v-model="activeColumn"
      class="cap-kanban__picker"
      :items="pickerItems"
      :label="pickerLabel"
      data-cap-kanban-picker
    />
    <section ref="board" class="cap-kanban" :aria-label="label" data-cap-kanban>
      <div
        v-for="column in columns"
        :key="column.id"
        class="cap-kanban__column"
        :data-cap-kanban-column="column.id"
        :data-tone="column.tone"
        :data-wip-limit="column.wipLimit"
        :data-active="column.id === activeColumn ? 'true' : undefined"
      >
        <header class="cap-kanban__head">
          <span class="cap-kanban__dot" aria-hidden="true" />
          <h3 class="cap-kanban__title">{{ column.title }}</h3>
          <span class="cap-kanban__count" data-cap-kanban-count>{{ cardsByColumn[column.id].length }}</span>
          <span v-if="column.wipLimit" class="cap-kanban__wip" />
          <button
            class="cap-kanban__action"
            type="button"
            :aria-label="`Agregar en ${column.title}`"
            @click="emit('add', column.id)"
          >
            <i class="mdi mdi-plus" aria-hidden="true" />
          </button>
          <button
            class="cap-kanban__action"
            type="button"
            aria-label="Opciones de la columna"
            @click="emit('column-menu', column.id)"
          >
            <i class="mdi mdi-dots-horizontal" aria-hidden="true" />
          </button>
        </header>

        <div class="cap-kanban__list" data-cap-kanban-list>
          <div v-if="column.emptyTitle" class="cap-kanban__empty">
            <i class="mdi mdi-tray-arrow-down" aria-hidden="true" />
            <p>{{ column.emptyTitle }}</p>
            <p v-if="column.emptyHint">{{ column.emptyHint }}</p>
          </div>
          <article
            v-for="card in cardsByColumn[column.id]"
            :key="card.id"
            class="cap-kanban-card"
            :class="{ 'cap-kanban-card--blocked': card.blocked }"
            :data-cap-kanban-card="card.id"
            tabindex="0"
            draggable="true"
          >
            <slot name="card" :card="card">
              <div class="cap-kanban-card__top">
                <span
                  class="cap-kanban-card__priority"
                  role="img"
                  :aria-label="priorityLabel(card.priority)"
                  :data-level="card.priority"
                />
                <span>{{ card.code }}</span>
                <button
                  class="cap-kanban-card__menu"
                  type="button"
                  aria-label="Más acciones"
                  @click="emit('card-menu', card.id)"
                >
                  <i class="mdi mdi-dots-vertical" aria-hidden="true" />
                </button>
              </div>
              <p class="cap-kanban-card__title">{{ card.title }}</p>
              <div v-if="card.amount || card.badge" class="cap-kanban-card__row">
                <span v-if="card.amount" class="cap-kanban-card__amount">{{ card.amount }}</span>
                <span v-if="card.badge" class="cap-kanban-card__badge" :data-status="card.badge.status">
                  <i v-if="card.badge.icon" :class="['mdi', `mdi-${card.badge.icon}`]" aria-hidden="true" />
                  {{ card.badge.text }}
                </span>
              </div>
              <div v-if="card.assignees?.length || card.tag || card.meta" class="cap-kanban-card__foot">
                <span v-if="card.assignees?.length" class="cap-kanban-card__avatars">
                  <span
                    v-for="assignee in card.assignees"
                    :key="assignee.name"
                    class="cap-kanban-card__avatar"
                    :title="assignee.name"
                  >{{ assignee.initials || initialsOf(assignee.name) }}</span>
                </span>
                <span v-if="card.tag" class="cap-kanban-card__tag">{{ card.tag }}</span>
                <span v-if="card.meta" class="cap-kanban-card__meta">
                  <i v-if="card.meta.icon" :class="['mdi', `mdi-${card.meta.icon}`]" aria-hidden="true" />
                  {{ card.meta.text }}
                </span>
              </div>
            </slot>
          </article>
        </div>

        <button v-if="column.addLabel" class="cap-kanban__add" type="button" @click="emit('add', column.id)">
          {{ column.addLabel }}
        </button>
      </div>
      <p class="cap-kanban__live" aria-live="polite" />
    </section>
  </div>
</template>
