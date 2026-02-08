<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4">Recursos</div>
      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Recurso"
        @click="showCreateDialog = true"
      />
    </div>

    <q-table
      :rows="resources"
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

      <template v-slot:body-cell-state="props">
        <q-td :props="props">
          <q-badge :color="props.value === 1 ? 'positive' : 'negative'">
            {{ props.value === 1 ? 'Activo' : 'Inactivo' }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-type="props">
        <q-td :props="props">
          <q-badge color="info">{{ props.value }}</q-badge>
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
            @click="editResource(props.row)"
            class="q-mr-xs"
          />
          <q-btn
            flat
            dense
            round
            icon="play_arrow"
            color="positive"
            @click="startResource(props.row.id)"
            v-if="props.row.state === 0"
            class="q-mr-xs"
          />
          <q-btn
            flat
            dense
            round
            icon="stop"
            color="negative"
            @click="stopResource(props.row.id)"
            v-if="props.row.state === 1"
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

    <!-- Dialog para crear/editar recurso -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">
            {{ editingResource ? 'Editar Recurso' : 'Nuevo Recurso' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveResource" class="q-gutter-md">
            <q-input
              v-model="resourceForm.name"
              label="Nombre"
              :rules="[(val) => !!val || 'Nombre es requerido']"
              outlined
            />
            <q-input
              v-model="resourceForm.resourceIdentifier"
              label="Identificador del Recurso (ARN)"
              :rules="[(val) => !!val || 'Identificador es requerido']"
              outlined
            />
            <q-select
              v-model="resourceForm.type"
              :options="resourceTypes"
              label="Tipo de Recurso"
              :rules="[(val) => !!val || 'Tipo es requerido']"
              outlined
            />
            <div class="row justify-end q-gutter-sm">
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
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { resourcesService } from '../services/resources';
import type {
  ResourceStateResource,
  StoreResourceStateBody,
  UpdateResourceStateBody,
  ResourceType,
} from '../types';

const $q = useQuasar();
const loading = ref(false);
const resources = ref<ResourceStateResource[]>([]);
const filter = ref('');
const showCreateDialog = ref(false);
const editingResource = ref<ResourceStateResource | null>(null);

const resourceForm = ref<StoreResourceStateBody>({
  name: '',
  resourceIdentifier: '',
  type: 'RDS',
});

const resourceTypes: ResourceType[] = ['RDS', 'EC2'];

const columns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
  {
    name: 'type',
    label: 'Tipo',
    field: 'type',
    align: 'left',
    sortable: true,
  },
  {
    name: 'resourceIdentifier',
    label: 'Identificador',
    field: 'resourceIdentifier',
    align: 'left',
  },
  {
    name: 'state',
    label: 'Estado',
    field: 'state',
    align: 'center',
    sortable: true,
  },
  { name: 'actions', label: 'Acciones', align: 'center' },
];

const loadResources = async () => {
  loading.value = true;
  try {
    resources.value = await resourcesService.getAll();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los recursos',
    });
  } finally {
    loading.value = false;
  }
};

const saveResource = async () => {
  try {
    if (editingResource.value) {
      await resourcesService.update(editingResource.value.id, resourceForm.value);
      $q.notify({
        type: 'positive',
        message: 'Recurso actualizado correctamente',
      });
    } else {
      await resourcesService.create(resourceForm.value);
      $q.notify({
        type: 'positive',
        message: 'Recurso creado correctamente',
      });
    }
    showCreateDialog.value = false;
    resetForm();
    await loadResources();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el recurso',
    });
  }
};

const editResource = (resource: ResourceStateResource) => {
  editingResource.value = resource;
  resourceForm.value = {
    name: resource.name,
    resourceIdentifier: resource.resourceIdentifier,
    type: resource.type,
  };
  showCreateDialog.value = true;
};

const resetForm = () => {
  editingResource.value = null;
  resourceForm.value = {
    name: '',
    resourceIdentifier: '',
    type: 'RDS',
  };
};

const startResource = async (id: string) => {
  $q.dialog({
    title: 'Confirmar',
    message: '¿Está seguro de iniciar este recurso?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await resourcesService.start(id);
      $q.notify({
        type: 'positive',
        message: 'Recurso iniciado',
      });
      await loadResources();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Error al iniciar el recurso',
      });
    }
  });
};

const stopResource = async (id: string) => {
  $q.dialog({
    title: 'Confirmar',
    message: '¿Está seguro de detener este recurso?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await resourcesService.stop(id);
      $q.notify({
        type: 'positive',
        message: 'Recurso detenido',
      });
      await loadResources();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Error al detener el recurso',
      });
    }
  });
};

const confirmDelete = (resource: ResourceStateResource) => {
  $q.dialog({
    title: 'Confirmar Eliminación',
    message: `¿Está seguro de eliminar el recurso "${resource.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await resourcesService.delete(resource.id);
      $q.notify({
        type: 'positive',
        message: 'Recurso eliminado',
      });
      await loadResources();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Error al eliminar el recurso',
      });
    }
  });
};

onMounted(() => {
  loadResources();
});
</script>
