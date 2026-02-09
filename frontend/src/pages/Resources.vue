<template>
  <q-page class="q-pa-md">
    <!-- Header con acciones -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 q-mb-xs">Recursos</div>
        <div class="text-caption text-grey-7">
          Gestiona tus recursos AWS (RDS, EC2)
        </div>
      </div>
      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Recurso"
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
            <div class="search-input-wrapper">
              <q-icon name="search" class="search-input-icon" />
              <input
                v-model="filter"
                type="text"
                class="search-input-native"
                placeholder="Buscar por nombre o identificador..."
                ref="searchInputRef"
              />
              <q-btn
                v-if="filter"
                flat
                round
                dense
                icon="close"
                size="sm"
                class="search-input-clear"
                @click="filter = ''"
              />
            </div>
          </div>
          <div class="col-12 col-md-2">
            <q-select
              v-model="filterType"
              :options="typeFilterOptions"
              label="Tipo"
              outlined
              dense
              clearable
              emit-value
              map-options
            >
              <template v-slot:selected>
                <span v-if="filterType" class="text-white">
                  {{ typeFilterOptions.find(o => o.value === filterType)?.label }}
                </span>
              </template>
            </q-select>
          </div>
          <div class="col-12 col-md-2">
            <q-select
              v-model="filterState"
              :options="stateFilterOptions"
              label="Estado"
              outlined
              dense
              clearable
              emit-value
              map-options
            >
              <template v-slot:selected>
                <span v-if="filterState !== null" class="text-white">
                  {{ stateFilterOptions.find(o => o.value === filterState)?.label }}
                </span>
              </template>
            </q-select>
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
          <div class="col-12 col-md-2 text-right">
            <q-btn-toggle
              v-model="viewMode"
              :options="viewModeOptions"
              color="primary"
              dense
              toggle-color="primary"
              unelevated
              spread
              no-caps
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Vista de tabla -->
    <q-card v-if="viewMode === 'table'" flat bordered>
      <q-table
        :rows="filteredResources"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        @request="onRequest"
        flat
        class="sticky-header-table"
      >
        <template v-slot:top>
          <div class="text-h6">Lista de Recursos</div>
          <q-space />
          <q-btn
            flat
            round
            dense
            icon="refresh"
            @click="loadResources"
            :loading="loading"
          />
        </template>

        <template v-slot:body-cell-state="props">
          <q-td :props="props">
            <q-chip
              :color="props.value === 1 ? 'positive' : 'negative'"
              text-color="white"
              :icon="props.value === 1 ? 'check_circle' : 'cancel'"
            >
              {{ props.value === 1 ? 'Activo' : 'Inactivo' }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-type="props">
          <q-td :props="props">
            <q-chip
              color="info"
              text-color="white"
              :icon="props.value === 'RDS' ? 'storage' : 'computer'"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-resourceIdentifier="props">
          <q-td :props="props">
            <div class="text-caption text-grey-7" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
              {{ props.value }}
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
                @click="viewResource(props.row)"
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
                @click="editResource(props.row)"
                size="sm"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                :icon="props.row.state === 0 ? 'play_arrow' : 'stop'"
                :color="props.row.state === 0 ? 'positive' : 'negative'"
                @click="props.row.state === 0 ? startResource(props.row.id) : stopResource(props.row.id)"
                size="sm"
                :loading="actionLoading[props.row.id]"
              >
                <q-tooltip>
                  {{ props.row.state === 0 ? 'Iniciar' : 'Detener' }}
                </q-tooltip>
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
            <q-icon name="inbox" size="2em" />
            <span>No hay recursos disponibles</span>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Vista de cards -->
    <div v-else class="row q-gutter-md">
      <div
        v-for="resource in filteredResources"
        :key="resource.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="resource-card" flat bordered>
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6 q-mb-xs">{{ resource.name }}</div>
                <div class="text-caption text-grey-7">
                  {{ resource.resourceIdentifier }}
                </div>
              </div>
              <q-chip
                :color="resource.state === 1 ? 'positive' : 'negative'"
                text-color="white"
                :icon="resource.state === 1 ? 'check_circle' : 'cancel'"
                size="sm"
              >
                {{ resource.state === 1 ? 'Activo' : 'Inactivo' }}
              </q-chip>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pt-sm">
            <div class="row q-gutter-xs">
              <q-chip
                color="info"
                text-color="white"
                :icon="resource.type === 'RDS' ? 'storage' : 'computer'"
                size="sm"
              >
                {{ resource.type }}
              </q-chip>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              dense
              icon="visibility"
              label="Ver"
              color="primary"
              @click="viewResource(resource)"
            />
            <q-btn
              flat
              dense
              icon="edit"
              color="primary"
              @click="editResource(resource)"
            />
            <q-btn
              flat
              dense
              :icon="resource.state === 0 ? 'play_arrow' : 'stop'"
              :color="resource.state === 0 ? 'positive' : 'negative'"
              @click="resource.state === 0 ? startResource(resource.id) : stopResource(resource.id)"
              :loading="actionLoading[resource.id]"
            />
            <q-btn
              flat
              dense
              icon="delete"
              color="negative"
              @click="confirmDelete(resource)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Dialog para crear/editar recurso -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ editingResource ? 'Editar Recurso' : 'Nuevo Recurso' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveResource" class="q-gutter-md" ref="resourceFormRef">
            <q-input
              v-model="resourceForm.name"
              label="Nombre *"
              :rules="[(val) => !!val || 'Nombre es requerido']"
              outlined
              hint="Nombre descriptivo para el recurso"
            />
            <q-select
              v-if="resourceForm.type === 'EC2'"
              v-model="resourceForm.resourceIdentifier"
              :options="filteredEC2Options"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              label="Instancia EC2 *"
              :rules="[(val) => !!val || 'Selecciona una instancia EC2']"
              outlined
              use-input
              input-debounce="300"
              @filter="filterEC2Instances"
              hint="Busca y selecciona una instancia EC2 de tu cuenta"
              :loading="loadingEC2Instances"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ loadingEC2Instances ? 'Cargando instancias...' : 'No se encontraron instancias' }}
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon
                      :name="scope.opt.state === 'running' ? 'check_circle' : 'cancel'"
                      :color="scope.opt.state === 'running' ? 'positive' : 'negative'"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      {{ scope.opt.instanceId }} - {{ scope.opt.instanceType }} ({{ scope.opt.state }})
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-select
              v-else-if="resourceForm.type === 'RDS'"
              v-model="resourceForm.resourceIdentifier"
              :options="filteredRDSOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              label="Instancia RDS *"
              :rules="[(val) => !!val || 'Selecciona una instancia RDS']"
              outlined
              use-input
              input-debounce="300"
              @filter="filterRDSInstances"
              hint="Busca y selecciona una instancia RDS de tu cuenta"
              :loading="loadingRDSInstances"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ loadingRDSInstances ? 'Cargando instancias...' : 'No se encontraron instancias' }}
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon
                      :name="scope.opt.status === 'available' ? 'check_circle' : 'cancel'"
                      :color="scope.opt.status === 'available' ? 'positive' : 'negative'"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      {{ scope.opt.value }} - {{ scope.opt.engine }} ({{ scope.opt.status }})
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-input
              v-else
              v-model="resourceForm.resourceIdentifier"
              label="Identificador del Recurso (ARN) *"
              :rules="[(val) => !!val || 'Identificador es requerido']"
              outlined
              hint="ARN completo del recurso AWS"
            >
              <template v-slot:append>
                <q-icon name="info" class="cursor-pointer">
                  <q-tooltip>
                    Ejemplo: arn:aws:rds:us-east-1:123456789012:db:mydb
                  </q-tooltip>
                </q-icon>
              </template>
            </q-input>
            <q-select
              v-model="resourceForm.type"
              :options="resourceTypes"
              label="Tipo de Recurso *"
              :rules="[(val) => !!val || 'Tipo es requerido']"
              outlined
              emit-value
              map-options
              @update:model-value="onResourceTypeChange"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon :name="scope.opt.icon" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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

    <!-- Dialog de detalles -->
    <q-dialog v-model="showDetailDialog">
      <q-card style="min-width: 600px; max-width: 800px" v-if="selectedResource">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Detalles del Recurso</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <div>
              <div class="text-caption text-grey-7">Nombre</div>
              <div class="text-body1">{{ selectedResource.name }}</div>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Tipo</div>
              <q-chip
                color="info"
                text-color="white"
                :icon="selectedResource.type === 'RDS' ? 'storage' : 'computer'"
              >
                {{ selectedResource.type }}
              </q-chip>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Estado</div>
              <q-chip
                :color="selectedResource.state === 1 ? 'positive' : 'negative'"
                text-color="white"
                :icon="selectedResource.state === 1 ? 'check_circle' : 'cancel'"
              >
                {{ selectedResource.state === 1 ? 'Activo' : 'Inactivo' }}
              </q-chip>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Identificador (ARN)</div>
              <div class="text-body2 text-grey-8">{{ selectedResource.resourceIdentifier }}</div>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">ID</div>
              <div class="text-body2 text-grey-8">{{ selectedResource.id }}</div>
            </div>
            <q-separator />
            <div>
              <div class="text-caption text-grey-7">Fecha de Creación</div>
              <div class="text-body2 text-grey-8">
                {{ formatDate(selectedResource.timestamp) }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Editar"
            color="primary"
            @click="editResource(selectedResource); showDetailDialog = false"
          />
          <q-btn
            flat
            :label="selectedResource.state === 0 ? 'Iniciar' : 'Detener'"
            :color="selectedResource.state === 0 ? 'positive' : 'negative'"
            :icon="selectedResource.state === 0 ? 'play_arrow' : 'stop'"
            @click="selectedResource.state === 0 ? startResource(selectedResource.id) : stopResource(selectedResource.id); showDetailDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { resourcesService } from '../services/resources';
import { awsResourcesService, type EC2Instance, type RDSInstance } from '../services/awsResources';
import type {
  ResourceStateResource,
  StoreResourceStateBody,
  UpdateResourceStateBody,
  ResourceType,
} from '../types';

const $q = useQuasar();
const loading = ref(false);
const saving = ref(false);
const resources = ref<ResourceStateResource[]>([]);
const filter = ref('');
const filterType = ref<ResourceType | null>(null);
const filterState = ref<number | null>(null);
const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const editingResource = ref<ResourceStateResource | null>(null);
const selectedResource = ref<ResourceStateResource | null>(null);
const viewMode = ref<'table' | 'cards'>('table');
const actionLoading = ref<Record<string, boolean>>({});
const resourceFormRef = ref<any>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const resourceForm = ref<StoreResourceStateBody>({
  name: '',
  resourceIdentifier: '',
  type: 'RDS',
});

// Estados para instancias AWS
const loadingEC2Instances = ref(false);
const loadingRDSInstances = ref(false);
const ec2Instances = ref<EC2Instance[]>([]);
const rdsInstances = ref<RDSInstance[]>([]);
const ec2InstancesOptions = ref<any[]>([]);
const rdsInstancesOptions = ref<any[]>([]);
const filteredEC2Options = ref<any[]>([]);
const filteredRDSOptions = ref<any[]>([]);

const resourceTypes = [
  { label: 'RDS', value: 'RDS', icon: 'storage', description: 'Amazon RDS Database' },
  { label: 'EC2', value: 'EC2', icon: 'computer', description: 'Amazon EC2 Instance' },
];

const typeFilterOptions = [
  { label: 'Todos', value: null },
  { label: 'RDS', value: 'RDS' },
  { label: 'EC2', value: 'EC2' },
];

const stateFilterOptions = [
  { label: 'Todos', value: null },
  { label: 'Activo', value: 1 },
  { label: 'Inactivo', value: 0 },
];

const viewModeOptions = [
  { label: 'Tabla', value: 'table', icon: 'table_chart' },
  { label: 'Tarjetas', value: 'cards', icon: 'view_module' },
] as const;

// Cargar preferencia de vista desde localStorage
onMounted(() => {
  const savedViewMode = localStorage.getItem('resourcesViewMode');
  if (savedViewMode === 'table' || savedViewMode === 'cards') {
    viewMode.value = savedViewMode;
  }
});

// Guardar preferencia cuando cambie
watch(viewMode, (newMode) => {
  localStorage.setItem('resourcesViewMode', newMode);
});

const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const hasActiveFilters = computed(() => {
  return !!filter.value || filterType.value !== null || filterState.value !== null;
});

const filteredResources = computed(() => {
  let result = [...resources.value];

  // Filtro de búsqueda
  if (filter.value) {
    const search = filter.value.toLowerCase();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(search) ||
        r.resourceIdentifier.toLowerCase().includes(search)
    );
  }

  // Filtro por tipo
  if (filterType.value !== null) {
    result = result.filter((r) => r.type === filterType.value);
  }

  // Filtro por estado
  if (filterState.value !== null) {
    result = result.filter((r) => r.state === filterState.value);
  }

  // Ordenamiento
  const sortBy = pagination.value.sortBy;
  const descending = pagination.value.descending;
  result.sort((a, b) => {
    const aVal = a[sortBy as keyof ResourceStateResource];
    const bVal = b[sortBy as keyof ResourceStateResource];
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
  {
    name: 'name',
    label: 'Nombre',
    field: 'name',
    align: 'left',
    sortable: true,
  },
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

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('es-ES');
};

const clearFilters = () => {
  filter.value = '';
  filterType.value = null;
  filterState.value = null;
};

const onRequest = (props: any) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy;
  pagination.value.descending = descending;
};

const loadResources = async () => {
  loading.value = true;
  try {
    resources.value = await resourcesService.getAll();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al cargar los recursos',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

const saveResource = async () => {
  saving.value = true;
  try {
    // Asegurar que resourceIdentifier sea siempre un string
    const formData = {
      ...resourceForm.value,
      resourceIdentifier: typeof resourceForm.value.resourceIdentifier === 'string'
        ? resourceForm.value.resourceIdentifier
        : String(resourceForm.value.resourceIdentifier || ''),
    };

    if (editingResource.value) {
      await resourcesService.update(editingResource.value.id, formData);
      $q.notify({
        type: 'positive',
        message: 'Recurso actualizado correctamente',
        position: 'top',
        icon: 'check_circle',
      });
    } else {
      await resourcesService.create(formData);
      $q.notify({
        type: 'positive',
        message: 'Recurso creado correctamente',
        position: 'top',
        icon: 'check_circle',
      });
    }
    showCreateDialog.value = false;
    resetForm();
    await loadResources();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al guardar el recurso',
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
};

const viewResource = (resource: ResourceStateResource) => {
  selectedResource.value = resource;
  showDetailDialog.value = true;
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
  filteredEC2Options.value = [];
  filteredRDSOptions.value = [];
  if (resourceFormRef.value) {
    resourceFormRef.value.resetValidation();
  }
};

const loadEC2Instances = async () => {
  if (ec2Instances.value.length > 0) return; // Ya cargadas
  loadingEC2Instances.value = true;
  try {
    const instances = await awsResourcesService.getEC2Instances();
    ec2Instances.value = instances;
    ec2InstancesOptions.value = instances.map((instance) => ({
      label: instance.name,
      value: instance.instanceId,
      instanceId: instance.instanceId,
      instanceType: instance.instanceType,
      state: instance.state,
    }));
    filteredEC2Options.value = ec2InstancesOptions.value;
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al cargar instancias EC2',
      position: 'top',
    });
  } finally {
    loadingEC2Instances.value = false;
  }
};

const loadRDSInstances = async () => {
  if (rdsInstances.value.length > 0) return; // Ya cargadas
  loadingRDSInstances.value = true;
  try {
    const instances = await awsResourcesService.getRDSInstances();
    rdsInstances.value = instances;
    rdsInstancesOptions.value = instances.map((instance) => ({
      label: instance.name,
      value: instance.dbInstanceIdentifier,
      dbInstanceIdentifier: instance.dbInstanceIdentifier,
      engine: instance.engine,
      status: instance.status,
    }));
    filteredRDSOptions.value = rdsInstancesOptions.value;
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al cargar instancias RDS',
      position: 'top',
    });
  } finally {
    loadingRDSInstances.value = false;
  }
};

const filterEC2Instances = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      filteredEC2Options.value = ec2InstancesOptions.value;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredEC2Options.value = ec2InstancesOptions.value.filter(
      (v) =>
        v.label.toLowerCase().indexOf(needle) > -1 ||
        v.instanceId.toLowerCase().indexOf(needle) > -1 ||
        v.instanceType.toLowerCase().indexOf(needle) > -1
    );
  });
};

const filterRDSInstances = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      filteredRDSOptions.value = rdsInstancesOptions.value;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredRDSOptions.value = rdsInstancesOptions.value.filter(
      (v) =>
        v.label.toLowerCase().indexOf(needle) > -1 ||
        v.value.toLowerCase().indexOf(needle) > -1 ||
        v.engine.toLowerCase().indexOf(needle) > -1
    );
  });
};

const onResourceTypeChange = (newType: ResourceType) => {
  resourceForm.value.resourceIdentifier = ''; // Limpiar selección anterior
  if (newType === 'EC2') {
    loadEC2Instances();
  } else if (newType === 'RDS') {
    loadRDSInstances();
  }
};

const startResource = async (id: string) => {
  actionLoading.value[id] = true;
  $q.dialog({
    title: 'Confirmar Inicio',
    message: '¿Está seguro de iniciar este recurso?',
    cancel: true,
    persistent: true,
    ok: {
      label: 'Iniciar',
      color: 'positive',
      unelevated: true,
    },
  })
    .onOk(async () => {
      try {
        await resourcesService.start(id);
        $q.notify({
          type: 'positive',
          message: 'Recurso iniciado correctamente',
          position: 'top',
          icon: 'play_arrow',
        });
        await loadResources();
        if (showDetailDialog.value) {
          showDetailDialog.value = false;
        }
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: error.message || 'Error al iniciar el recurso',
          position: 'top',
        });
      } finally {
        actionLoading.value[id] = false;
      }
    })
    .onCancel(() => {
      actionLoading.value[id] = false;
    });
};

const stopResource = async (id: string) => {
  actionLoading.value[id] = true;
  $q.dialog({
    title: 'Confirmar Detención',
    message: '¿Está seguro de detener este recurso?',
    cancel: true,
    persistent: true,
    ok: {
      label: 'Detener',
      color: 'negative',
      unelevated: true,
    },
  })
    .onOk(async () => {
      try {
        await resourcesService.stop(id);
        $q.notify({
          type: 'positive',
          message: 'Recurso detenido correctamente',
          position: 'top',
          icon: 'stop',
        });
        await loadResources();
        if (showDetailDialog.value) {
          showDetailDialog.value = false;
        }
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: error.message || 'Error al detener el recurso',
          position: 'top',
        });
      } finally {
        actionLoading.value[id] = false;
      }
    })
    .onCancel(() => {
      actionLoading.value[id] = false;
    });
};

const confirmDelete = (resource: ResourceStateResource) => {
  $q.dialog({
    title: 'Confirmar Eliminación',
    message: `¿Está seguro de eliminar el recurso "${resource.name}"?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Eliminar',
      color: 'negative',
      unelevated: true,
    },
  }).onOk(async () => {
    try {
      await resourcesService.delete(resource.id);
      $q.notify({
        type: 'positive',
        message: 'Recurso eliminado correctamente',
        position: 'top',
        icon: 'delete',
      });
      await loadResources();
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: error.message || 'Error al eliminar el recurso',
        position: 'top',
      });
    }
  });
};

onMounted(() => {
  loadResources();
});
</script>

<style scoped>
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  background-color: #1e1e1e;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  gap: 8px;
  transition: border-color 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: #1976d2;
}

.search-input-icon {
  color: #b0b0b0;
  flex-shrink: 0;
}

.search-input-native {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 14px;
  padding: 8px 0;
}

.search-input-native::placeholder {
  color: #b0b0b0;
  opacity: 0.7;
}

.search-input-clear {
  flex-shrink: 0;
  color: #b0b0b0;
}

.search-input-clear:hover {
  color: #ffffff;
}

.resource-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.sticky-header-table {
  max-height: calc(100vh - 200px);
}
</style>
