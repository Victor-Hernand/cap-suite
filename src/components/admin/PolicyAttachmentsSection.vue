<script setup lang="ts">
import FileDrop from './FileDrop.vue';
import RepeatableList from './RepeatableList.vue';
import RequiredMark from './RequiredMark.vue';
import { fieldInputClass, fieldLabelClass, fieldSelectClass } from '../../lib/capClasses';
import StoredFileLink from './StoredFileLink.vue';
import { createAttachment, type AttachmentDraft } from './policyEditorState';
import { attachmentKinds } from '../../data/policies';
import { FIELD_MAX, uploadPickerRules } from '../../lib/fieldRules';

const attachments = defineModel<AttachmentDraft[]>('attachments', { required: true });

const picker = uploadPickerRules('policies');
</script>

<template>
  <RepeatableList
    v-model:items="attachments"
    add-label="Agregar anexo"
    empty-text="Sin anexos. Agrega archivos, enlaces o videos que complementen la política."
    :create-item="createAttachment"
  >
    <template #default="{ item }">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr]">
        <div>
          <label :class="fieldLabelClass" :for="`attachment-kind-${item.key}`">Tipo</label>
          <select :id="`attachment-kind-${item.key}`" v-model="item.kind" :class="fieldSelectClass">
            <option v-for="kind in attachmentKinds" :key="kind.id" :value="kind.id">{{ kind.label }}</option>
          </select>
        </div>
        <div>
          <label :class="fieldLabelClass" :for="`attachment-label-${item.key}`">Nombre <RequiredMark /></label>
          <input
            :id="`attachment-label-${item.key}`"
            v-model="item.label"
            type="text"
            :maxlength="FIELD_MAX.name"
            placeholder="Por ejemplo: Formato de solicitud"
            :class="fieldInputClass"
          />
        </div>
      </div>
      <div class="mt-3">
        <!-- v-show: el selector conserva el archivo elegido si se cambia de tipo y se vuelve. -->
        <div v-show="item.kind === 'file'">
          <FileDrop
            :name="`attachment-file-${item.key}`"
            label="Archivo"
            :hint="picker.hint"
            :accept="picker.accept"
            @change="item.file = $event"
          />
          <StoredFileLink v-if="item.filePath" :file-path="item.filePath" />
        </div>
        <div v-if="item.kind !== 'file'">
          <label :class="fieldLabelClass" :for="`attachment-url-${item.key}`">Dirección <RequiredMark /></label>
          <input
            :id="`attachment-url-${item.key}`"
            v-model="item.url"
            type="url"
            :maxlength="FIELD_MAX.url"
            placeholder="https://…"
            :class="fieldInputClass"
          />
        </div>
      </div>
    </template>
  </RepeatableList>
</template>
