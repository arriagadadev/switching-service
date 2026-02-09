<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">{{ isNewPasswordRequired ? 'Cambiar Contraseña' : 'Iniciar Sesión' }}</h2>
      <form @submit.prevent="onSubmit" class="login-form">
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" required :disabled="isNewPasswordRequired" />
        </div>
        <template v-if="!isNewPasswordRequired">
          <div class="field">
            <label>Contraseña</label>
            <input v-model="password" type="password" required />
          </div>
        </template>
        <template v-else>
          <div class="field">
            <label>Nueva Contraseña</label>
            <input v-model="newPassword" type="password" required minlength="8" />
          </div>
          <div class="field">
            <label>Confirmar Nueva Contraseña</label>
            <input v-model="confirmPassword" type="password" required />
          </div>
        </template>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Espere...' : (isNewPasswordRequired ? 'Cambiar Contraseña' : 'Iniciar Sesión') }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { useToast } from '../composables/useToast';

const toast = useToast();
const router = useRouter();
const email = ref('');
const password = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const isNewPasswordRequired = ref(false);

const onSubmit = async () => {
  loading.value = true;
  error.value = '';

  try {
    if (isNewPasswordRequired.value) {
      if (!newPassword.value || newPassword.value.length < 8) {
        error.value = 'La contraseña debe tener al menos 8 caracteres';
        loading.value = false;
        return;
      }
      if (newPassword.value !== confirmPassword.value) {
        error.value = 'Las contraseñas no coinciden';
        loading.value = false;
        return;
      }

      await confirmSignIn({ challengeResponse: newPassword.value });
      localStorage.setItem('isAuthenticated', 'true');
      toast.success('Contraseña cambiada correctamente');
      router.push('/');
    } else {
      const result = await signIn({
        username: email.value,
        password: password.value,
      });

      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        isNewPasswordRequired.value = true;
        password.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
        error.value = '';
        toast.info('Debes cambiar tu contraseña temporal');
      } else if (result.isSignedIn) {
        localStorage.setItem('isAuthenticated', 'true');
        toast.success('Sesión iniciada correctamente');
        router.push('/');
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Error al iniciar sesión';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 16px;
}

.login-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 32px;
  min-width: 360px;
  max-width: 100%;
}

.login-title {
  margin: 0 0 24px;
  font-size: 1.25rem;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.field input {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 1rem;
}

.field input:focus {
  outline: none;
  border-color: var(--primary);
}

.field input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  padding: 12px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  color: var(--error);
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
}
</style>
