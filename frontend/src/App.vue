<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  // Verificar autenticación al cargar la app
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated && window.location.pathname !== '/login') {
    // No redirigir si ya estamos en login
  }
</script>
