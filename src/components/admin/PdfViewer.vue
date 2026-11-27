<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import CapSkeleton from '../../design/vue/CapSkeleton.vue';
import { inlineLinkClass } from '../../lib/capClasses';

const props = defineProps<{
  src: string;
  title: string;
}>();

// Por debajo de este tiempo no se pinta el esqueleto, para que no parpadee.
const SKELETON_DELAY_MS = 120;

// Se muestra desde una URL blob: y no apuntando el iframe a `src`, porque el
// servidor desplegado responde con X-Frame-Options/frame-ancestors y el
// navegador se niega a mostrar esa respuesta dentro de un iframe.
const blobUrl = ref('');
const failed = ref(false);
const showSkeleton = ref(false);
let skeletonTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(async () => {
  skeletonTimer = setTimeout(() => {
    showSkeleton.value = true;
  }, SKELETON_DELAY_MS);
  try {
    const response = await fetch(props.src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    blobUrl.value = URL.createObjectURL(await response.blob());
  } catch {
    failed.value = true;
  } finally {
    clearTimeout(skeletonTimer);
  }
});

onBeforeUnmount(() => {
  clearTimeout(skeletonTimer);
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value);
});
</script>

<template>
  <iframe
    v-if="blobUrl"
    :src="blobUrl"
    :title="props.title"
    class="h-[80vh] w-full rounded-cap-control border border-cap-divider bg-cap-card"
  ></iframe>
  <div v-else-if="failed" role="alert" class="cap-alert cap-alert--error">
    <i class="cap-alert__icon mdi mdi-alert-circle-outline" aria-hidden="true" />
    <div>
      <strong class="cap-alert__title">No se pudo mostrar el PDF aquí</strong>
      <span class="cap-alert__detail">
        <a :href="props.src" target="_blank" rel="noopener" :class="inlineLinkClass">Ábrelo en una pestaña nueva</a>
        o descárgalo.
      </span>
    </div>
  </div>
  <div v-else role="status" aria-label="Cargando el PDF">
    <!-- Alto en línea: .cap-skeleton fija 16 px fuera de las capas de Tailwind y anula h-[80vh]. -->
    <CapSkeleton v-if="showSkeleton" class="rounded-cap-control" :style="{ height: '80vh' }" />
  </div>
</template>
