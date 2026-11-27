<script setup lang="ts">
import { computed, ref } from 'vue';
import PublishVersionDialog from './PublishVersionDialog.vue';
import RepeatableList from './RepeatableList.vue';
import RequiredMark from './RequiredMark.vue';
import CapButton from '../../design/vue/CapButton.vue';
import { fieldDateClass, fieldInputClass, fieldLabelClass } from '../../lib/capClasses';
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
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-cap-control bg-cap-card-2 p-3">
      <div class="flex items-center gap-3">
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cap-card text-cap-text-soft"
          aria-hidden="true"
        >
          <i class="mdi mdi-tag-outline text-base leading-none" />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">{{ props.currentVersion ?? 'Sin publicar' }}</p>
          <p class="text-xs text-cap-text-soft">{{ currentVersionLabel }}</p>
        </div>
      </div>
      <div v-if="props.policyId !== null" class="flex flex-col items-end gap-1">
        <CapButton icon="publish" :disabled="!canPublish" @click="dialogOpen = true">Publicar versión</CapButton>
        <p v-if="!canPublish" class="text-xs text-cap-text-soft">Guarda los cambios antes de publicar.</p>
      </div>
      <p v-else class="text-xs text-cap-text-soft">Podrás publicar cuando guardes el borrador.</p>
    </div>
    <p class="text-xs text-cap-text-soft">
      Agrega aquí el historial anterior de la política. «Publicar versión» suma su propia línea; si esa versión ya
      está en la lista, reemplaza la línea existente.
    </p>
    <RepeatableList
      v-model:items="versions"
      add-label="Agregar línea de historial"
      empty-text="Sin historial de cambios todavía."
      :create-item="createVersion"
      :reorderable="false"
      marker-icon="history"
    >
      <template #default="{ item }">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label :class="fieldLabelClass" :for="`version-number-${item.key}`">Versión <RequiredMark /></label>
            <input
              :id="`version-number-${item.key}`"
              v-model="item.version"
              type="text"
              :maxlength="FIELD_MAX.badge"
              placeholder="v1.0"
              :class="fieldInputClass"
            />
          </div>
          <div>
            <label :class="fieldLabelClass" :for="`version-date-${item.key}`">Fecha <RequiredMark /></label>
            <input :id="`version-date-${item.key}`" v-model="item.date" type="date" :class="fieldDateClass" />
          </div>
          <div>
            <label :class="fieldLabelClass" :for="`version-author-${item.key}`">Autor <RequiredMark /></label>
            <input
              :id="`version-author-${item.key}`"
              v-model="item.author"
              type="text"
              :maxlength="FIELD_MAX.shortText"
              :class="fieldInputClass"
            />
          </div>
        </div>
        <div class="mt-3">
          <label :class="fieldLabelClass" :for="`version-reason-${item.key}`">Motivo <RequiredMark /></label>
          <input
            :id="`version-reason-${item.key}`"
            v-model="item.reason"
            type="text"
            :maxlength="FIELD_MAX.description"
            :class="fieldInputClass"
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
