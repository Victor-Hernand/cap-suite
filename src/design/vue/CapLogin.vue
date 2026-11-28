<script setup>
import { computed, ref } from 'vue';
import CapAlert from './CapAlert.vue';
import { toggleTheme } from '../shell/js/theme.js';
import { company } from '../company.js';

const PROVIDERS = {
  microsoft: { label: 'Microsoft', logo: new URL('../logos/microsoft.svg', import.meta.url).href },
  google: { label: 'Google', logo: new URL('../logos/google.svg', import.meta.url).href },
};

const props = defineProps({
  systemName: { type: String, required: true },
  tagline: { type: String, required: true },
  owner: { type: String, default: company.loginOwner },
  mark: { type: String, default: company.mark },
  subtitle: { type: String, default: company.loginSubtitle },
  photoUrl: { type: String, default: '' },
  providers: { type: Array, default: () => [] },
  helpEmail: { type: String, required: true },
  mode: { type: String, default: 'login' },
  alert: { type: Object, default: null },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'provider', 'recover', 'back', 'forgot']);

const email = ref('');
const password = ref('');
const remember = ref(false);
const passwordRevealed = ref(false);

const photoStyle = computed(() => (props.photoUrl ? { '--cap-login-photo': `url('${props.photoUrl}')` } : undefined));
const passwordHasError = computed(() => props.alert?.status === 'error');
const recoverSubmitLabel = computed(() => (props.alert ? 'Enviar de nuevo' : 'Enviar enlace'));

function submitCredentials() {
  emit('submit', { email: email.value, password: password.value, remember: remember.value });
}
</script>

<template>
  <main class="cap-login">
    <section class="cap-login__photo" :style="photoStyle">
      <div class="cap-login__brand-tag cap-glass"><span class="cap-shell-logo" aria-hidden="true">{{ mark }}</span>{{ systemName }}</div>
      <div class="cap-login__quote cap-glass">
        <p class="cap-login__quote-text">{{ tagline }}</p>
        <small v-if="owner" class="cap-login__quote-owner">{{ owner }}</small>
      </div>
    </section>

    <section class="cap-login__card cap-glass--light">
      <form v-if="mode === 'login'" class="cap-login__form" @submit.prevent="submitCredentials">
        <h1 class="cap-login__title">Ingresa a {{ systemName }}</h1>
        <p class="cap-login__subtitle">{{ subtitle }}</p>

        <CapAlert v-if="alert" v-bind="alert" />

        <div class="cap-field">
          <label class="cap-field__label" for="login-email">Correo</label>
          <div class="cap-field__control"><input id="login-email" v-model="email" class="cap-field__input" type="email" autocomplete="username" placeholder="nombre@empresa.com"></div>
        </div>
        <div id="login-password-field" class="cap-field" :class="{ 'cap-field--error': passwordHasError }">
          <label class="cap-field__label" for="login-password">Contraseña</label>
          <div class="cap-field__control">
            <input id="login-password" v-model="password" class="cap-field__input" :type="passwordRevealed ? 'text' : 'password'" autocomplete="current-password" placeholder="••••••••">
            <button
              class="cap-field__reveal"
              type="button"
              aria-controls="login-password"
              :aria-label="passwordRevealed ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="passwordRevealed = !passwordRevealed"
            >
              <i class="mdi" :class="passwordRevealed ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div class="cap-login__options">
          <label class="cap-check"><input v-model="remember" class="cap-check__box" type="checkbox" name="remember">Mantener la sesión</label>
          <a class="cap-login__link" href="#recover" @click.prevent="emit('forgot')">¿Olvidaste tu contraseña?</a>
        </div>

        <button class="cap-button cap-button--primary cap-login__submit" type="submit" :disabled="loading" :aria-busy="String(loading)">
          {{ loading ? 'Ingresando…' : 'Ingresar' }}
        </button>

        <template v-if="providers.length">
          <p class="cap-login__divider">o continúa con</p>
          <div class="cap-login__providers" :class="{ 'cap-login__providers--single': providers.length === 1 }">
            <button v-for="name in providers" :key="name" class="cap-button cap-button--provider" type="button" @click="emit('provider', name)">
              <img :src="PROVIDERS[name].logo" alt="" width="18" height="18">{{ PROVIDERS[name].label }}
            </button>
          </div>
        </template>

        <p class="cap-login__help">¿Problemas para entrar? Escribe a <a class="cap-login__link" :href="`mailto:${helpEmail}`">{{ helpEmail }}</a></p>
      </form>

      <form v-else class="cap-login__form" @submit.prevent="emit('recover', email)">
        <h1 class="cap-login__title">Recupera tu acceso</h1>
        <p class="cap-login__subtitle">Te enviaremos un enlace para crear una contraseña nueva.</p>
        <CapAlert v-if="alert" v-bind="alert" />
        <div class="cap-field">
          <label class="cap-field__label" for="recover-email">Correo</label>
          <div class="cap-field__control"><input id="recover-email" v-model="email" class="cap-field__input" type="email" autocomplete="username"></div>
        </div>
        <button class="cap-button cap-button--primary cap-login__submit" type="submit" :disabled="loading" :aria-busy="String(loading)">{{ recoverSubmitLabel }}</button>
        <p class="cap-login__help"><a class="cap-login__link" href="#" @click.prevent="emit('back')"><i class="mdi mdi-arrow-left" aria-hidden="true" /> Volver a ingresar</a></p>
      </form>
    </section>

    <button class="cap-login__theme" type="button" aria-label="Alternar modo oscuro" @click="toggleTheme">
      <i class="mdi mdi-weather-night" aria-hidden="true" />
    </button>
  </main>
</template>
