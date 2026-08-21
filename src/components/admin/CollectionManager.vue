<script setup lang="ts">
import { computed, ref } from 'vue';
import { actions, isInputError } from 'astro:actions';
import FileDrop from './FileDrop.vue';

type Row = Record<string, unknown> & { id: number };

interface Column {
  key: string;
  label: string;
  kind?: 'text' | 'muted' | 'led' | 'toggle';
}

interface Field {
  name: string;
  label: string;
  kind: 'text' | 'url' | 'email' | 'textarea' | 'select' | 'toggle' | 'file-logo' | 'file-doc';
  options?: { value: string; label: string }[];
  suggestions?: string[];
  required?: boolean;
  placeholder?: string;
}

const props = defineProps<{
  collection: 'apps' | 'resources' | 'contacts' | 'companies';
  rows: Row[];
  columns: Column[];
  fields: Field[];
  entityName: string;
  entityNamePlural: string;
}>();

const group = computed(() => actions[props.collection]);
const filterText = ref('');
const modalOpen = ref(false);
const editingRow = ref<Row | null>(null);
const submitting = ref(false);
const formError = ref('');
const fieldErrors = ref<Record<string, string[]>>({});
const pendingDeleteId = ref<number | null>(null);
const formRef = ref<HTMLFormElement | null>(null);

const visibleRows = computed(() => {
  const query = filterText.value.trim().toLowerCase();
  if (!query) return props.rows;
  return props.rows.filter((row) =>
    props.columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(query)),
  );
});

function openCreate() {
  editingRow.value = null;
  formError.value = '';
  fieldErrors.value = {};
  modalOpen.value = true;
}

function openEdit(row: Row) {
  editingRow.value = row;
  formError.value = '';
  fieldErrors.value = {};
  modalOpen.value = true;
}

function initialValue(field: Field): string {
  const raw = editingRow.value?.[field.name];
  return raw === null || raw === undefined ? '' : String(raw);
}

async function submitForm() {
  if (!formRef.value || submitting.value) return;
  submitting.value = true;
  formError.value = '';
  fieldErrors.value = {};
  const formData = new FormData(formRef.value);
  if (editingRow.value) formData.set('id', String(editingRow.value.id));
  const action = editingRow.value ? group.value.update : group.value.create;
  const { error } = await action(formData);
  submitting.value = false;
  if (!error) {
    window.location.reload();
    return;
  }
  if (isInputError(error)) {
    fieldErrors.value = error.fields;
  } else {
    formError.value = error.message;
  }
}

async function removeRow(id: number) {
  const { error } = await group.value.remove({ id });
  if (error) {
    formError.value = error.message;
    pendingDeleteId.value = null;
    return;
  }
  window.location.reload();
}

async function moveRowBy(id: number, direction: 'up' | 'down') {
  await group.value.move({ id, direction });
  window.location.reload();
}

async function toggleFeatured(row: Row) {
  if (props.collection !== 'apps') return;
  await actions.apps.toggleFeatured({ id: row.id, featured: !row.featured });
  window.location.reload();
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <input
        v-model="filterText"
        type="search"
        placeholder="Filtrar…"
        class="w-48 rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
      />
      <button
        type="button"
        class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white"
        @click="openCreate"
      >
        + Nueva {{ props.entityName }}
      </button>
    </div>

    <p v-if="formError && !modalOpen" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>

    <div class="mt-4 overflow-hidden rounded-xl border border-edge bg-surface">
      <div v-if="props.rows.length === 0" class="px-5 py-10 text-center text-sm text-body">
        Aún no hay {{ props.entityNamePlural }}. Crea la primera con el botón "Nueva {{ props.entityName }}".
      </div>
      <div v-else-if="visibleRows.length === 0" class="px-5 py-10 text-center text-sm text-body">
        Nada coincide con "{{ filterText }}".
      </div>
      <table v-else class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-edge font-mono text-[9px] uppercase tracking-widest text-muted">
            <th v-for="column in props.columns" :key="column.key" class="px-4 py-2 font-medium">{{ column.label }}</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="row.id" class="border-b border-edge/60 last:border-b-0">
            <td v-for="column in props.columns" :key="column.key" class="px-4 py-3">
              <span v-if="column.kind === 'led'" class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full" :style="{ background: String(row.ledColor ?? '#15181D') }"></span>
                {{ row[column.key] ?? '—' }}
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
              <span v-else-if="column.kind === 'muted'" class="text-muted">{{ row[column.key] ?? '—' }}</span>
              <span v-else class="font-semibold">{{ row[column.key] ?? '—' }}</span>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button type="button" class="px-1 text-muted hover:text-ink" aria-label="Subir" @click="moveRowBy(row.id, 'up')">↑</button>
              <button type="button" class="px-1 text-muted hover:text-ink" aria-label="Bajar" @click="moveRowBy(row.id, 'down')">↓</button>
              <button type="button" class="ml-2 font-semibold hover:underline" @click="openEdit(row)">Editar</button>
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
      </table>
    </div>

    <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 pt-16" @click.self="modalOpen = false">
      <form
        ref="formRef"
        class="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl"
        @submit.prevent="submitForm"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-extrabold">
            {{ editingRow ? `Editar ${props.entityName}` : `Nueva ${props.entityName}` }}
          </h2>
          <button type="button" class="text-muted hover:text-ink" aria-label="Cerrar" @click="modalOpen = false">✕</button>
        </div>
        <p v-if="formError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>
        <div class="mt-4 grid grid-cols-1 gap-4">
          <div v-for="field in props.fields" :key="field.name">
            <template v-if="field.kind === 'toggle'">
              <label class="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" :name="field.name" :checked="Boolean(editingRow?.[field.name])" />
                {{ field.label }}
              </label>
            </template>
            <FileDrop
              v-else-if="field.kind === 'file-logo' || field.kind === 'file-doc'"
              :name="field.name"
              :label="field.label"
              :hint="field.kind === 'file-logo' ? 'PNG/SVG/JPG/WebP, máx. 2 MB' : 'PDF u Office, máx. 20 MB'"
              :accept="field.kind === 'file-logo' ? '.png,.svg,.jpg,.jpeg,.webp' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'"
            />
            <template v-else>
              <label class="mb-1 block text-[10px] font-bold tracking-wider text-body" :for="`field-${field.name}`">
                {{ field.label }}
              </label>
              <textarea
                v-if="field.kind === 'textarea'"
                :id="`field-${field.name}`"
                :name="field.name"
                :required="field.required"
                rows="3"
                class="w-full rounded-lg border border-edge px-3 py-2 text-sm"
                :value="initialValue(field)"
              ></textarea>
              <select
                v-else-if="field.kind === 'select'"
                :id="`field-${field.name}`"
                :name="field.name"
                class="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
              >
                <option
                  v-for="option in field.options"
                  :key="option.value"
                  :value="option.value"
                  :selected="initialValue(field) === option.value"
                >{{ option.label }}</option>
              </select>
              <input
                v-else
                :id="`field-${field.name}`"
                :name="field.name"
                :type="field.kind === 'url' ? 'url' : field.kind === 'email' ? 'email' : 'text'"
                :required="field.required"
                :placeholder="field.placeholder"
                :list="field.suggestions ? `list-${field.name}` : undefined"
                class="w-full rounded-lg border border-edge px-3 py-2 text-sm"
                :value="initialValue(field)"
              />
              <datalist v-if="field.suggestions" :id="`list-${field.name}`">
                <option v-for="suggestion in field.suggestions" :key="suggestion" :value="suggestion"></option>
              </datalist>
              <p v-if="fieldErrors[field.name]" class="mt-1 text-xs text-red-700">{{ fieldErrors[field.name][0] }}</p>
            </template>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-edge px-4 py-2 text-sm" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white" :disabled="submitting">
            {{ submitting ? 'Guardando…' : `Guardar ${props.entityName}` }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
