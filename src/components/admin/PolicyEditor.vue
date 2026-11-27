<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { actions } from 'astro:actions';
import FileDrop from './FileDrop.vue';
import FormField from './FormField.vue';
import PolicyAttachmentsSection from './PolicyAttachmentsSection.vue';
import PolicyGuidelinesSection from './PolicyGuidelinesSection.vue';
import PolicyVersionsSection from './PolicyVersionsSection.vue';
import RequiredMark from './RequiredMark.vue';
import StoredFileLink from './StoredFileLink.vue';
import { alertErrorClass, fieldErrorClass, labelClass, primaryButtonClass, selectClass } from './formStyles';
import { buildPolicyFormData, createEditorState, snapshotOf, type ScalarFieldName } from './policyEditorState';
import { useActionForm } from './useActionForm';
import type { Field, FieldOption } from './types';
import { departmentOptionsOf, type Department } from '../../data/departments';
import { policyClassifications, policyStatuses, policyTypes, type ListOption } from '../../data/policies';
import { FIELD_MAX, uploadPickerRules } from '../../lib/fieldRules';
import type { PolicyDetail } from '../../lib/policies';

type EditorField = Field & { name: ScalarFieldName };

const props = withDefaults(defineProps<{ policy?: PolicyDetail | null; departments?: Department[] }>(), {
  policy: null,
  departments: () => [],
});

const state = reactive(createEditorState(props.policy));
const savedSnapshot = snapshotOf(state);
const hasPendingChanges = computed(() => snapshotOf(state) !== savedSnapshot);
const policyId = props.policy?.id ?? null;

const { submitting, formError, fieldErrors, runAction, submit } = useActionForm();
const alertRef = ref<HTMLElement | null>(null);
const confirmingDelete = ref(false);
const deleting = ref(false);
const leavingAfterSuccess = ref(false);
const shouldWarnBeforeLeaving = computed(() => hasPendingChanges.value && !leavingAfterSuccess.value);

const optionsOf = (list: readonly ListOption[]): FieldOption[] => list.map(({ id, label }) => ({ value: id, label }));

const generalFields: EditorField[] = [
  { name: 'title', label: 'TÍTULO', kind: 'text', required: true, maxLength: FIELD_MAX.policyTitle },
  {
    name: 'department',
    label: 'DEPARTAMENTO',
    kind: 'select',
    required: true,
    options: departmentOptionsOf(props.departments),
  },
  { name: 'type', label: 'TIPO DE DOCUMENTO', kind: 'select', required: true, options: optionsOf(policyTypes) },
  { name: 'classification', label: 'CLASIFICACIÓN', kind: 'select', required: true, options: optionsOf(policyClassifications) },
  { name: 'owner', label: 'RESPONSABLE', kind: 'text', maxLength: FIELD_MAX.shortText },
  { name: 'approver', label: 'APROBADOR', kind: 'text', maxLength: FIELD_MAX.shortText },
  { name: 'nextReviewDate', label: 'PRÓXIMA REVISIÓN', kind: 'date' },
];

const contentFields: EditorField[] = [
  { name: 'summary', label: 'RESUMEN', kind: 'textarea', maxLength: FIELD_MAX.longText },
  { name: 'objective', label: 'OBJETIVO', kind: 'textarea', maxLength: FIELD_MAX.longText },
  { name: 'scope', label: 'ÁMBITO DE APLICACIÓN', kind: 'textarea', maxLength: FIELD_MAX.longText },
  { name: 'relatedDocuments', label: 'DOCUMENTOS RELACIONADOS', kind: 'textarea', maxLength: FIELD_MAX.longText },
  { name: 'indicators', label: 'INDICADORES', kind: 'textarea', maxLength: FIELD_MAX.longText },
];

const uploadFields: Field[] = [
  { name: 'officialFile', label: 'Documento oficial', kind: 'file-policy' },
  { name: 'attachmentFiles', label: 'Anexo', kind: 'file-policy' },
];

const officialFilePicker = uploadPickerRules('policies');
const isStoredDraft = (props.policy?.status ?? 'draft') === 'draft';
// Un borrador solo sale de ese estado con «Publicar versión», nunca desde este select.
const statusOptions = isStoredDraft ? policyStatuses.filter(({ id }) => id === 'draft') : policyStatuses;

const listErrors = computed(() =>
  (['guidelines', 'attachments', 'versions'] as const).flatMap((name) => fieldErrors.value[name] ?? []),
);

watch(formError, async (message) => {
  if (!message) return;
  await nextTick();
  alertRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

function warnAboutUnsavedChanges(event: BeforeUnloadEvent) {
  event.preventDefault();
}

// sync: leaveTo navega justo después de cambiar el estado; el aviso debe quitarse antes.
watch(
  shouldWarnBeforeLeaving,
  (shouldWarn) => {
    if (shouldWarn) window.addEventListener('beforeunload', warnAboutUnsavedChanges);
    else window.removeEventListener('beforeunload', warnAboutUnsavedChanges);
  },
  { flush: 'sync' },
);

onBeforeUnmount(() => window.removeEventListener('beforeunload', warnAboutUnsavedChanges));

function leaveTo(url: string) {
  leavingAfterSuccess.value = true;
  window.location.assign(url);
}

function save() {
  const formData = buildPolicyFormData(state, policyId);
  submit(uploadFields, formData, () => actions.policies.save(formData), ({ id }) => leaveTo(`/admin/politicas/${id}`));
}

async function removePolicy() {
  if (policyId === null || deleting.value) return;
  deleting.value = true;
  const succeeded = await runAction(() => actions.policies.remove({ id: policyId }), [], () => leaveTo('/admin/politicas'));
  if (succeeded) return;
  deleting.value = false;
  confirmingDelete.value = false;
}

const sectionClass = 'rounded-xl border border-edge bg-surface p-5';
const sectionTitleClass = 'mb-4 font-mono text-[10px] uppercase tracking-widest text-muted';
</script>

<template>
  <!-- novalidate: los mensajes de validación los da el servidor, en español. -->
  <form class="flex max-w-4xl flex-col gap-5" novalidate @submit.prevent="save">
    <div v-if="formError" ref="alertRef" :class="alertErrorClass" role="alert">
      <p>{{ formError }}</p>
      <ul v-if="listErrors.length > 0" class="mt-1 list-disc pl-5">
        <li v-for="message in listErrors" :key="message">{{ message }}</li>
      </ul>
    </div>

    <section :class="sectionClass">
      <h2 :class="sectionTitleClass">Datos generales</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          v-for="field in generalFields"
          :key="field.name"
          :class="field.name === 'title' ? 'sm:col-span-2' : ''"
          :field="field"
          :value="state.fields[field.name]"
          :error="fieldErrors[field.name]?.[0]"
          @update:value="state.fields[field.name] = $event"
        />
        <div>
          <label :class="labelClass" for="field-status">ESTADO <RequiredMark /></label>
          <select id="field-status" v-model="state.fields.status" :class="selectClass" :disabled="isStoredDraft">
            <option v-for="status in statusOptions" :key="status.id" :value="status.id">{{ status.label }}</option>
          </select>
          <p v-if="isStoredDraft" class="mt-1 text-xs text-muted">Para publicar usa el botón Publicar versión.</p>
          <p v-if="fieldErrors.status?.[0]" :class="fieldErrorClass">{{ fieldErrors.status[0] }}</p>
        </div>
      </div>
    </section>

    <section :class="sectionClass">
      <h2 :class="sectionTitleClass">Contenido</h2>
      <div class="grid grid-cols-1 gap-4">
        <FormField
          v-for="field in contentFields"
          :key="field.name"
          :field="field"
          :value="state.fields[field.name]"
          :error="fieldErrors[field.name]?.[0]"
          @update:value="state.fields[field.name] = $event"
        />
      </div>
    </section>

    <section :class="sectionClass">
      <h2 :class="sectionTitleClass">Documento oficial</h2>
      <FileDrop
        name="officialFile"
        label="ARCHIVO"
        :hint="officialFilePicker.hint"
        :accept="officialFilePicker.accept"
        note="Obligatorio para publicar."
        @change="state.officialFile = $event"
      />
      <StoredFileLink
        v-if="props.policy?.officialFilePath"
        :file-path="props.policy.officialFilePath"
        label="Documento actual"
      />
    </section>

    <section :class="sectionClass">
      <h2 :class="sectionTitleClass">Lineamientos</h2>
      <PolicyGuidelinesSection v-model:guidelines="state.guidelines" />
    </section>

    <section :class="sectionClass">
      <h2 :class="sectionTitleClass">Anexos</h2>
      <PolicyAttachmentsSection v-model:attachments="state.attachments" />
    </section>

    <section :class="sectionClass">
      <h2 :class="sectionTitleClass">Control de cambios</h2>
      <PolicyVersionsSection
        v-model:versions="state.versions"
        :policy-id="policyId"
        :current-version="props.policy?.version ?? null"
        :is-draft="isStoredDraft"
        :has-pending-changes="hasPendingChanges"
      />
    </section>

    <div class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-edge bg-canvas py-4">
      <p class="text-xs" :class="hasPendingChanges ? 'font-semibold text-ink' : 'text-muted'">
        {{ hasPendingChanges ? 'Cambios pendientes sin guardar' : 'Sin cambios pendientes' }}
      </p>
      <div class="ml-auto flex items-center gap-2">
        <template v-if="policyId !== null">
          <button
            v-if="!confirmingDelete"
            type="button"
            class="rounded-lg border border-edge px-4 py-2 text-sm text-red-700"
            @click="confirmingDelete = true"
          >Eliminar política</button>
          <template v-else>
            <button type="button" class="rounded-lg border border-edge px-4 py-2 text-sm text-ink" @click="confirmingDelete = false">
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              :disabled="deleting"
              @click="removePolicy"
            >{{ deleting ? 'Eliminando…' : '¿Eliminar definitivamente?' }}</button>
          </template>
        </template>
        <button type="submit" :class="primaryButtonClass" :disabled="submitting">
          {{ submitting ? 'Guardando…' : 'Guardar política' }}
        </button>
      </div>
    </div>
  </form>
</template>
