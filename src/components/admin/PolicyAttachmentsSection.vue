<script setup lang="ts">
import FileDrop from './FileDrop.vue';
import RepeatableList from './RepeatableList.vue';
import RequiredMark from './RequiredMark.vue';
import { inputClass, labelClass, selectClass } from './formStyles';
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
          <label :class="labelClass" :for="`attachment-kind-${item.key}`">TIPO</label>
          <select :id="`attachment-kind-${item.key}`" v-model="item.kind" :class="selectClass">
            <option v-for="kind in attachmentKinds" :key="kind.id" :value="kind.id">{{ kind.label }}</option>
          </select>
        </div>
        <div>
          <label :class="labelClass" :for="`attachment-label-${item.key}`">NOMBRE <RequiredMark /></label>
          <input
            :id="`attachment-label-${item.key}`"
            v-model="item.label"
            type="text"
            :maxlength="FIELD_MAX.name"
            placeholder="Por ejemplo: Formato de solicitud"
            :class="inputClass"
          />
        </div>
      </div>
      <div class="mt-3">
        <!-- v-show: el selector conserva el archivo elegido si se cambia de tipo y se vuelve. -->
        <div v-show="item.kind === 'file'">
          <FileDrop
            :name="`attachment-file-${item.key}`"
            label="ARCHIVO"
            :hint="picker.hint"
            :accept="picker.accept"
            @change="item.file = $event"
          />
          <StoredFileLink v-if="item.filePath" :file-path="item.filePath" />
        </div>
        <div v-if="item.kind !== 'file'">
          <label :class="labelClass" :for="`attachment-url-${item.key}`">DIRECCIÓN <RequiredMark /></label>
          <input
            :id="`attachment-url-${item.key}`"
            v-model="item.url"
            type="url"
            :maxlength="FIELD_MAX.url"
            placeholder="https://…"
            :class="inputClass"
          />
        </div>
      </div>
    </template>
  </RepeatableList>
</template>
