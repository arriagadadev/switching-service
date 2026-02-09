<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Recursos</h1>
        <p class="subtitle">Gestiona tus recursos AWS (RDS, EC2)</p>
      </div>
      <button class="btn btn-primary" @click="showModal = true">
        <span class="material-symbols-outlined">add</span>
        Nuevo Recurso
      </button>
    </div>

    <div class="filters card">
      <div class="filter-row">
        <div class="search-wrap">
          <span class="material-symbols-outlined">search</span>
          <input v-model="filter" placeholder="Buscar por nombre o identificador..." />
        </div>
        <select v-model="filterType" class="select">
          <option :value="null">Tipo: Todos</option>
          <option value="RDS">RDS</option>
          <option value="EC2">EC2</option>
        </select>
        <select v-model="filterState" class="select">
          <option :value="null">Estado: Todos</option>
          <option :value="1">Activo</option>
          <option :value="0">Inactivo</option>
        </select>
        <button class="btn btn-secondary" @click="clearFilters" :disabled="!hasActiveFilters">Limpiar</button>
        <div class="view-toggle">
          <button :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">Tabla</button>
          <button :class="{ active: viewMode === 'cards' }" @click="viewMode = 'cards'">Tarjetas</button>
        </div>
      </div>
    </div>

    <div v-if="viewMode === 'table'" class="card">
      <div class="table-header">
        <h3>Lista de Recursos</h3>
        <button class="btn-icon" @click="loadResources" :disabled="loading"><span class="material-symbols-outlined">refresh</span></button>
      </div>
      <div class="table-wrap">
        <table v-if="filteredResources.length" class="data-table">
          <thead>
            <tr><th>Nombre</th><th>Tipo</th><th>Identificador</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in paginatedResources" :key="r.id">
              <td>{{ r.name }}</td>
              <td><span class="chip info">{{ r.type }}</span></td>
              <td class="mono">{{ r.resourceIdentifier }}</td>
              <td><span class="chip" :class="r.state === 1 ? 'success' : 'error'">{{ r.state === 1 ? 'Activo' : 'Inactivo' }}</span></td>
              <td>
                <button class="btn-icon" @click="viewResource(r)" title="Ver"><span class="material-symbols-outlined">visibility</span></button>
                <button class="btn-icon" @click="editResource(r)" title="Editar"><span class="material-symbols-outlined">edit</span></button>
                <button class="btn-icon" @click="handleStartStop(r)" title="Iniciar/Detener" :disabled="actionLoading[r.id]"><span class="material-symbols-outlined">{{ r.state === 0 ? 'play_arrow' : 'stop' }}</span></button>
                <button class="btn-icon danger" @click="confirmDelete(r)" title="Eliminar"><span class="material-symbols-outlined">delete</span></button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">No hay recursos disponibles</p>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button @click="page = Math.max(1, page - 1)" :disabled="page <= 1">Anterior</button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button @click="page = Math.min(totalPages, page + 1)" :disabled="page >= totalPages">Siguiente</button>
      </div>
    </div>

    <div v-else class="cards-grid">
      <div v-for="r in paginatedResources" :key="r.id" class="resource-card card">
        <div class="card-top">
          <h4>{{ r.name }}</h4>
          <span class="chip" :class="r.state === 1 ? 'success' : 'error'">{{ r.state === 1 ? 'Activo' : 'Inactivo' }}</span>
        </div>
        <p class="mono">{{ r.resourceIdentifier }}</p>
        <span class="chip info">{{ r.type }}</span>
        <div class="card-actions">
          <button class="btn-icon" @click="viewResource(r)"><span class="material-symbols-outlined">visibility</span> Ver</button>
          <button class="btn-icon" @click="editResource(r)"><span class="material-symbols-outlined">edit</span></button>
          <button class="btn-icon" @click="handleStartStop(r)" :disabled="actionLoading[r.id]"><span class="material-symbols-outlined">{{ r.state === 0 ? 'play_arrow' : 'stop' }}</span></button>
          <button class="btn-icon danger" @click="confirmDelete(r)"><span class="material-symbols-outlined">delete</span></button>
        </div>
      </div>
    </div>

    <Modal v-model="showModal" :title="editingResource ? 'Editar Recurso' : 'Nuevo Recurso'" width="500px">
      <form @submit.prevent="saveResource" class="form">
        <div class="field">
          <label>Nombre *</label>
          <input v-model="resourceForm.name" required />
        </div>
        <div class="field">
          <label>Tipo *</label>
          <select v-model="resourceForm.type" @change="onTypeChange" required>
            <option value="RDS">RDS</option>
            <option value="EC2">EC2</option>
          </select>
        </div>
        <div class="field" v-if="resourceForm.type === 'EC2'">
          <label>Instancia EC2 *</label>
          <select v-model="resourceForm.resourceIdentifier" required>
            <option value="">Selecciona...</option>
            <option v-for="opt in ec2Options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="field" v-else-if="resourceForm.type === 'RDS'">
          <label>Instancia RDS *</label>
          <select v-model="resourceForm.resourceIdentifier" required>
            <option value="">Selecciona...</option>
            <option v-for="opt in rdsOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="field" v-else>
          <label>Identificador (ARN) *</label>
          <input v-model="resourceForm.resourceIdentifier" required />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="showModal = false">Cancelar</button>
          <button type="button" class="btn btn-primary" :disabled="saving" @click="saveResource">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </Modal>

    <Modal v-model="showDetailModal" title="Detalles del Recurso" width="500px">
      <div v-if="selectedResource">
        <dl class="detail-list">
          <div><dt>Nombre</dt><dd>{{ selectedResource.name }}</dd></div>
          <div><dt>Tipo</dt><dd><span class="chip info">{{ selectedResource.type }}</span></dd></div>
          <div><dt>Estado</dt><dd><span class="chip" :class="selectedResource.state === 1 ? 'success' : 'error'">{{ selectedResource.state === 1 ? 'Activo' : 'Inactivo' }}</span></dd></div>
          <div><dt>Identificador</dt><dd class="mono">{{ selectedResource.resourceIdentifier }}</dd></div>
        </dl>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="editResource(selectedResource); showDetailModal = false">Editar</button>
          <button class="btn" :class="selectedResource.state === 0 ? 'btn-success' : 'btn-danger'" @click="handleStartStop(selectedResource); showDetailModal = false">
            {{ selectedResource.state === 0 ? 'Iniciar' : 'Detener' }}
          </button>
        </div>
      </div>
    </Modal>

    <ConfirmDialog v-model="confirmVisible" :title="confirmTitle" :message="confirmMessage" :ok-label="confirmOk" :ok-class="confirmOkClass" @confirm="onConfirm" @cancel="onConfirmCancel" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { resourcesService } from '../services/resources';
import { awsResourcesService } from '../services/awsResources';
import { useToast } from '../composables/useToast';
import Modal from '../components/Modal.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { ResourceStateResource, StoreResourceStateBody, ResourceType } from '../types';

const toast = useToast();
const loading = ref(false);
const saving = ref(false);
const resources = ref<ResourceStateResource[]>([]);
const filter = ref('');
const filterType = ref<ResourceType | null>(null);
const filterState = ref<number | null>(null);
const viewMode = ref<'table' | 'cards'>('table');
const page = ref(1);
const rowsPerPage = 10;
const showModal = ref(false);
const showDetailModal = ref(false);
const editingResource = ref<ResourceStateResource | null>(null);
const selectedResource = ref<ResourceStateResource | null>(null);
const actionLoading = ref<Record<string, boolean>>({});
const ec2Options = ref<{ label: string; value: string }[]>([]);
const rdsOptions = ref<{ label: string; value: string }[]>([]);

const resourceForm = ref<StoreResourceStateBody>({
  name: '',
  resourceIdentifier: '',
  type: 'RDS',
});

const confirmVisible = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
const confirmOk = ref('OK');
const confirmOkClass = ref('');
let confirmResolve: (() => void) | null = null;
let confirmResourceId: string | null = null;

const hasActiveFilters = computed(() => !!filter.value || filterType.value !== null || filterState.value !== null);

const filteredResources = computed(() => {
  let r = [...resources.value];
  if (filter.value) {
    const s = filter.value.toLowerCase();
    r = r.filter((x) => x.name.toLowerCase().includes(s) || x.resourceIdentifier.toLowerCase().includes(s));
  }
  if (filterType.value !== null) r = r.filter((x) => x.type === filterType.value);
  if (filterState.value !== null) r = r.filter((x) => x.state === filterState.value);
  return r.sort((a, b) => (a.name < b.name ? -1 : 1));
});

const totalPages = computed(() => Math.ceil(filteredResources.value.length / rowsPerPage) || 1);

const paginatedResources = computed(() => {
  const start = (page.value - 1) * rowsPerPage;
  return filteredResources.value.slice(start, start + rowsPerPage);
});

watch(viewMode, (m) => localStorage.setItem('resourcesViewMode', m));

const clearFilters = () => {
  filter.value = '';
  filterType.value = null;
  filterState.value = null;
};

const loadResources = async () => {
  loading.value = true;
  try {
    resources.value = await resourcesService.getAll();
  } catch (e: any) {
    toast.error(e.message || 'Error al cargar');
  } finally {
    loading.value = false;
  }
};

const onTypeChange = async () => {
  resourceForm.value.resourceIdentifier = '';
  if (resourceForm.value.type === 'EC2') {
    try {
      const list = await awsResourcesService.getEC2Instances();
      ec2Options.value = list.map((i) => ({ label: i.name || i.instanceId, value: i.instanceId }));
    } catch (e) {
      toast.error('Error al cargar instancias EC2');
    }
  } else if (resourceForm.value.type === 'RDS') {
    try {
      const list = await awsResourcesService.getRDSInstances();
      rdsOptions.value = list.map((i) => ({ label: i.name || i.dbInstanceIdentifier, value: i.dbInstanceIdentifier }));
    } catch (e) {
      toast.error('Error al cargar instancias RDS');
    }
  }
};

const saveResource = async () => {
  saving.value = true;
  try {
    const data = {
      ...resourceForm.value,
      resourceIdentifier: String(resourceForm.value.resourceIdentifier || ''),
    };
    if (editingResource.value) {
      await resourcesService.update(editingResource.value.id, data);
      toast.success('Recurso actualizado');
    } else {
      await resourcesService.create(data);
      toast.success('Recurso creado');
    }
    showModal.value = false;
    resetForm();
    loadResources();
  } catch (e: any) {
    toast.error(e.message || 'Error al guardar');
  } finally {
    saving.value = false;
  }
};

const viewResource = (r: ResourceStateResource) => {
  selectedResource.value = r;
  showDetailModal.value = true;
};

const editResource = (r: ResourceStateResource) => {
  editingResource.value = r;
  resourceForm.value = { name: r.name, resourceIdentifier: r.resourceIdentifier, type: r.type };
  onTypeChange();
  showModal.value = true;
};

const resetForm = () => {
  editingResource.value = null;
  resourceForm.value = { name: '', resourceIdentifier: '', type: 'RDS' };
};

const handleStartStop = (r: ResourceStateResource) => {
  actionLoading.value[r.id] = true;
  confirmResourceId = r.id;
  if (r.state === 0) {
    confirmTitle.value = 'Confirmar Inicio';
    confirmMessage.value = '¿Está seguro de iniciar este recurso?';
    confirmOk.value = 'Iniciar';
    confirmOkClass.value = 'btn-success';
  } else {
    confirmTitle.value = 'Confirmar Detención';
    confirmMessage.value = '¿Está seguro de detener este recurso?';
    confirmOk.value = 'Detener';
    confirmOkClass.value = 'btn-danger';
  }
  confirmVisible.value = true;
  confirmResolve = async () => {
    try {
      if (r.state === 0) await resourcesService.start(r.id);
      else await resourcesService.stop(r.id);
      toast.success(r.state === 0 ? 'Recurso iniciado' : 'Recurso detenido');
      loadResources();
      showDetailModal.value = false;
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      actionLoading.value[r.id] = false;
    }
  };
};

const confirmDelete = (r: ResourceStateResource) => {
  confirmTitle.value = 'Confirmar Eliminación';
  confirmMessage.value = `¿Está seguro de eliminar "${r.name}"?`;
  confirmOk.value = 'Eliminar';
  confirmOkClass.value = 'btn-danger';
  confirmVisible.value = true;
  confirmResolve = async () => {
    try {
      await resourcesService.delete(r.id);
      toast.success('Recurso eliminado');
      loadResources();
      showDetailModal.value = false;
    } catch (e: any) {
      toast.error(e.message || 'Error');
    }
  };
};

const onConfirm = () => {
  if (confirmResolve) confirmResolve();
  confirmVisible.value = false;
  confirmResolve = null;
  confirmResourceId = null;
};

const onConfirmCancel = () => {
  if (confirmResourceId) actionLoading.value[confirmResourceId] = false;
  confirmResourceId = null;
  confirmResolve = null;
};

onMounted(() => {
  const saved = localStorage.getItem('resourcesViewMode');
  if (saved === 'table' || saved === 'cards') viewMode.value = saved;
  loadResources();
});
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
.page-header h1 { margin: 0; font-size: 1.5rem; }
.subtitle { margin: 4px 0 0; color: var(--text-tertiary); font-size: 0.875rem; }

.filter-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.search-wrap { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; flex: 1; min-width: 200px; }
.search-wrap input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 0.875rem; }
.search-wrap input:focus { outline: none; }
.select { padding: 8px 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); min-width: 120px; }
.view-toggle { display: flex; }
.view-toggle button { padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); }
.view-toggle button:first-child { border-radius: 6px 0 0 6px; }
.view-toggle button:last-child { border-radius: 0 6px 6px 0; }
.view-toggle button.active { background: var(--primary); color: white; border-color: var(--primary); }

.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid var(--border); }
.data-table th { font-size: 0.75rem; color: var(--text-tertiary); font-weight: 600; }
.mono { font-family: monospace; font-size: 0.8rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.chip { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
.chip.info { background: var(--info); color: white; }
.chip.success { background: var(--success); color: white; }
.chip.error { background: var(--error); color: white; }
.btn-icon { background: none; color: var(--text-secondary); padding: 4px; }
.btn-icon:hover { color: var(--primary); }
.btn-icon.danger:hover { color: var(--error); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 16px; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.resource-card .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.resource-card .card-actions { display: flex; gap: 4px; margin-top: 12px; flex-wrap: wrap; }
.detail-list { display: grid; gap: 8px; }
.detail-list dt { color: var(--text-tertiary); font-size: 0.875rem; }
.detail-list dd { margin: 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
.btn-success { background: var(--success); color: white; }
.btn-danger { background: var(--error); color: white; }
.form .field { margin-bottom: 16px; }
.form .field label { display: block; margin-bottom: 6px; color: var(--text-tertiary); font-size: 0.875rem; }
.form .field input, .form .field select { width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
.empty { text-align: center; color: var(--text-tertiary); padding: 24px; }
</style>
