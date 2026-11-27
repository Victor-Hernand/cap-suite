<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { actions } from 'astro:actions';
import CapAlert from '../../design/vue/CapAlert.vue';
import CapButton from '../../design/vue/CapButton.vue';
import CapConfirmDialog from '../../design/vue/CapConfirmDialog.vue';
import FileDrop from './FileDrop.vue';
import FormField from './FormField.vue';
import PolicyAttachmentsSection from './PolicyAttachmentsSection.vue';
import PolicyGuidelinesSection from './PolicyGuidelinesSection.vue';
import PolicyVersionsSection from './PolicyVersionsSection.vue';
import RequiredMark from './RequiredMark.vue';
import StoredFileLink from './StoredFileLink.vue';
import { deleteDialogTitle, outcomeTitle, type EntityNames } from './entityLabels';
import { buildPolicyFormData, createEditorState, snapshotOf } from './policyEditorState';
import { policyContentFields, policyGeneralFields, policyUploadFields } from './policyEditorFields';
import { navigateWithToast, useActionForm } from './useActionForm';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import type { Department } from '../../data/departments';
import { policyStatuses } from '../../data/policies';
import { uploadPickerRules } from '../../lib/fieldRules';
import type { PolicyDetail } from '../../lib/policies';
import { statusBadgeClass } from '../../design/statuses.js';
import {
  cardClass,
  fieldErrorClass,
  fieldHelpClass,
  fieldLabelClass,
  fieldSelectClass,
  sectionTitleClass,
  withFieldError,
} from '../../lib/capClasses';

const props = withDefaults(defineProps<{ policy?: PolicyDetail | null; departments?: Department[] }>(), {
  policy: null,
  departments: () => [],
});

const state = reactive(createEditorState(props.policy));
const savedSnapshot = snapshotOf(state);
const hasPendingChanges = computed(() => snapshotOf(state) !== savedSnapshot);
const policyId = props.policy?.id ?? null;

const POLICY: EntityNames = { singular: 'política', plural: 'políticas', gender: 'f' };

const { submitting, formError, fieldErrors, runAction, submit } = useActionForm();
const alertRef = ref<HTMLElement | null>(null);
const lastAction = ref<'save' | 'delete'>('save');
const failedActionTitle = computed(() =>
  lastAction.value === 'delete' ? 'No se completó la acción' : 'No se pudo guardar la política',
);
const removal = useDeleteConfirmation<number>(runAction);
const { pendingTarget: pendingDeleteId, deleting } = removal;
const leavingAfterSuccess = ref(false);
const shouldWarnBeforeLeaving = computed(() => hasPendingChanges.value && !leavingAfterSuccess.value);

const generalFields = policyGeneralFields(props.departments);

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

function leaveTo(url: string, toast: CapToastOptions) {
  leavingAfterSuccess.value = true;
  navigateWithToast(toast, url);
}

function save() {
  lastAction.value = 'save';
  const formData = buildPolicyFormData(state, policyId);
  const toast: CapToastOptions = {
    status: 'ok',
    title: outcomeTitle(POLICY, policyId === null ? 'created' : 'updated'),
    detail: state.fields.title,
  };
  submit(policyUploadFields, formData, () => actions.policies.save(formData), ({ id }) => leaveTo(`/admin/politicas/${id}`, toast));
}

function removePolicy() {
  lastAction.value = 'delete';
  removal.confirm(
    (id) => actions.policies.remove({ id }),
    () => leaveTo('/admin/politicas', { status: 'ok', title: outcomeTitle(POLICY, 'deleted'), detail: props.policy?.title }),
  );
}

const sectionHeadingClass = `${sectionTitleClass} mb-4`;
</script>

<template>
  <!-- novalidate: los mensajes de validación los da el servidor, en español. -->
  <form class="flex max-w-7xl flex-col gap-8" novalidate @submit.prevent="save">
    <div v-if="formError" ref="alertRef">
      <CapAlert status="error" :title="failedActionTitle" :detail="[formError, ...listErrors].join(' ')" />
    </div>

    <section :class="cardClass">
      <h2 :class="sectionHeadingClass">Datos generales</h2>
      <div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <FormField
          v-for="field in generalFields"
          :key="field.name"
          :class="field.name === 'title' ? 'md:col-span-2' : ''"
          :field="field"
          :value="state.fields[field.name]"
          :error="fieldErrors[field.name]?.[0]"
          @update:value="state.fields[field.name] = $event"
        />
        <div>
          <label :class="fieldLabelClass" for="field-status">Estado <RequiredMark /></label>
          <select
            id="field-status"
            v-model="state.fields.status"
            aria-required="true"
            :class="withFieldError(fieldSelectClass, Boolean(fieldErrors.status?.[0]))"
            :disabled="isStoredDraft"
          >
            <option v-for="status in statusOptions" :key="status.id" :value="status.id">{{ status.label }}</option>
          </select>
          <p v-if="isStoredDraft" :class="fieldHelpClass">Para publicar usa el botón «Publicar versión».</p>
          <p v-if="fieldErrors.status?.[0]" :class="fieldErrorClass">{{ fieldErrors.status[0] }}</p>
        </div>
      </div>
    </section>

    <section :class="cardClass">
      <h2 :class="sectionHeadingClass">Contenido</h2>
      <div class="flex flex-col gap-4">
        <FormField
          v-for="field in policyContentFields"
          :key="field.name"
          :field="field"
          :value="state.fields[field.name]"
          :error="fieldErrors[field.name]?.[0]"
          @update:value="state.fields[field.name] = $event"
        />
      </div>
    </section>

    <section :class="cardClass">
      <h2 :class="sectionHeadingClass">Documento oficial</h2>
      <FileDrop
        name="officialFile"
        label="Archivo"
        :hint="officialFilePicker.hint"
        :accept="officialFilePicker.accept"
        note="Obligatorio para publicar."
        :error="fieldErrors.officialFile?.[0]"
        @change="state.officialFile = $event"
      />
      <StoredFileLink
        v-if="props.policy?.officialFilePath"
        :file-path="props.policy.officialFilePath"
        label="Documento actual"
      />
    </section>

    <section :class="cardClass">
      <h2 :class="sectionHeadingClass">Lineamientos</h2>
      <PolicyGuidelinesSection v-model:guidelines="state.guidelines" />
    </section>

    <section :class="cardClass">
      <h2 :class="sectionHeadingClass">Anexos</h2>
      <PolicyAttachmentsSection v-model:attachments="state.attachments" />
    </section>

    <section :class="cardClass">
      <h2 :class="sectionHeadingClass">Control de cambios</h2>
      <PolicyVersionsSection
        v-model:versions="state.versions"
        :policy-id="policyId"
        :current-version="props.policy?.version ?? null"
        :is-draft="isStoredDraft"
        :has-pending-changes="hasPendingChanges"
      />
    </section>

    <div
      class="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-cap-card border border-cap-divider bg-cap-card px-5 py-3 shadow-md max-lg:bottom-24"
    >
      <span :class="statusBadgeClass(hasPendingChanges ? 'warning' : 'neutral')">
        <span class="h-1.5 w-1.5 rounded-full bg-current" />{{ hasPendingChanges ? 'Cambios sin guardar' : 'Sin cambios pendientes' }}
      </span>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <CapButton v-if="policyId !== null" variant="danger" icon="delete-outline" @click="removal.request(policyId)">
          Eliminar política
        </CapButton>
        <CapButton type="submit" :variant="policyId === null ? 'primary' : 'secondary'" :loading="submitting">
          Guardar política
        </CapButton>
      </div>
    </div>

    <CapConfirmDialog
      :open="pendingDeleteId !== null"
      :title="deleteDialogTitle(POLICY, props.policy?.title ?? '')"
      message="Desaparece del portal de inmediato. No se puede deshacer."
      confirm-label="Eliminar política"
      icon="delete-outline"
      :loading="deleting"
      @confirm="removePolicy"
      @cancel="removal.cancel"
    />
  </form>
</template>
