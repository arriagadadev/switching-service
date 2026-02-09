<template>
  <q-page class="q-pa-md">
    <!-- Header con acciones -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 q-mb-xs">Programaciones</div>
        <div class="text-caption text-grey-7">
          Gestiona las programaciones automáticas de tus recursos
        </div>
      </div>
      <q-btn
        color="primary"
        icon="add"
        label="Nueva Programación"
        @click="showCreateDialog = true"
        unelevated
        class="q-px-md"
      />
    </div>

    <!-- Filtros y búsqueda -->
    <q-card class="q-mb-md" flat bordered>
      <q-card-section class="q-pa-md">
        <div class="row q-gutter-md items-end">
          <div class="col-12 col-md-4">
            <q-input
              v-model="filter"
              placeholder="Buscar por nombre o cron..."
              outlined
              dense
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-2">
            <q-select
              v-model="filterEnabled"
              :options="enabledFilterOptions"
              label="Estado"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-md-2">
            <q-btn
              flat
              label="Limpiar"
              icon="clear_all"
              @click="clearFilters"
              :disable="!hasActiveFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla de programaciones -->
    <q-card flat bordered>
      <q-table
        :rows="filteredSchedules"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        @request="onRequest"
        flat
        class="sticky-header-table"
      >
        <template v-slot:top>
          <div class="text-h6">Lista de Programaciones</div>
          <q-space />
          <q-btn
            flat
            round
            dense
            icon="refresh"
            @click="loadSchedules"
            :loading="loading"
          />
        </template>

        <template v-slot:body-cell-isEnabled="props">
          <q-td :props="props">
            <q-toggle
              :model-value="props.value"
              @update:model-value="toggleSchedule(props.row.id, $event)"
              color="positive"
              :disable="toggleLoading[props.row.id]"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-isActive="props">
          <q-td :props="props">
            <q-chip
              :color="props.value ? 'positive' : 'negative'"
              text-color="white"
              :icon="props.value ? 'check_circle' : 'cancel'"
            >
              {{ props.value ? 'Activo' : 'Inactivo' }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-desiredState="props">
          <q-td :props="props">
            <q-chip
              :color="props.value === 1 ? 'positive' : 'negative'"
              text-color="white"
              size="sm"
            >
              {{ props.value === 1 ? 'Activar' : 'Desactivar' }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-cron="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-xs">
              <q-icon name="schedule" size="sm" color="primary" />
              <span class="text-body2">{{ props.value }}</span>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-resources="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <q-chip
                v-for="(resource, idx) in props.value"
                :key="idx"
                color="info"
                text-color="white"
                size="sm"
                :label="resource.resourceIdentifier.split('/').pop() || resource.resourceIdentifier"
              >
                <q-tooltip>{{ resource.resourceIdentifier }}</q-tooltip>
              </q-chip>
              <span v-if="props.value.length === 0" class="text-grey-6 text-caption">
                Sin recursos
              </span>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn-group flat>
              <q-btn
                flat
                dense
                round
                icon="visibility"
                color="primary"
                @click="viewSchedule(props.row)"
                size="sm"
              >
                <q-tooltip>Ver detalles</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                icon="edit"
                color="primary"
                @click="editSchedule(props.row)"
                size="sm"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                @click="confirmDelete(props.row)"
                size="sm"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </q-btn-group>
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
            <q-icon name="schedule" size="2em" />
            <span>No hay programaciones disponibles</span>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog para crear/editar programación -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 700px; max-width: 900px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ editingSchedule ? 'Editar Programación' : 'Nueva Programación' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="resetForm" />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="saveSchedule" class="q-gutter-md" ref="scheduleFormRef">
            <q-input
              v-model="scheduleForm.name"
              label="Nombre *"
              :rules="[(val) => !!val || 'Nombre es requerido']"
              outlined
              hint="Nombre descriptivo para la programación"
            />

            <div>
              <q-input
                v-model="scheduleForm.cron"
                label="Expresión Cron *"
                :rules="[(val) => !!val || 'Cron es requerido']"
                outlined
                hint="Formato: segundo minuto hora día mes día-semana año"
              >
                <template v-slot:append>
                  <q-btn
                    flat
                    dense
                    icon="help"
                    @click="showCronHelper = true"
                  >
                    <q-tooltip>Ayuda con expresiones Cron</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
              <div v-if="scheduleForm.cron" class="q-mt-xs">
                <q-chip color="info" text-color="white" size="sm">
                  <q-icon name="info" class="q-mr-xs" />
                  {{ cronDescription }}
                </q-chip>
              </div>
            </div>

            <q-select
              v-model="scheduleForm.desiredState"
              :options="stateOptions"
              label="Estado Deseado *"
              :rules="[(val) => val !== null || 'Estado es requerido']"
              outlined
              emit-value
              map-options
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon
                      :name="scope.opt.value === 1 ? 'play_arrow' : 'stop'"
                      :color="scope.opt.value === 1 ? 'positive' : 'negative'"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-select
              v-model="scheduleForm.resources"
              :options="availableResources"
              option-label="name"
              option-value="id"
              multiple
              label="Recursos *"
              outlined
              use-chips
              :rules="[(val) => val.length > 0 || 'Selecciona al menos un recurso']"
              hint="Selecciona los recursos que se afectarán por esta programación"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon
                      :name="scope.opt.type === 'RDS' ? 'storage' : 'computer'"
                      color="info"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.type }} - {{ scope.opt.resourceIdentifier }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-toggle
              v-model="scheduleForm.isEnabled"
              label="Habilitar programación"
              color="positive"
              left-label
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn
                flat
                label="Cancelar"
                color="primary"
                v-close-popup
                @click="resetForm"
              />
              <q-btn
                label="Guardar"
                type="submit"
                color="primary"
                :loading="saving"
                unelevated
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog de ayuda Cron -->
    <q-dialog v-model="showCronHelper">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Ayuda con Expresiones Cron</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="q-gutter-md">
            <div>
              <div class="text-subtitle2 q-mb-xs">Formato:</div>
              <code class="bg-grey-3 q-pa-sm rounded-borders block">
                segundo minuto hora día mes día-semana año
              </code>
            </div>
            <q-separator />
            <div>
              <div class="text-subtitle2 q-mb-xs">Ejemplos comunes:</div>
              <div class="q-gutter-sm">
                <div>
                  <code class="bg-grey-3 q-pa-xs rounded-borders">0 9 * * ? *</code>
                  <span class="q-ml-sm text-caption">Todos los días a las 9:00 AM</span>
                </div>
                <div>
                  <code class="bg-grey-3 q-pa-xs rounded-borders">0 0 1 * ? *</code>
                  <span class="q-ml-sm text-caption">Primer día de cada mes a medianoche</span>
                </div>
                <div>
                  <code class="bg-grey-3 q-pa-xs rounded-borders">0 0/30 * * ? *</code>
                  <span class="q-ml-sm text-caption">Cada 30 minutos</span>
                </div>
                <div>
                  <code class="bg-grey-3 q-pa-xs rounded-borders">0 0 9 ? * MON-FRI *</code>
                  <span class="q-ml-sm text-caption">Lunes a viernes a las 9:00 AM</span>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog de detalles -->
    <q-dialog v-model="showDetailDialog">
      <q-card style="min-width: 600px; max-width: 800px" v-if="selectedSchedule">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Detalles de la Programación</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <div>
              <div class="text-caption text-grey-7">Nombre</div>
              <div class="text-body1">{{ selectedSchedule.name }}</div>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Expresión Cron</div>
              <div class="text-body2">
                <q-icon name="schedule" size="sm" color="primary" class="q-mr-xs" />
                {{ selectedSchedule.cron }}
              </div>
              <q-chip color="info" text-color="white" size="sm" class="q-mt-xs">
                {{ cronDescription }}
              </q-chip>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Estado Deseado</div>
              <q-chip
                :color="selectedSchedule.desiredState === 1 ? 'positive' : 'negative'"
                text-color="white"
              >
                {{ selectedSchedule.desiredState === 1 ? 'Activar' : 'Desactivar' }}
              </q-chip>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Habilitado</div>
              <q-chip
                :color="selectedSchedule.isEnabled ? 'positive' : 'negative'"
                text-color="white"
                :icon="selectedSchedule.isEnabled ? 'check_circle' : 'cancel'"
              >
                {{ selectedSchedule.isEnabled ? 'Sí' : 'No' }}
              </q-chip>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Activo</div>
              <q-chip
                :color="selectedSchedule.isActive ? 'positive' : 'negative'"
                text-color="white"
                :icon="selectedSchedule.isActive ? 'check_circle' : 'cancel'"
              >
                {{ selectedSchedule.isActive ? 'Sí' : 'No' }}
              </q-chip>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Recursos Asociados</div>
              <div class="q-mt-sm q-gutter-xs">
                <q-chip
                  v-for="(resource, idx) in selectedSchedule.resources"
                  :key="idx"
                  color="info"
                  text-color="white"
                  :icon="resource.type === 'RDS' ? 'storage' : 'computer'"
                >
                  {{ resource.resourceIdentifier.split('/').pop() || resource.resourceIdentifier }}
                </q-chip>
                <span v-if="selectedSchedule.resources.length === 0" class="text-grey-6">
                  Sin recursos asociados
                </span>
              </div>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">ID</div>
              <div class="text-body2 text-grey-8">{{ selectedSchedule.id }}</div>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Fecha de Creación</div>
              <div class="text-body2 text-grey-8">
                {{ formatDate(selectedSchedule.timestamp) }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Editar"
            color="primary"
            @click="editSchedule(selectedSchedule); showDetailDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { schedulesService } from '../services/schedules';
import { resourcesService } from '../services/resources';
import type {
  ScheduleResource,
  StoreScheduleBody,
  UpdateScheduleBody,
  ResourceStateResource,
  Resource,
  State,
} from '../types';

const $q = useQuasar();
const loading = ref(false);
const saving = ref(false);
const schedules = ref<ScheduleResource[]>([]);
const resources = ref<ResourceStateResource[]>([]);
const filter = ref('');
const filterEnabled = ref<boolean | null>(null);
const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const showCronHelper = ref(false);
const editingSchedule = ref<ScheduleResource | null>(null);
const selectedSchedule = ref<ScheduleResource | null>(null);
const toggleLoading = ref<Record<string, boolean>>({});
const scheduleFormRef = ref<any>(null);

const scheduleForm = ref<StoreScheduleBody>({
  name: '',
  cron: '',
  isEnabled: true,
  desiredState: 0,
  resources: [],
});

const stateOptions = [
  {
    label: 'Activar',
    value: 1,
    description: 'Los recursos se activarán según el cron',
  },
  {
    label: 'Desactivar',
    value: 0,
    description: 'Los recursos se desactivarán según el cron',
  },
];

const enabledFilterOptions = [
  { label: 'Todos', value: null },
  { label: 'Habilitadas', value: true },
  { label: 'Deshabilitadas', value: false },
];

const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const hasActiveFilters = computed(() => {
  return !!filter.value || filterEnabled.value !== null;
});

const cronDescription = computed(() => {
  if (!scheduleForm.value.cron) return '';
  // Descripción simple del cron
  const parts = scheduleForm.value.cron.split(' ');
  if (parts.length >= 3) {
    const hour = parts[2];
    const minute = parts[1];
    if (hour !== '*' && minute !== '*') {
      return `Ejecuta a las ${hour}:${minute.padStart(2, '0')}`;
    }
  }
  return 'Expresión cron personalizada';
});

const availableResources = computed(() =>
  resources.value.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    resourceIdentifier: r.resourceIdentifier,
  }))
);

const filteredSchedules = computed(() => {
  let result = [...schedules.value];

  // Filtro de búsqueda
  if (filter.value) {
    const search = filter.value.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.cron.toLowerCase().includes(search)
    );
  }

  // Filtro por habilitado
  if (filterEnabled.value !== null) {
    result = result.filter((s) => s.isEnabled === filterEnabled.value);
  }

  // Ordenamiento
  const sortBy = pagination.value.sortBy;
  const descending = pagination.value.descending;
  result.sort((a, b) => {
    const aVal = a[sortBy as keyof ScheduleResource];
    const bVal = b[sortBy as keyof ScheduleResource];
    if (aVal < bVal) return descending ? 1 : -1;
    if (aVal > bVal) return descending ? -1 : 1;
    return 0;
  });

  pagination.value.rowsNumber = result.length;

  // Paginación
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const end = start + pagination.value.rowsPerPage;
  return result.slice(start, end);
});

const columns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
  { name: 'cron', label: 'Cron', field: 'cron', align: 'left', sortable: true },
  {
    name: 'desiredState',
    label: 'Estado Deseado',
    field: 'desiredState',
    align: 'center',
  },
  {
    name: 'resources',
    label: 'Recursos',
    field: 'resources',
    align: 'left',
  },
  {
    name: 'isEnabled',
    label: 'Habilitado',
    field: 'isEnabled',
    align: 'center',
  },
  {
    name: 'isActive',
    label: 'Activo',
    field: 'isActive',
    align: 'center',
  },
  { name: 'actions', label: 'Acciones', align: 'center' },
];

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('es-ES');
};

const clearFilters = () => {
  filter.value = '';
  filterEnabled.value = null;
};

const onRequest = (props: any) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy;
  pagination.value.descending = descending;
};

const loadSchedules = async () => {
  loading.value = true;
  try {
    schedules.value = await schedulesService.getAll();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al cargar las programaciones',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

const loadResources = async () => {
  try {
    resources.value = await resourcesService.getAll();
  } catch (error) {
    console.error('Error al cargar recursos:', error);
  }
};

const saveSchedule = async () => {
  saving.value = true;
  try {
    if (editingSchedule.value) {
      await schedulesService.update(editingSchedule.value.id, scheduleForm.value);
      $q.notify({
        type: 'positive',
        message: 'Programación actualizada correctamente',
        position: 'top',
        icon: 'check_circle',
      });
    } else {
      await schedulesService.create(scheduleForm.value);
      $q.notify({
        type: 'positive',
        message: 'Programación creada correctamente',
        position: 'top',
        icon: 'check_circle',
      });
    }
    showCreateDialog.value = false;
    resetForm();
    await loadSchedules();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al guardar la programación',
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
};

const viewSchedule = (schedule: ScheduleResource) => {
  selectedSchedule.value = schedule;
  showDetailDialog.value = true;
};

const editSchedule = (schedule: ScheduleResource) => {
  editingSchedule.value = schedule;
  scheduleForm.value = {
    name: schedule.name,
    cron: schedule.cron,
    isEnabled: schedule.isEnabled,
    desiredState: schedule.desiredState,
    resources: schedule.resources,
  };
  showCreateDialog.value = true;
};

const resetForm = () => {
  editingSchedule.value = null;
  scheduleForm.value = {
    name: '',
    cron: '',
    isEnabled: true,
    desiredState: 0,
    resources: [],
  };
  if (scheduleFormRef.value) {
    scheduleFormRef.value.resetValidation();
  }
};

const toggleSchedule = async (id: string, enabled: boolean) => {
  toggleLoading.value[id] = true;
  try {
    const schedule = schedules.value.find((s) => s.id === id);
    if (schedule) {
      await schedulesService.update(id, {
        ...schedule,
        isEnabled: enabled,
      });
      $q.notify({
        type: 'positive',
        message: `Programación ${enabled ? 'habilitada' : 'deshabilitada'}`,
        position: 'top',
        icon: enabled ? 'check_circle' : 'cancel',
      });
      await loadSchedules();
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al actualizar la programación',
      position: 'top',
    });
  } finally {
    toggleLoading.value[id] = false;
  }
};

const confirmDelete = (schedule: ScheduleResource) => {
  $q.dialog({
    title: 'Confirmar Eliminación',
    message: `¿Está seguro de eliminar la programación "${schedule.name}"?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Eliminar',
      color: 'negative',
      unelevated: true,
    },
  }).onOk(async () => {
    try {
      await schedulesService.delete(schedule.id);
      $q.notify({
        type: 'positive',
        message: 'Programación eliminada correctamente',
        position: 'top',
        icon: 'delete',
      });
      await loadSchedules();
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: error.message || 'Error al eliminar la programación',
        position: 'top',
      });
    }
  });
};

onMounted(async () => {
  await Promise.all([loadSchedules(), loadResources()]);
});
</script>

<style scoped>
.sticky-header-table {
  max-height: calc(100vh - 200px);
}
</style>
