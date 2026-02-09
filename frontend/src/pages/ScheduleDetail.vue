<template>
  <div class="page">
    <router-link to="/schedules" class="back-link">
      <span class="material-symbols-outlined">arrow_back</span>
      Volver
    </router-link>
    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else-if="schedule" class="card">
      <h1>{{ schedule.name }}</h1>
      <dl class="detail-list">
        <div><dt>ID</dt><dd>{{ schedule.id }}</dd></div>
        <div><dt>Expresión Cron</dt><dd>{{ schedule.cron }}</dd></div>
        <div><dt>Estado Deseado</dt><dd><span class="chip" :class="schedule.desiredState === 1 ? 'success' : 'error'">{{ schedule.desiredState === 1 ? 'Activo' : 'Inactivo' }}</span></dd></div>
        <div><dt>Habilitado</dt><dd><span class="chip" :class="schedule.isEnabled ? 'success' : 'error'">{{ schedule.isEnabled ? 'Sí' : 'No' }}</span></dd></div>
        <div><dt>Activo</dt><dd><span class="chip" :class="schedule.isActive ? 'success' : 'error'">{{ schedule.isActive ? 'Sí' : 'No' }}</span></dd></div>
      </dl>
      <h3>Recursos Asociados</h3>
      <ul v-if="schedule.resources.length" class="resource-list">
        <li v-for="r in schedule.resources" :key="r.id">{{ r.resourceIdentifier }} ({{ r.type }})</li>
      </ul>
      <p v-else class="empty">No hay recursos asociados</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { schedulesService } from '../services/schedules';
import type { ScheduleResource } from '../types';

const route = useRoute();
const loading = ref(false);
const schedule = ref<ScheduleResource | null>(null);

onMounted(async () => {
  loading.value = true;
  try {
    schedule.value = await schedulesService.getById(route.params.id as string);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.back-link { display: inline-flex; align-items: center; gap: 8px; color: var(--primary); margin-bottom: 16px; }
.detail-list { display: grid; gap: 12px; }
.detail-list div { display: flex; gap: 12px; }
.detail-list dt { margin: 0; color: var(--text-tertiary); font-weight: 500; min-width: 120px; }
.detail-list dd { margin: 0; }
.chip { padding: 4px 8px; border-radius: 4px; font-size: 0.875rem; }
.chip.success { background: var(--success); color: white; }
.chip.error { background: var(--error); color: white; }
.resource-list { padding-left: 20px; }
.empty { color: var(--text-tertiary); }
</style>
