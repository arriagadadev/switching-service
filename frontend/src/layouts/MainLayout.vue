<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          @click="toggleDrawer"
          class="q-mr-sm"
        />
        <q-toolbar-title>
          <q-icon name="settings" class="q-mr-sm" />
          Switching Service
        </q-toolbar-title>
        <q-space />
        <q-btn flat icon="logout" label="Cerrar Sesión" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="280"
      :mini="miniState"
      :mini-width="70"
      :breakpoint="1024"
    >
      <q-list class="q-pa-sm">
        <q-item-label header class="text-grey-8 q-pa-sm" v-if="!miniState">
          Navegación
        </q-item-label>
        <q-item
          clickable
          v-ripple
          to="/"
          exact
          active-class="bg-primary text-white"
          class="q-mb-xs rounded-borders"
        >
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Dashboard</q-item-label>
            <q-item-label caption v-if="miniState">Dashboard</q-item-label>
          </q-item-section>
          <q-tooltip v-if="miniState" class="bg-primary">Dashboard</q-tooltip>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/resources"
          exact
          active-class="bg-primary text-white"
          class="q-mb-xs rounded-borders"
        >
          <q-item-section avatar>
            <q-icon name="storage" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Recursos</q-item-label>
            <q-item-label caption v-if="miniState">Recursos</q-item-label>
          </q-item-section>
          <q-tooltip v-if="miniState" class="bg-primary">Recursos</q-tooltip>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/schedules"
          exact
          active-class="bg-primary text-white"
          class="q-mb-xs rounded-borders"
        >
          <q-item-section avatar>
            <q-icon name="schedule" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Programaciones</q-item-label>
            <q-item-label caption v-if="miniState">Programaciones</q-item-label>
          </q-item-section>
          <q-tooltip v-if="miniState" class="bg-primary">Programaciones</q-tooltip>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/change-password"
          exact
          active-class="bg-primary text-white"
          class="q-mb-xs rounded-borders"
        >
          <q-item-section avatar>
            <q-icon name="lock" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Cambiar Contraseña</q-item-label>
            <q-item-label caption v-if="miniState">Cambiar Contraseña</q-item-label>
          </q-item-section>
          <q-tooltip v-if="miniState" class="bg-primary">Cambiar Contraseña</q-tooltip>
        </q-item>
      </q-list>
      <div class="absolute-bottom q-pa-sm">
        <q-btn
          flat
          dense
          round
          :icon="miniState ? 'chevron_right' : 'chevron_left'"
          @click="toggleMini"
          class="full-width"
          :size="miniState ? 'md' : 'sm'"
        >
          <q-tooltip v-if="miniState" class="bg-primary">
            {{ miniState ? 'Expandir' : 'Colapsar' }}
          </q-tooltip>
        </q-btn>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { signOut } from 'aws-amplify/auth';

const router = useRouter();
const leftDrawerOpen = ref(true);
const miniState = ref(false);

// Cargar estado del sidebar desde localStorage
onMounted(() => {
  const savedMiniState = localStorage.getItem('sidebarMiniState');
  if (savedMiniState !== null) {
    miniState.value = savedMiniState === 'true';
  }
});

const toggleDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleMini = () => {
  miniState.value = !miniState.value;
  localStorage.setItem('sidebarMiniState', String(miniState.value));
};

const handleLogout = async () => {
  try {
    await signOut();
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};
</script>
