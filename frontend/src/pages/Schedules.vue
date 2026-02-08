<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4">Programaciones</div>
      <q-btn
        color="primary"
        icon="add"
        label="Nueva Programación"
        @click="showCreateDialog = true"
      />
    </div>

    <q-table
      :rows="schedules"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :filter="filter"
      flat
    >
      <template v-slot:top-right>
        <q-input
          v-model="filter"
          placeholder="Buscar..."
          dense
          outlined
          clearable
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-isEnabled="props">
        <q-td :props="props">
          <q-toggle
            :model-value="props.value"
            @update:model-value="toggleSchedule(props.row.id, $event)"
            color="positive"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-isActive="props">
        <q-td :props="props">
          <q-badge :color="props.value ? 'positive' : 'negative'">
            {{ props.value ? 'Activo' : 'Inactivo' }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="edit"
            color="primary"
            @click="editSchedule(props.row)"
            class="q-mr-xs"
          />
          <q-btn
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="confirmDelete(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Dialog para crear/editar programación -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">
            {{ editingSchedule ? 'Editar Programación' : 'Nueva Programación' }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveSchedule" class="q-gutter-md">
            <q-input
              v-model="scheduleForm.name"
              label="Nombre"
              :rules="[(val) => !!val || 'Nombre es requerido']"
              outlined
            />
            <q-input
              v-model="scheduleForm.cron"
              label="Expresión Cron"
              hint="Ejemplo: 0 9 * * ? * (todos los días a las 9 AM)"
              :rules="[(val) => !!val || 'Cron es requerido']"
              outlined
            />
            <q-select
              v-model="scheduleForm.desiredState"
              :options="stateOptions"
              label="Estado Deseado"
              :rules="[(val) => val !== null || 'Estado es requerido']"
              outlined
            />
            <q-select
              v-model="scheduleForm.resources"
              :options="availableResources"
              option-label="name"
              option-value="id"
              multiple
              label="Recursos"
              outlined
              use-chips
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.type }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-toggle
              v-model="scheduleForm.isEnabled"
              label="Habilitado"
              color="positive"
            />
            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Cancelar" color="primary" v-close-popup />
              <q-btn label="Guardar" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
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
const schedules = ref<ScheduleResource[]>([]);
const resources = ref<ResourceStateResource[]>([]);
const filter = ref('');
const showCreateDialog = ref(false);
const editingSchedule = ref<ScheduleResource | null>(null);

const scheduleForm = ref<StoreScheduleBody>({
  name: '',
  cron: '',
  isEnabled: true,
  desiredState: 0,
  resources: [],
});

const stateOptions = [
  { label: 'Inactivo (0)', value: 0 },
  { label: 'Activo (1)', value: 1 },
];

const availableResources = computed(() =>
  resources.value.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    resourceIdentifier: r.resourceIdentifier,
  }))
);

const columns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
  { name: 'cron', label: 'Cron', field: 'cron', align: 'left' },
  {
    name: 'desiredState',
    label: 'Estado Deseado',
    field: 'desiredState',
    align: 'center',
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

const loadSchedules = async () => {
  loading.value = true;
  try {
    schedules.value = await schedulesService.getAll();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar las programaciones',
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
  try {
    if (editingSchedule.value) {
      await schedulesService.update(editingSchedule.value.id, scheduleForm.value);
      $q.notify({
        type: 'positive',
        message: 'Programación actualizada correctamente',
      });
    } else {
      await schedulesService.create(scheduleForm.value);
      $q.notify({
        type: 'positive',
        message: 'Programación creada correctamente',
      });
    }
    showCreateDialog.value = false;
    resetForm();
    await loadSchedules();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al guardar la programación',
    });
  }
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
};

const toggleSchedule = async (id: string, enabled: boolean) => {
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
      });
      await loadSchedules();
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al actualizar la programación',
    });
  }
};

const confirmDelete = (schedule: ScheduleResource) => {
  $q.dialog({
    title: 'Confirmar Eliminación',
    message: `¿Está seguro de eliminar la programación "${schedule.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await schedulesService.delete(schedule.id);
      $q.notify({
        type: 'positive',
        message: 'Programación eliminada',
      });
      await loadSchedules();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Error al eliminar la programación',
      });
    }
  });
};

onMounted(async () => {
  await Promise.all([loadSchedules(), loadResources()]);
});
</script>
