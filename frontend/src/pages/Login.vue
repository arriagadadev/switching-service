<template>
  <div class="flex flex-center bg-grey-2" style="min-height: 100vh">
    <q-card class="q-pa-md" style="min-width: 400px">
      <q-card-section>
        <div class="text-h6 text-center q-mb-md">Iniciar Sesión</div>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            :rules="[(val) => !!val || 'Email es requerido']"
            outlined
          />
          <q-input
            v-model="password"
            label="Contraseña"
            type="password"
            :rules="[(val) => !!val || 'Contraseña es requerida']"
            outlined
          />
          <div>
            <q-btn
              label="Iniciar Sesión"
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
import { signIn } from 'aws-amplify/auth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const onSubmit = async () => {
  loading.value = true;
  error.value = '';

  try {
    const { isSignedIn } = await signIn({
      username: email.value,
      password: password.value,
    });

    if (isSignedIn) {
      localStorage.setItem('isAuthenticated', 'true');
      $q.notify({
        type: 'positive',
        message: 'Sesión iniciada correctamente',
      });
      router.push('/');
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
