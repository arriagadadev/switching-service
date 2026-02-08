<template>
  <q-page class="q-pa-lg" style="width: 100%; max-width: 100%;">
    <div class="text-h4 q-mb-lg">Dashboard</div>

    <!-- Cards de estadísticas -->
    <div class="row q-gutter-md q-mb-lg" style="width: 100%; margin-left: 0; margin-right: 0;">
      <q-card class="col-12 col-sm-6 col-md-3" flat bordered>
        <q-card-section>
          <div class="row items-center no-wrap">
            <div class="col">
              <div class="text-caption text-grey-7">Total Recursos</div>
              <div class="text-h4 text-primary">{{ resourcesCount }}</div>
            </div>
            <q-icon name="storage" size="48px" color="primary" />
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-sm-6 col-md-3" flat bordered>
        <q-card-section>
          <div class="row items-center no-wrap">
            <div class="col">
              <div class="text-caption text-grey-7">Recursos Activos</div>
              <div class="text-h4 text-positive">{{ activeResourcesCount }}</div>
              <div class="text-caption text-grey-6">
                {{ activeResourcesPercentage }}% del total
              </div>
            </div>
            <q-icon name="check_circle" size="48px" color="positive" />
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-sm-6 col-md-3" flat bordered>
        <q-card-section>
          <div class="row items-center no-wrap">
            <div class="col">
              <div class="text-caption text-grey-7">Total Programaciones</div>
              <div class="text-h4 text-primary">{{ schedulesCount }}</div>
            </div>
            <q-icon name="schedule" size="48px" color="primary" />
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-sm-6 col-md-3" flat bordered>
        <q-card-section>
          <div class="row items-center no-wrap">
            <div class="col">
              <div class="text-caption text-grey-7">Programaciones Activas</div>
              <div class="text-h4 text-positive">{{ activeSchedulesCount }}</div>
              <div class="text-caption text-grey-6">
                {{ activeSchedulesPercentage }}% del total
              </div>
            </div>
            <q-icon name="play_circle" size="48px" color="positive" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Gráficos y visualizaciones -->
    <div class="row q-gutter-md q-mb-lg">
      <!-- Distribución por tipo -->
      <q-card class="col-12 col-md-6" flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-md">Recursos por Tipo</div>
          <div v-if="loading" class="text-center q-pa-lg">
            <q-spinner color="primary" size="3em" />
          </div>
          <div v-else class="q-gutter-md">
            <div v-for="type in resourceTypesDistribution" :key="type.type" class="row items-center">
              <div class="col-3">
                <q-chip
                  :color="type.type === 'RDS' ? 'info' : 'secondary'"
                  text-color="white"
                  :icon="type.type === 'RDS' ? 'storage' : 'computer'"
                >
                  {{ type.type }}
                </q-chip>
              </div>
              <div class="col-7">
                <q-linear-progress
                  :value="type.percentage / 100"
                  :color="type.type === 'RDS' ? 'info' : 'secondary'"
                  size="25px"
                >
                  <div class="absolute-full flex flex-center">
                    <q-badge
                      color="white"
                      text-color="primary"
                      :label="`${type.count} (${type.percentage}%)`"
                    />
                  </div>
                </q-linear-progress>
              </div>
            </div>
            <div v-if="resourceTypesDistribution.length === 0" class="text-center text-grey-6 q-pa-md">
              No hay recursos disponibles
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Estado de recursos -->
      <q-card class="col-12 col-md-6" flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-md">Estado de Recursos</div>
          <div v-if="loading" class="text-center q-pa-lg">
            <q-spinner color="primary" size="3em" />
          </div>
          <div v-else class="row q-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="text-center">
                <q-circular-progress
                  :value="activeResourcesPercentage"
                  size="120px"
                  :thickness="0.2"
                  color="positive"
                  track-color="grey-3"
                  class="q-ma-md"
                >
                  <div class="column items-center">
                    <div class="text-h4">{{ activeResourcesCount }}</div>
                    <div class="text-caption text-grey-7">Activos</div>
                  </div>
                </q-circular-progress>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-center">
                <q-circular-progress
                  :value="inactiveResourcesPercentage"
                  size="120px"
                  :thickness="0.2"
                  color="negative"
                  track-color="grey-3"
                  class="q-ma-md"
                >
                  <div class="column items-center">
                    <div class="text-h4">{{ inactiveResourcesCount }}</div>
                    <div class="text-caption text-grey-7">Inactivos</div>
                  </div>
                </q-circular-progress>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Tablas de recursos y programaciones recientes -->
    <div class="row q-gutter-md" style="width: 100%; margin-left: 0; margin-right: 0;">
      <!-- Recursos recientes -->
      <q-card class="col-12 col-md-6" flat bordered>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">Recursos Recientes</div>
            <q-btn
              flat
              dense
              round
              icon="refresh"
              @click="loadData"
              :loading="loading"
            />
          </div>
          <q-table
            :rows="recentResources"
            :columns="resourceColumns"
            row-key="id"
            :loading="loading"
            flat
            hide-pagination
            :rows-per-page-options="[0]"
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
                  <q-tooltip>Ver todos</q-tooltip>
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

      <!-- Programaciones recientes -->
      <q-card class="col-12 col-md-6" flat bordered>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">Programaciones Recientes</div>
            <q-btn
              flat
              dense
              round
              icon="refresh"
              @click="loadData"
              :loading="loading"
            />
          </div>
          <q-table
            :rows="recentSchedules"
            :columns="scheduleColumns"
            row-key="id"
            :loading="loading"
            flat
            hide-pagination
            :rows-per-page-options="[0]"
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
                  <q-tooltip>Ver todos</q-tooltip>
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
