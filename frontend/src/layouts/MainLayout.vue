<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-icon name="settings" class="q-mr-sm" />
          Switching Service
        </q-toolbar-title>
        <q-space />
        <q-btn flat icon="logout" label="Cerrar Sesión" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-white">
      <q-list class="q-pa-sm">
        <q-item-label header class="text-grey-8 q-pa-sm"> Navegación </q-item-label>
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
          </q-item-section>
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
          </q-item-section>
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
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signOut } from 'aws-amplify/auth';

const leftDrawerOpen = ref(false);
const router = useRouter();

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
