<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Dashboard</div>

    <div class="row q-gutter-md q-mb-md">
      <q-card class="col-12 col-sm-6 col-md-3">
        <q-card-section>
          <div class="text-h6">Total Recursos</div>
          <div class="text-h4 text-primary">{{ resourcesCount }}</div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-sm-6 col-md-3">
        <q-card-section>
          <div class="text-h6">Recursos Activos</div>
          <div class="text-h4 text-positive">{{ activeResourcesCount }}</div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-sm-6 col-md-3">
        <q-card-section>
          <div class="text-h6">Total Programaciones</div>
          <div class="text-h4 text-primary">{{ schedulesCount }}</div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-sm-6 col-md-3">
        <q-card-section>
          <div class="text-h6">Programaciones Activas</div>
          <div class="text-h4 text-positive">{{ activeSchedulesCount }}</div>
        </q-card-section>
      </q-card>
    </div>

    <q-card class="q-mt-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Recursos Recientes</div>
        <q-table
          :rows="recentResources"
          :columns="resourceColumns"
          row-key="id"
          :loading="loading"
          flat
        >
          <template v-slot:body-cell-state="props">
            <q-td :props="props">
              <q-badge :color="props.value === 1 ? 'positive' : 'negative'">
                {{ props.value === 1 ? 'Activo' : 'Inactivo' }}
              </q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                round
                icon="play_arrow"
                color="positive"
                @click="startResource(props.row.id)"
                v-if="props.row.state === 0"
              />
              <q-btn
                flat
                dense
                round
                icon="stop"
                color="negative"
                @click="stopResource(props.row.id)"
                v-if="props.row.state === 1"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
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
const schedulesCount = computed(() => schedules.value.length);
const activeSchedulesCount = computed(() =>
  schedules.value.filter((s) => s.isEnabled && s.isActive).length
);

const recentResources = computed(() =>
  resources.value
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
);

const resourceColumns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
  { name: 'type', label: 'Tipo', field: 'type', align: 'left' },
  { name: 'state', label: 'Estado', field: 'state', align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'center' },
];

const loadData = async () => {
  loading.value = true;
  try {
    resources.value = await resourcesService.getAll();
    schedules.value = await schedulesService.getAll();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los datos',
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
    });
    await loadData();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al iniciar el recurso',
    });
  }
};

const stopResource = async (id: string) => {
  try {
    await resourcesService.stop(id);
    $q.notify({
      type: 'positive',
      message: 'Recurso detenido',
    });
    await loadData();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al detener el recurso',
    });
  }
};

onMounted(() => {
  loadData();
});
</script>
