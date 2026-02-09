<template>
  <div class="page">
    <div class="card change-password-card">
      <h1>Cambiar Contraseña</h1>
      <p class="subtitle">Actualiza tu contraseña de acceso al sistema</p>

      <form @submit.prevent="onSubmit" class="form">
        <div class="field">
          <label>Contraseña Actual *</label>
          <div class="input-wrap">
            <input
              v-model="currentPassword"
              :type="showCurrent ? 'text' : 'password'"
              required
              :disabled="loading"
            />
            <button type="button" class="visibility-btn" @click="showCurrent = !showCurrent">
              <span class="material-symbols-outlined">{{ showCurrent ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </div>
        <div class="field">
          <label>Nueva Contraseña *</label>
          <div class="input-wrap">
            <input
              v-model="newPassword"
              :type="showNew ? 'text' : 'password'"
              required
              minlength="8"
              :disabled="loading"
            />
            <button type="button" class="visibility-btn" @click="showNew = !showNew">
              <span class="material-symbols-outlined">{{ showNew ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
          <span class="hint">Mínimo 8 caracteres, con mayúsculas, minúsculas y números</span>
        </div>
        <div class="field">
          <label>Confirmar Nueva Contraseña *</label>
          <div class="input-wrap">
            <input
              v-model="confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              required
              :disabled="loading"
            />
            <button type="button" class="visibility-btn" @click="showConfirm = !showConfirm">
              <span class="material-symbols-outlined">{{ showConfirm ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </div>
        <div class="form-actions">
          <router-link to="/" class="btn btn-secondary">Cancelar</router-link>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Cambiar Contraseña' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { updatePassword } from 'aws-amplify/auth';
import { useToast } from '../composables/useToast';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

const validatePassword = (p: string) =>
  p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p);

const onSubmit = async () => {
  if (newPassword.value !== confirmPassword.value) {
    toast.error('Las contraseñas no coinciden');
    return;
  }
  if (!validatePassword(newPassword.value)) {
    toast.error('La contraseña debe tener 8+ caracteres, mayúscula, minúscula y número');
    return;
  }

  loading.value = true;
  try {
    await updatePassword({
      oldPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    toast.success('Contraseña actualizada correctamente');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    setTimeout(() => router.push('/'), 1500);
  } catch (e: any) {
    let msg = 'Error al cambiar la contraseña';
    if (e.name === 'NotAuthorizedException') msg = 'La contraseña actual es incorrecta';
    else if (e.name === 'InvalidPasswordException') msg = 'La nueva contraseña no cumple los requisitos';
    else if (e.message) msg = e.message;
    toast.error(msg);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.change-password-card { max-width: 480px; margin: 0 auto; }
.change-password-card h1 { margin: 0 0 8px; font-size: 1.25rem; }
.subtitle { color: var(--text-tertiary); margin: 0 0 24px; font-size: 0.875rem; }

.form { display: flex; flex-direction: column; gap: 16px; }
.field label { display: block; margin-bottom: 6px; color: var(--text-tertiary); font-size: 0.875rem; }
.input-wrap {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px;
}
.input-wrap input {
  flex: 1; padding: 10px 12px; background: none; border: none;
  color: var(--text-primary); font-size: 1rem;
}
.input-wrap input:focus { outline: none; }
.visibility-btn { background: none; color: var(--text-tertiary); padding: 8px; }
.visibility-btn:hover { color: var(--text-primary); }
.hint { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px; display: block; }

.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
.btn { padding: 10px 20px; border-radius: 6px; font-size: 0.875rem; text-decoration: none; }
.btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); }
.btn-primary { background: var(--primary); color: white; }
</style>
