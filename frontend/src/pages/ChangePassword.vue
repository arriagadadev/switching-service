<template>
  <q-page class="q-pa-lg">
    <div class="row justify-center">
      <div class="col-12 col-md-6 col-lg-5">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h5 q-mb-md">Cambiar Contraseña</div>
            <div class="text-caption text-grey-7 q-mb-lg">
              Actualiza tu contraseña de acceso al sistema
            </div>

            <q-form @submit="onSubmit" class="q-gutter-md" ref="passwordFormRef">
              <q-input
                v-model="currentPassword"
                label="Contraseña Actual *"
                :type="showCurrentPassword ? 'text' : 'password'"
                :rules="[(val) => !!val || 'La contraseña actual es requerida']"
                outlined
                :disable="loading"
                class="password-input"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showCurrentPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showCurrentPassword = !showCurrentPassword"
                  >
                    <q-tooltip>
                      {{ showCurrentPassword ? 'Ocultar' : 'Mostrar' }}
                    </q-tooltip>
                  </q-icon>
                </template>
              </q-input>

              <q-input
                v-model="newPassword"
                label="Nueva Contraseña *"
                :type="showNewPassword ? 'text' : 'password'"
                :rules="[
                  (val) => !!val || 'La nueva contraseña es requerida',
                  (val) => val.length >= 8 || 'Mínimo 8 caracteres',
                  (val) =>
                    /[A-Z]/.test(val) || 'Debe contener al menos una mayúscula',
                  (val) =>
                    /[a-z]/.test(val) || 'Debe contener al menos una minúscula',
                  (val) => /[0-9]/.test(val) || 'Debe contener al menos un número',
                ]"
                outlined
                :disable="loading"
                hint="Mínimo 8 caracteres, con mayúsculas, minúsculas y números"
                class="password-input"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showNewPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showNewPassword = !showNewPassword"
                  >
                    <q-tooltip>
                      {{ showNewPassword ? 'Ocultar' : 'Mostrar' }}
                    </q-tooltip>
                  </q-icon>
                </template>
              </q-input>

              <q-input
                v-model="confirmPassword"
                label="Confirmar Nueva Contraseña *"
                :type="showConfirmPassword ? 'text' : 'password'"
                :rules="[
                  (val) => !!val || 'La confirmación es requerida',
                  (val) => val === newPassword || 'Las contraseñas no coinciden',
                ]"
                outlined
                :disable="loading"
                class="password-input"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <q-tooltip>
                      {{ showConfirmPassword ? 'Ocultar' : 'Mostrar' }}
                    </q-tooltip>
                  </q-icon>
                </template>
              </q-input>

              <div class="row justify-end q-gutter-sm q-mt-lg">
                <q-btn
                  flat
                  label="Cancelar"
                  color="primary"
                  @click="$router.push('/')"
                  :disable="loading"
                />
                <q-btn
                  label="Cambiar Contraseña"
                  type="submit"
                  color="primary"
                  :loading="loading"
                  unelevated
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { updatePassword, getCurrentUser } from 'aws-amplify/auth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
const loading = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordFormRef = ref<any>(null);
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const onSubmit = async () => {
  loading.value = true;
  try {
    // Verificar que las contraseñas coincidan
    if (newPassword.value !== confirmPassword.value) {
      $q.notify({
        type: 'negative',
        message: 'Las contraseñas no coinciden',
        position: 'top',
      });
      loading.value = false;
      return;
    }

    // Cambiar la contraseña usando Amplify
    await updatePassword({
      oldPassword: currentPassword.value,
      newPassword: newPassword.value,
    });

    $q.notify({
      type: 'positive',
      message: 'Contraseña actualizada correctamente',
      position: 'top',
      icon: 'check_circle',
    });

    // Limpiar formulario
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    if (passwordFormRef.value) {
      passwordFormRef.value.resetValidation();
    }

    // Opcional: redirigir después de un momento
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error);
    let errorMessage = 'Error al cambiar la contraseña';
    
    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'La contraseña actual es incorrecta';
    } else if (error.name === 'InvalidPasswordException') {
      errorMessage = 'La nueva contraseña no cumple con los requisitos';
    } else if (error.message) {
      errorMessage = error.message;
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Visible text in password inputs - dark theme */
.password-input :deep(input) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.password-input :deep(.q-field__native),
.password-input :deep(.q-field__input) {
  color: #ffffff !important;
}

/* Align control content - prevent misalignment with error icon */
.password-input :deep(.q-field__control) {
  align-items: center;
}

.password-input :deep(.q-field__control-container) {
  align-items: center;
  min-height: 40px;
}

.password-input :deep(.q-field__prepend) {
  align-items: center;
  padding-right: 8px;
}

.password-input :deep(.q-field__append) {
  align-items: center;
}

/* Error state - ensure error icon doesn't break layout */
.password-input :deep(.q-field--error .q-field__control) {
  align-items: center;
}
</style>
