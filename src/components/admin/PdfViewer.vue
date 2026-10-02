<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{
  src: string;
  title: string;
}>();

// Se muestra desde una URL blob: y no apuntando el iframe a `src`, porque el
// servidor desplegado responde con X-Frame-Options/frame-ancestors y el
// navegador se niega a mostrar esa respuesta dentro de un iframe.
const blobUrl = ref('');
const failed = ref(false);

onMounted(async () => {
  try {
    const response = await fetch(props.src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    blobUrl.value = URL.createObjectURL(await response.blob());
  } catch {
    failed.value = true;
  }
});

onBeforeUnmount(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value);
});
</script>

<template>
  <iframe
    v-if="blobUrl"
    :src="blobUrl"
    :title="props.title"
    class="h-[80vh] w-full rounded-xl border border-edge bg-surface"
  ></iframe>
  <div
    v-else
    class="flex h-40 items-center justify-center rounded-xl border border-edge bg-surface px-5 text-center text-sm text-body"
    :role="failed ? 'alert' : 'status'"
  >
    <template v-if="failed">
      No se pudo mostrar el PDF aquí.
      <a :href="props.src" target="_blank" rel="noopener" class="ml-1 font-semibold text-ink underline">Ábrelo en una pestaña nueva</a>.
    </template>
    <template v-else>Cargando PDF…</template>
  </div>
</template>
