<script setup lang="ts">
import { computed, ref } from 'vue';
import PublishVersionDialog from './PublishVersionDialog.vue';
import RepeatableList from './RepeatableList.vue';
import RequiredMark from './RequiredMark.vue';
import { inputClass, labelClass, primaryButtonClass } from './formStyles';
import { createVersion, type VersionDraft } from './policyEditorState';
import { FIELD_MAX } from '../../lib/fieldRules';

const versions = defineModel<VersionDraft[]>('versions', { required: true });

const props = withDefaults(
  defineProps<{
    policyId?: number | null;
    currentVersion?: string | null;
    /** Un borrador conserva la versión de su última publicación, pero ya no está vigente. */
    isDraft?: boolean;
    hasPendingChanges?: boolean;
  }>(),
  { policyId: null, currentVersion: null, isDraft: true, hasPendingChanges: false },
);

const dialogOpen = ref(false);
const canPublish = computed(() => props.policyId !== null && !props.hasPendingChanges);
const currentVersionLabel = computed(() =>
  props.isDraft && props.currentVersion ? 'Última versión publicada' : 'Versión vigente',
);
const listedVersions = computed(() => versions.value.map((entry) => entry.version));
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-edge bg-canvas px-4 py-3">
      <p class="text-sm text-body">
        {{ currentVersionLabel }}: <span class="font-mono font-semibold text-ink">{{ props.currentVersion ?? 'sin publicar' }}</span>
      </p>
      <button type="button" :class="primaryButtonClass" :disabled="!canPublish" @click="dialogOpen = true">
        {{ canPublish ? 'Publicar versión' : 'Guarda los cambios antes de publicar' }}
      </button>
    </div>
    <p class="mb-3 text-xs text-muted">
      Agrega aquí el historial anterior de la política. «Publicar versión» suma su propia línea; si esa versión ya
      está en la lista, reemplaza la línea existente.
    </p>
    <RepeatableList
      v-model:items="versions"
      add-label="Agregar línea de historial"
      empty-text="Sin historial de cambios todavía."
      :create-item="createVersion"
      :reorderable="false"
    >
      <template #default="{ item }">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label :class="labelClass" :for="`version-number-${item.key}`">VERSIÓN <RequiredMark /></label>
            <input
              :id="`version-number-${item.key}`"
              v-model="item.version"
              type="text"
              :maxlength="FIELD_MAX.badge"
              placeholder="v1.0"
              :class="inputClass"
            />
          </div>
          <div>
            <label :class="labelClass" :for="`version-date-${item.key}`">FECHA <RequiredMark /></label>
            <input :id="`version-date-${item.key}`" v-model="item.date" type="date" :class="inputClass" />
          </div>
          <div>
            <label :class="labelClass" :for="`version-author-${item.key}`">AUTOR <RequiredMark /></label>
            <input
              :id="`version-author-${item.key}`"
              v-model="item.author"
              type="text"
              :maxlength="FIELD_MAX.shortText"
              :class="inputClass"
            />
          </div>
        </div>
        <div class="mt-3">
          <label :class="labelClass" :for="`version-reason-${item.key}`">MOTIVO <RequiredMark /></label>
          <input
            :id="`version-reason-${item.key}`"
            v-model="item.reason"
            type="text"
            :maxlength="FIELD_MAX.description"
            :class="inputClass"
          />
        </div>
      </template>
    </RepeatableList>
    <PublishVersionDialog
      v-if="dialogOpen && props.policyId !== null"
      :policy-id="props.policyId"
      :current-version="props.currentVersion"
      :listed-versions="listedVersions"
      @close="dialogOpen = false"
    />
  </div>
</template>
