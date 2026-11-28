const CARD_SELECTOR = '[data-cap-kanban-card]';
const COLUMN_SELECTOR = '[data-cap-kanban-column]';
const LIST_SELECTOR = '[data-cap-kanban-list]';

// Vue e initShell pueden enlazar el mismo tablero: el segundo recibe los controles del primero.
const boundBoards = new WeakMap();

const columnOf = (element) => element.closest(COLUMN_SELECTOR);
const columnId = (column) => column.dataset.capKanbanColumn;
const listOf = (column) => column.querySelector(LIST_SELECTOR);
const cardsOf = (list) => (list ? [...list.querySelectorAll(`:scope > ${CARD_SELECTOR}`)] : []);

function cardLabel(card) {
  const top = card.querySelector('.cap-kanban-card__top')?.cloneNode(true);
  top?.querySelector('.cap-kanban-card__menu')?.remove();
  return top?.textContent.trim() || card.dataset.capKanbanCard;
}

function columnTitle(column) {
  return column.querySelector('.cap-kanban__title')?.textContent.trim() || columnId(column);
}

function findLiveRegion(board) {
  const existing = board.querySelector('.cap-kanban__live');
  if (existing) return existing;
  const region = document.createElement('p');
  region.className = 'cap-kanban__live';
  region.setAttribute('aria-live', 'polite');
  board.append(region);
  return region;
}

function refreshColumn(column) {
  const count = cardsOf(listOf(column)).length;
  const counter = column.querySelector('[data-cap-kanban-count]');
  if (counter) counter.textContent = String(count);

  const wip = column.querySelector('.cap-kanban__wip');
  if (!wip || column.dataset.wipLimit === undefined) return;
  const limit = Number(column.dataset.wipLimit);
  if (!Number.isFinite(limit)) return;
  wip.textContent = `${count} / ${limit}`;
  if (count >= limit) wip.dataset.full = 'true';
  else delete wip.dataset.full;
}

export function bindKanban(board, { onMove } = {}) {
  if (boundBoards.has(board)) return boundBoards.get(board);
  board.dataset.capKanbanBound = 'true';

  const listeners = new AbortController();
  const { signal } = listeners;
  const liveRegion = findLiveRegion(board);
  let held = null;
  // Mover un nodo enfocado lo desenfoca: ese focusout no es «el foco salió del tablero».
  let repositioningHeldCard = false;
  let dragged = null;
  let draggingFrame = null;
  let picker = null;
  let overList = null;

  const columns = () => [...board.querySelectorAll(COLUMN_SELECTOR)];
  const findCard = (id) => board.querySelector(`[data-cap-kanban-card="${CSS.escape(String(id))}"]`);
  const findColumn = (id) => columns().find((column) => columnId(column) === String(id));
  const positionOf = (card) => ({ columnId: columnId(columnOf(card)), index: cardsOf(card.parentElement).indexOf(card) });

  const announce = (text) => {
    liveRegion.textContent = text;
  };

  const announcePosition = (card) => {
    const cards = cardsOf(card.parentElement);
    const title = columnTitle(columnOf(card));
    announce(`${cardLabel(card)} movida a ${title}, posición ${cards.indexOf(card) + 1} de ${cards.length}`);
  };

  const refresh = () => columns().forEach(refreshColumn);

  const markOver = (list) => {
    if (list === overList) return;
    if (overList) delete overList.dataset.over;
    if (list) list.dataset.over = 'true';
    overList = list;
  };

  const rememberOrigin = (card) => ({ card, list: card.parentElement, nextSibling: card.nextSibling, ...positionOf(card) });

  const emitMoveIfChanged = (origin) => {
    const { card } = origin;
    const target = positionOf(card);
    if (target.columnId === origin.columnId && target.index === origin.index) return;
    const detail = {
      cardId: card.dataset.capKanbanCard,
      from: origin.columnId,
      fromIndex: origin.index,
      to: target.columnId,
      index: target.index,
    };
    board.dispatchEvent(new CustomEvent('cap:kanban-move', { bubbles: true, detail }));
    onMove?.(detail);
  };

  const releaseCard = (card) => {
    delete card.dataset.dragging;
    markOver(null);
  };

  const finishMove = (origin) => {
    releaseCard(origin.card);
    refresh();
    announcePosition(origin.card);
    emitMoveIfChanged(origin);
  };

  // Mover el nodo en el DOM le quita el foco en algunos navegadores.
  // La columna se muestra antes de enfocar: en móvil una columna inactiva tiene display: none.
  const placeHeldCard = (list, beforeNode) => {
    const changesColumn = columnOf(list) !== columnOf(held.card);
    repositioningHeldCard = true;
    try {
      list.insertBefore(held.card, beforeNode);
      if (changesColumn) showColumn(columnId(columnOf(list)));
      held.card.focus();
    } finally {
      repositioningHeldCard = false;
    }
    markOver(list);
    refresh();
    announcePosition(held.card);
  };

  const pickUp = (card) => {
    held = rememberOrigin(card);
    card.dataset.dragging = 'true';
    markOver(card.parentElement);
    announce(`${cardLabel(card)} tomada. Flechas para mover, Espacio para soltar, Escape para cancelar`);
  };

  const drop = () => {
    const origin = held;
    held = null;
    finishMove(origin);
  };

  // Si el foco ya salió del tablero, refocar la tarjeta le pelearía el Tab o el clic al usuario.
  const cancel = ({ refocus = true } = {}) => {
    const { card, list, nextSibling } = held;
    held = null;
    list.insertBefore(card, nextSibling?.parentNode === list ? nextSibling : null);
    releaseCard(card);
    refresh();
    if (refocus) card.focus();
    announce(`${cardLabel(card)} devuelta a ${columnTitle(columnOf(card))}`);
  };

  const moveWithinColumn = (step) => {
    const cards = cardsOf(held.card.parentElement);
    const neighbour = cards[cards.indexOf(held.card) + step];
    if (!neighbour) return;
    placeHeldCard(neighbour.parentElement, step < 0 ? neighbour : neighbour.nextSibling);
  };

  const moveToNeighbourColumn = (step) => {
    const allColumns = columns();
    const neighbour = allColumns[allColumns.indexOf(columnOf(held.card)) + step];
    const list = neighbour && listOf(neighbour);
    if (list) placeHeldCard(list, null);
  };

  const heldKeyActions = {
    ' ': drop,
    Enter: drop,
    Escape: cancel,
    ArrowUp: () => moveWithinColumn(-1),
    ArrowDown: () => moveWithinColumn(1),
    ArrowLeft: () => moveToNeighbourColumn(-1),
    ArrowRight: () => moveToNeighbourColumn(1),
  };

  const onKeydown = (event) => {
    // Con la tecla sostenida, la repetición tomaría y soltaría la tarjeta de inmediato.
    const isRepeatedToggle = event.repeat && (event.key === ' ' || event.key === 'Enter');
    if (held) {
      const action = heldKeyActions[event.key];
      if (!action) return;
      event.preventDefault();
      if (!isRepeatedToggle) action();
      return;
    }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (!event.target.matches?.(CARD_SELECTOR)) return;
    event.preventDefault();
    if (!isRepeatedToggle) pickUp(event.target);
  };

  const onFocusOut = (event) => {
    if (!held || repositioningHeldCard) return;
    const destination = event.relatedTarget;
    const focusStaysInBoard = Boolean(destination) && board.contains(destination);
    if (!focusStaysInBoard) cancel({ refocus: false });
  };

  const cancelDraggingFrame = () => {
    if (draggingFrame !== null) cancelAnimationFrame(draggingFrame);
    draggingFrame = null;
  };

  const clearDrag = () => {
    cancelDraggingFrame();
    if (dragged) releaseCard(dragged.card);
    dragged = null;
  };

  const onDragStart = (event) => {
    const card = event.target.closest?.(CARD_SELECTOR);
    if (!card) return;
    if (held) cancel();
    dragged = rememberOrigin(card);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      // Firefox no inicia el arrastre sin datos.
      event.dataTransfer.setData('text/plain', card.dataset.capKanbanCard);
    }
    // Un frame después, para que el fantasma nativo no salga girado.
    const markDragging = () => {
      draggingFrame = null;
      card.dataset.dragging = 'true';
    };
    if (typeof requestAnimationFrame === 'function') draggingFrame = requestAnimationFrame(markDragging);
    else markDragging();
  };

  const onDragOver = (event) => {
    const list = dragged && event.target.closest?.(LIST_SELECTOR);
    if (!list) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    markOver(list);
  };

  const onDragLeave = (event) => {
    const list = event.target.closest?.(LIST_SELECTOR);
    if (!list || (event.relatedTarget && list.contains(event.relatedTarget))) return;
    delete list.dataset.over;
  };

  const onDrop = (event) => {
    const list = dragged && event.target.closest?.(LIST_SELECTOR);
    if (!list) return;
    event.preventDefault();
    const origin = dragged;
    const hoveredCard = event.target.closest(CARD_SELECTOR);
    if (hoveredCard !== origin.card) list.insertBefore(origin.card, hoveredCard);
    clearDrag();
    finishMove(origin);
  };

  const activateColumn = (id) => {
    columns().forEach((column) => {
      if (columnId(column) === id) column.dataset.active = 'true';
      else delete column.dataset.active;
    });
  };

  // El clic sincroniza el selector (CapSegmented o pill-nav); en Vue su data-active llega en el
  // siguiente render, así que la columna se activa aquí también para poder enfocar la tarjeta ya.
  const showColumn = (id) => {
    picker?.querySelector(`[value="${id}"]`)?.click();
    activateColumn(id);
  };

  const bindPicker = () => {
    picker = board.parentElement?.querySelector('[data-cap-kanban-picker]') ?? null;
    if (!picker) return;
    picker.addEventListener('cap:segmented-change', (event) => activateColumn(event.detail.value), { signal });
    const pressedButton = picker.querySelector('[aria-pressed="true"]');
    activateColumn(pressedButton?.value ?? columns()[0]?.dataset.capKanbanColumn);
  };

  const moveCard = (cardId, targetColumnId, index = Infinity) => {
    const card = findCard(cardId);
    const column = findColumn(targetColumnId);
    const list = column && listOf(column);
    if (!card || !list) return;
    const otherCards = cardsOf(list).filter((element) => element !== card);
    list.insertBefore(card, otherCards[index] ?? null);
    refresh();
  };

  board.addEventListener('keydown', onKeydown, { signal });
  board.addEventListener('focusout', onFocusOut, { signal });
  board.addEventListener('dragstart', onDragStart, { signal });
  board.addEventListener('dragover', onDragOver, { signal });
  board.addEventListener('dragleave', onDragLeave, { signal });
  board.addEventListener('drop', onDrop, { signal });
  board.addEventListener('dragend', clearDrag, { signal });
  bindPicker();
  refresh();

  const controls = {
    moveCard,
    refresh,
    findCard,
    destroy() {
      clearDrag();
      if (held) cancel({ refocus: false });
      listeners.abort();
      boundBoards.delete(board);
      delete board.dataset.capKanbanBound;
    },
  };
  boundBoards.set(board, controls);
  return controls;
}
