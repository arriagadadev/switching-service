<template>
  <div class="flex flex-center" style="min-height: 100vh; background-color: #121212;">
    <q-card class="q-pa-md" style="min-width: 400px">
      <q-card-section>
        <div class="text-h6 text-center q-mb-md">
          {{ isNewPasswordRequired ? 'Cambiar Contraseña' : 'Iniciar Sesión' }}
        </div>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            :rules="[(val) => !!val || 'Email es requerido']"
            outlined
            :disable="isNewPasswordRequired"
          />
          <q-input
            v-if="!isNewPasswordRequired"
            v-model="password"
            label="Contraseña"
            type="password"
            :rules="[(val) => !!val || 'Contraseña es requerida']"
            outlined
          />
          <template v-else>
            <q-input
              v-model="newPassword"
              label="Nueva Contraseña"
              type="password"
              :rules="[
                (val) => !!val || 'Nueva contraseña es requerida',
                (val) => (val && val.length >= 8) || 'La contraseña debe tener al menos 8 caracteres',
              ]"
              outlined
            />
            <q-input
              v-model="confirmPassword"
              label="Confirmar Nueva Contraseña"
              type="password"
              :rules="[
                (val) => !!val || 'Confirma la contraseña',
                (val) => val === newPassword || 'Las contraseñas no coinciden',
              ]"
              outlined
            />
          </template>
          <div>
            <q-btn
              :label="isNewPasswordRequired ? 'Cambiar Contraseña' : 'Iniciar Sesión'"
              type="submit"
              color="primary"
              class="full-width"
              :loading="loading"
            />
          </div>
          <div v-if="error" class="text-negative text-center q-mt-sm">
            {{ error }}
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
const email = ref('');
const password = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const isNewPasswordRequired = ref(false);
const session = ref<any>(null);

const onSubmit = async () => {
  loading.value = true;
  error.value = '';

  try {
    if (isNewPasswordRequired.value) {
      // Manejar cambio de contraseña
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

      // Confirmar el cambio de contraseña
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: newPassword.value,
      });

      if (isSignedIn) {
        localStorage.setItem('isAuthenticated', 'true');
        $q.notify({
          type: 'positive',
          message: 'Contraseña cambiada correctamente',
        });
        router.push('/');
      }
    } else {
      // Inicio de sesión normal
      const result = await signIn({
        username: email.value,
        password: password.value,
      });

      // Verificar si hay un challenge
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        isNewPasswordRequired.value = true;
        session.value = result;
        // Limpiar los campos
        password.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
        error.value = '';
        $q.notify({
          type: 'info',
          message: 'Debes cambiar tu contraseña temporal',
        });
      } else if (result.isSignedIn) {
        localStorage.setItem('isAuthenticated', 'true');
        $q.notify({
          type: 'positive',
          message: 'Sesión iniciada correctamente',
        });
        router.push('/');
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Error al iniciar sesión';
    $q.notify({
      type: 'negative',
      message: error.value,
    });
  } finally {
    loading.value = false;
  }
};
</script>
