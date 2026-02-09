<template>
  <q-page class="dashboard-page">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4">Dashboard</div>
      <q-btn
        flat
        dense
        round
        icon="refresh"
        @click="loadData"
        :loading="loading"
        class="q-mr-sm"
      >
        <q-tooltip>Actualizar datos</q-tooltip>
      </q-btn>
    </div>

    <!-- KPI: 4 cards en fila compacta -->
    <div class="row dashboard-stats q-col-gutter-sm q-mb-md">
      <q-card class="col-6 col-md-3 stat-card" flat bordered>
        <q-card-section class="q-pa-md">
          <div class="row items-center no-wrap">
            <q-icon name="storage" size="32px" color="primary" class="q-mr-sm" />
            <div>
              <div class="text-caption text-grey-7">Total Recursos</div>
              <div class="text-h5 text-primary">{{ resourcesCount }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-6 col-md-3 stat-card" flat bordered>
        <q-card-section class="q-pa-md">
          <div class="row items-center no-wrap">
            <q-icon name="check_circle" size="32px" color="positive" class="q-mr-sm" />
            <div>
              <div class="text-caption text-grey-7">Recursos Activos</div>
              <div class="text-h5 text-positive">{{ activeResourcesCount }}</div>
              <div class="text-caption text-grey-6">{{ activeResourcesPercentage }}%</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-6 col-md-3 stat-card" flat bordered>
        <q-card-section class="q-pa-md">
          <div class="row items-center no-wrap">
            <q-icon name="schedule" size="32px" color="primary" class="q-mr-sm" />
            <div>
              <div class="text-caption text-grey-7">Total Programaciones</div>
              <div class="text-h5 text-primary">{{ schedulesCount }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-6 col-md-3 stat-card" flat bordered>
        <q-card-section class="q-pa-md">
          <div class="row items-center no-wrap">
            <q-icon name="play_circle" size="32px" color="positive" class="q-mr-sm" />
            <div>
              <div class="text-caption text-grey-7">Programaciones Activas</div>
              <div class="text-h5 text-positive">{{ activeSchedulesCount }}</div>
              <div class="text-caption text-grey-6">{{ activeSchedulesPercentage }}%</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Gráficos: lado a lado -->
    <div class="row dashboard-charts q-col-gutter-sm q-mb-md">
      <q-card class="col-12 col-md-6 chart-card" flat bordered>
        <q-card-section class="q-pa-md">
          <div class="text-subtitle1 q-mb-sm">Recursos por Tipo</div>
          <div v-if="loading" class="text-center q-pa-md">
            <q-spinner color="primary" size="2em" />
          </div>
          <div v-else class="type-distribution">
            <div v-for="type in resourceTypesDistribution" :key="type.type" class="row items-center q-mb-sm">
              <div class="col-auto q-mr-sm">
                <q-chip
                  :color="type.type === 'RDS' ? 'info' : 'secondary'"
                  text-color="white"
                  :icon="type.type === 'RDS' ? 'storage' : 'computer'"
                  dense
                >
                  {{ type.type }}
                </q-chip>
              </div>
              <div class="col">
                <q-linear-progress
                  :value="type.percentage / 100"
                  :color="type.type === 'RDS' ? 'info' : 'secondary'"
                  size="20px"
                  class="rounded-borders"
                >
                  <div class="absolute-full flex flex-center">
                    <span class="progress-label">{{ type.count }} ({{ type.percentage }}%)</span>
                  </div>
                </q-linear-progress>
              </div>
            </div>
            <div v-if="resourceTypesDistribution.length === 0" class="text-center text-grey-6 q-pa-sm">
              No hay recursos
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-md-6 chart-card" flat bordered>
        <q-card-section class="q-pa-md">
          <div class="text-subtitle1 q-mb-sm">Estado de Recursos</div>
          <div v-if="loading" class="text-center q-pa-md">
            <q-spinner color="primary" size="2em" />
          </div>
          <div v-else class="state-distribution">
            <div class="row items-center justify-around">
              <div class="col-auto text-center">
                <q-circular-progress
                  :value="activeResourcesPercentage / 100"
                  size="80px"
                  :thickness="0.25"
                  color="positive"
                  track-color="grey-8"
                  class="state-circle"
                >
                  <div class="column items-center justify-center">
                    <span class="text-h6">{{ activeResourcesCount }}</span>
                    <span class="text-caption text-grey-7">Activos</span>
                  </div>
                </q-circular-progress>
              </div>
              <div class="col-auto text-center">
                <q-circular-progress
                  :value="inactiveResourcesPercentage / 100"
                  size="80px"
                  :thickness="0.25"
                  color="negative"
                  track-color="grey-8"
                  class="state-circle"
                >
                  <div class="column items-center justify-center">
                    <span class="text-h6">{{ inactiveResourcesCount }}</span>
                    <span class="text-caption text-grey-7">Inactivos</span>
                  </div>
                </q-circular-progress>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Tablas: lado a lado, mejor uso del espacio -->
    <div class="row dashboard-tables q-col-gutter-sm">
      <q-card class="col-12 col-md-6 table-card" flat bordered>
        <q-card-section class="q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1">Recursos Recientes</div>
            <q-btn
              flat
              dense
              size="sm"
              label="Ver todos"
              icon-right="arrow_forward"
              color="primary"
              @click="$router.push({ name: 'resources' })"
            />
          </div>
          <q-table
            :rows="recentResources"
            :columns="resourceColumns"
            row-key="id"
            :loading="loading"
            flat
            dense
            hide-pagination
            :rows-per-page-options="[0]"
            class="dashboard-table"
          >
            <template v-slot:body-cell-state="props">
              <q-td :props="props">
                <q-chip
                  :color="props.value === 1 ? 'positive' : 'negative'"
                  text-color="white"
                  size="sm"
                  :icon="props.value === 1 ? 'check_circle' : 'cancel'"
                >
                  {{ props.value === 1 ? 'Activo' : 'Inactivo' }}
                </q-chip>
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  dense
                  round
                  :icon="props.row.state === 0 ? 'play_arrow' : 'stop'"
                  :color="props.row.state === 0 ? 'positive' : 'negative'"
                  @click="props.row.state === 0 ? startResource(props.row.id) : stopResource(props.row.id)"
                  size="sm"
                >
                  <q-tooltip>
                    {{ props.row.state === 0 ? 'Iniciar' : 'Detener' }}
                  </q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  icon="visibility"
                  color="primary"
                  @click="$router.push({ name: 'resources' })"
                  size="sm"
                  class="q-ml-xs"
                >
                  <q-tooltip>Ver recurso</q-tooltip>
                </q-btn>
              </q-td>
            </template>
            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey q-pa-sm">
                <span>No hay recursos</span>
              </div>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-md-6 table-card" flat bordered>
        <q-card-section class="q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1">Programaciones Recientes</div>
            <q-btn
              flat
              dense
              size="sm"
              label="Ver todos"
              icon-right="arrow_forward"
              color="primary"
              @click="$router.push({ name: 'schedules' })"
            />
          </div>
          <q-table
            :rows="recentSchedules"
            :columns="scheduleColumns"
            row-key="id"
            :loading="loading"
            flat
            dense
            hide-pagination
            :rows-per-page-options="[0]"
            class="dashboard-table"
          >
            <template v-slot:body-cell-isEnabled="props">
              <q-td :props="props">
                <q-chip
                  :color="props.value ? 'positive' : 'negative'"
                  text-color="white"
                  size="sm"
                  :icon="props.value ? 'check_circle' : 'cancel'"
                >
                  {{ props.value ? 'Habilitada' : 'Deshabilitada' }}
                </q-chip>
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  dense
                  round
                  icon="visibility"
                  color="primary"
                  @click="$router.push({ name: 'schedules' })"
                  size="sm"
                >
                  <q-tooltip>Ver detalle</q-tooltip>
                </q-btn>
              </q-td>
            </template>
            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey q-pa-sm">
                <span>No hay programaciones</span>
              </div>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { resourcesService } from '../services/resources';
import { schedulesService } from '../services/schedules';
import type { ResourceStateResource, ScheduleResource } from '../types';

const $q = useQuasar();
const loading = ref(false);
const resources = ref<ResourceStateResource[]>([]);
const schedules = ref<ScheduleResource[]>([]);

const resourcesCount = computed(() => resources.value.length);
const activeResourcesCount = computed(() =>
  resources.value.filter((r) => r.state === 1).length
);
const inactiveResourcesCount = computed(() =>
  resources.value.filter((r) => r.state === 0).length
);
const activeResourcesPercentage = computed(() =>
  resourcesCount.value > 0
    ? Math.round((activeResourcesCount.value / resourcesCount.value) * 100)
    : 0
);
const inactiveResourcesPercentage = computed(() =>
  resourcesCount.value > 0
    ? Math.round((inactiveResourcesCount.value / resourcesCount.value) * 100)
    : 0
);

const schedulesCount = computed(() => schedules.value.length);
const activeSchedulesCount = computed(() =>
  schedules.value.filter((s) => s.isEnabled && s.isActive).length
);
const activeSchedulesPercentage = computed(() =>
  schedulesCount.value > 0
    ? Math.round((activeSchedulesCount.value / schedulesCount.value) * 100)
    : 0
);

const recentResources = computed(() =>
  resources.value
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
);

const recentSchedules = computed(() =>
  schedules.value
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
);

const resourceTypesDistribution = computed(() => {
  const distribution: Record<string, number> = {};
  resources.value.forEach((r) => {
    distribution[r.type] = (distribution[r.type] || 0) + 1;
  });

  return Object.entries(distribution)
    .map(([type, count]) => ({
      type,
      count,
      percentage: resourcesCount.value > 0
        ? Math.round((count / resourcesCount.value) * 100)
        : 0,
    }))
    .sort((a, b) => b.count - a.count);
});

const resourceColumns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
  { name: 'type', label: 'Tipo', field: 'type', align: 'left' },
  { name: 'state', label: 'Estado', field: 'state', align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'center' },
];

const scheduleColumns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
  { name: 'isEnabled', label: 'Estado', field: 'isEnabled', align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'center' },
];

const loadData = async () => {
  loading.value = true;
  try {
    [resources.value, schedules.value] = await Promise.all([
      resourcesService.getAll(),
      schedulesService.getAll(),
    ]);
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al cargar los datos',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

const startResource = async (id: string) => {
  try {
    await resourcesService.start(id);
    $q.notify({
      type: 'positive',
      message: 'Recurso iniciado',
      position: 'top',
      icon: 'play_arrow',
    });
    await loadData();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al iniciar el recurso',
      position: 'top',
    });
  }
};

const stopResource = async (id: string) => {
  try {
    await resourcesService.stop(id);
    $q.notify({
      type: 'positive',
      message: 'Recurso detenido',
      position: 'top',
      icon: 'stop',
    });
    await loadData();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al detener el recurso',
      position: 'top',
    });
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.dashboard-page {
  padding: 16px;
  width: 100%;
  max-width: 100%;
}

.dashboard-stats .stat-card,
.dashboard-charts .chart-card,
.dashboard-tables .table-card {
  min-width: 0;
}

.dashboard-table :deep(.q-table__middle) {
  max-height: 240px;
}

.state-circle :deep(.q-circular-progress__text) {
  color: inherit;
}

.type-distribution .q-linear-progress {
  border-radius: 4px;
}

.progress-label {
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
