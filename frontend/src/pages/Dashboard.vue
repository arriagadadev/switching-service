<template>
  <div class="page">
    <div class="page-header">
      <h1>Dashboard</h1>
      <button class="btn-icon" @click="loadData" :disabled="loading" title="Actualizar">
        <span class="material-symbols-outlined">{{ loading ? 'refresh' : 'refresh' }}</span>
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="material-symbols-outlined stat-icon primary">storage</span>
        <div>
          <span class="stat-label">Total Recursos</span>
          <span class="stat-value">{{ resourcesCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="material-symbols-outlined stat-icon success">check_circle</span>
        <div>
          <span class="stat-label">Recursos Activos</span>
          <span class="stat-value">{{ activeResourcesCount }}</span>
          <span class="stat-sub">{{ activeResourcesPercentage }}%</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="material-symbols-outlined stat-icon primary">schedule</span>
        <div>
          <span class="stat-label">Total Programaciones</span>
          <span class="stat-value">{{ schedulesCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="material-symbols-outlined stat-icon success">play_circle</span>
        <div>
          <span class="stat-label">Programaciones Activas</span>
          <span class="stat-value">{{ activeSchedulesCount }}</span>
          <span class="stat-sub">{{ activeSchedulesPercentage }}%</span>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card">
        <h3>Recursos por Tipo</h3>
        <div v-if="loading" class="loading">Cargando...</div>
        <div v-else class="type-list">
          <div v-for="type in resourceTypesDistribution" :key="type.type" class="type-row">
            <span class="chip" :class="type.type === 'RDS' ? 'info' : 'secondary'">{{ type.type }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: type.percentage + '%', backgroundColor: type.type === 'RDS' ? 'var(--info)' : '#757575' }">
                <span>{{ type.count }} ({{ type.percentage }}%)</span>
              </div>
            </div>
          </div>
          <p v-if="resourceTypesDistribution.length === 0" class="empty">No hay recursos</p>
        </div>
      </div>
      <div class="card">
        <h3>Estado de Recursos</h3>
        <div v-if="loading" class="loading">Cargando...</div>
        <div v-else class="state-circles">
          <div class="state-item">
            <div class="circle" :style="{ '--percent': activeResourcesPercentage }">
              <span class="circle-value">{{ activeResourcesCount }}</span>
              <span class="circle-label">Activos</span>
            </div>
          </div>
          <div class="state-item">
            <div class="circle error" :style="{ '--percent': inactiveResourcesPercentage }">
              <span class="circle-value">{{ inactiveResourcesCount }}</span>
              <span class="circle-label">Inactivos</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="tables-grid">
      <div class="card">
        <div class="card-header">
          <h3>Recursos Recientes</h3>
          <router-link to="/resources" class="btn-link">Ver todos</router-link>
        </div>
        <div class="table-wrap">
          <table v-if="recentResources.length" class="data-table">
            <thead>
              <tr><th>Nombre</th><th>Tipo</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="r in recentResources" :key="r.id">
                <td>{{ r.name }}</td>
                <td><span class="chip info">{{ r.type }}</span></td>
                <td><span class="chip" :class="r.state === 1 ? 'success' : 'error'">{{ r.state === 1 ? 'Activo' : 'Inactivo' }}</span></td>
                <td>
                  <button class="btn-icon" @click="r.state === 0 ? startResource(r.id) : stopResource(r.id)" title="Iniciar/Detener">
                    <span class="material-symbols-outlined">{{ r.state === 0 ? 'play_arrow' : 'stop' }}</span>
                  </button>
                  <router-link to="/resources" class="btn-icon"><span class="material-symbols-outlined">visibility</span></router-link>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty">No hay recursos</p>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <h3>Programaciones Recientes</h3>
          <router-link to="/schedules" class="btn-link">Ver todos</router-link>
        </div>
        <div class="table-wrap">
          <table v-if="recentSchedules.length" class="data-table">
            <thead>
              <tr><th>Nombre</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="s in recentSchedules" :key="s.id">
                <td>{{ s.name }}</td>
                <td><span class="chip" :class="s.isEnabled ? 'success' : 'error'">{{ s.isEnabled ? 'Habilitada' : 'Deshabilitada' }}</span></td>
                <td><router-link to="/schedules" class="btn-icon"><span class="material-symbols-outlined">visibility</span></router-link></td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty">No hay programaciones</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { resourcesService } from '../services/resources';
import { schedulesService } from '../services/schedules';
import { useToast } from '../composables/useToast';
import type { ResourceStateResource, ScheduleResource } from '../types';

const toast = useToast();
const loading = ref(false);
const resources = ref<ResourceStateResource[]>([]);
const schedules = ref<ScheduleResource[]>([]);

const resourcesCount = computed(() => resources.value.length);
const activeResourcesCount = computed(() => resources.value.filter((r) => r.state === 1).length);
const inactiveResourcesCount = computed(() => resources.value.filter((r) => r.state === 0).length);
const activeResourcesPercentage = computed(() =>
  resourcesCount.value > 0 ? Math.round((activeResourcesCount.value / resourcesCount.value) * 100) : 0
);
const inactiveResourcesPercentage = computed(() =>
  resourcesCount.value > 0 ? Math.round((inactiveResourcesCount.value / resourcesCount.value) * 100) : 0
);

const schedulesCount = computed(() => schedules.value.length);
const activeSchedulesCount = computed(() => schedules.value.filter((s) => s.isEnabled && s.isActive).length);
const activeSchedulesPercentage = computed(() =>
  schedulesCount.value > 0 ? Math.round((activeSchedulesCount.value / schedulesCount.value) * 100) : 0
);

const recentResources = computed(() =>
  [...resources.value].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
);
const recentSchedules = computed(() =>
  [...schedules.value].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
);

const resourceTypesDistribution = computed(() => {
  const dist: Record<string, number> = {};
  resources.value.forEach((r) => { dist[r.type] = (dist[r.type] || 0) + 1; });
  return Object.entries(dist)
    .map(([type, count]) => ({
      type,
      count,
      percentage: resourcesCount.value > 0 ? Math.round((count / resourcesCount.value) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
});

const loadData = async () => {
  loading.value = true;
  try {
    [resources.value, schedules.value] = await Promise.all([
      resourcesService.getAll(),
      schedulesService.getAll(),
    ]);
  } catch (e: any) {
    toast.error(e.message || 'Error al cargar');
  } finally {
    loading.value = false;
  }
};

const startResource = async (id: string) => {
  try {
    await resourcesService.start(id);
    toast.success('Recurso iniciado');
    loadData();
  } catch (e: any) {
    toast.error(e.message || 'Error');
  }
};

const stopResource = async (id: string) => {
  try {
    await resourcesService.stop(id);
    toast.success('Recurso detenido');
    loadData();
  } catch (e: any) {
    toast.error(e.message || 'Error');
  }
};

onMounted(() => loadData());
</script>

<style scoped>
.page { padding: 0; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-header h1 { margin: 0; font-size: 1.5rem; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon { font-size: 32px; }
.stat-icon.primary { color: var(--primary); }
.stat-icon.success { color: var(--success); }
.stat-label { display: block; font-size: 0.75rem; color: var(--text-tertiary); }
.stat-value { font-size: 1.25rem; font-weight: 600; }
.stat-sub { font-size: 0.75rem; color: var(--text-tertiary); margin-left: 4px; }

.charts-grid, .tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.card h3 { margin: 0 0 12px; font-size: 1rem; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.card-header h3 { margin: 0; }
.btn-link { color: var(--primary); font-size: 0.875rem; }

.type-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.type-row .chip { flex-shrink: 0; }
.progress-bar { flex: 1; height: 20px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: 600; }

.state-circles { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; }
.state-item { text-align: center; }
.circle {
  width: 80px; height: 80px; border-radius: 50%;
  background: conic-gradient(var(--success) calc(var(--percent) * 1%), var(--bg-tertiary) 0);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  margin: 0 auto 8px;
}
.circle.error { background: conic-gradient(var(--error) calc(var(--percent) * 1%), var(--bg-tertiary) 0); }
.circle-value { font-size: 1.25rem; font-weight: 600; }
.circle-label { font-size: 0.75rem; color: var(--text-tertiary); }

.chip {
  display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500;
}
.chip.info { background: var(--info); color: white; }
.chip.success { background: var(--success); color: white; }
.chip.error { background: var(--error); color: white; }
.chip.secondary { background: #757575; color: white; }

.table-wrap { max-height: 200px; overflow-y: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 8px; text-align: left; border-bottom: 1px solid var(--border); }
.data-table th { font-size: 0.75rem; color: var(--text-tertiary); }

.btn-icon {
  background: none; color: var(--text-secondary); padding: 4px;
}
.btn-icon:hover { color: var(--primary); }
.loading, .empty { text-align: center; color: var(--text-tertiary); padding: 24px; margin: 0; }
</style>
