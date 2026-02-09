<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Programaciones</h1>
        <p class="subtitle">Gestiona las programaciones automáticas de tus recursos</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <span class="material-symbols-outlined">add</span>
        Nueva Programación
      </button>
    </div>

    <div class="filters card">
      <div class="filter-row">
        <div class="search-wrap">
          <span class="material-symbols-outlined">search</span>
          <input v-model="filter" placeholder="Buscar por nombre o cron..." />
        </div>
        <select v-model="filterEnabled" class="select">
          <option :value="null">Estado: Todos</option>
          <option :value="true">Habilitadas</option>
          <option :value="false">Deshabilitadas</option>
        </select>
        <button class="btn btn-secondary" @click="clearFilters" :disabled="!hasActiveFilters">Limpiar</button>
      </div>
    </div>

    <div class="card">
      <div class="table-header">
        <h3>Lista de Programaciones</h3>
        <button class="btn-icon" @click="loadSchedules" :disabled="loading"><span class="material-symbols-outlined">refresh</span></button>
      </div>
      <div class="table-wrap">
        <table v-if="filteredSchedules.length" class="data-table">
          <thead>
            <tr><th>Nombre</th><th>Cron</th><th>Estado Deseado</th><th>Recursos</th><th>Habilitado</th><th>Activo</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="s in paginatedSchedules" :key="s.id">
              <td>{{ s.name }}</td>
              <td class="mono">{{ s.cron }}</td>
              <td><span class="chip" :class="s.desiredState === 1 ? 'success' : 'error'">{{ s.desiredState === 1 ? 'Activar' : 'Desactivar' }}</span></td>
              <td>
                <span v-for="r in s.resources.slice(0, 2)" :key="r.id" class="chip info">{{ r.resourceIdentifier.split('/').pop() || r.resourceIdentifier }}</span>
                <span v-if="s.resources.length > 2" class="chip">+{{ s.resources.length - 2 }}</span>
              </td>
              <td>
                <label class="toggle">
                  <input type="checkbox" :checked="s.isEnabled" @change="(e) => toggleSchedule(s, (e.target as HTMLInputElement).checked)" />
                  <span class="slider"></span>
                </label>
              </td>
              <td><span class="chip" :class="s.isActive ? 'success' : 'error'">{{ s.isActive ? 'Sí' : 'No' }}</span></td>
              <td>
                <router-link :to="`/schedules/${s.id}`" class="btn-icon"><span class="material-symbols-outlined">visibility</span></router-link>
                <button class="btn-icon" @click="editSchedule(s)"><span class="material-symbols-outlined">edit</span></button>
                <button class="btn-icon danger" @click="confirmDelete(s)"><span class="material-symbols-outlined">delete</span></button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">No hay programaciones disponibles</p>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button @click="page = Math.max(1, page - 1)" :disabled="page <= 1">Anterior</button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button @click="page = Math.min(totalPages, page + 1)" :disabled="page >= totalPages">Siguiente</button>
      </div>
    </div>

    <Modal v-model="showModal" :title="editingSchedule ? 'Editar Programación' : 'Nueva Programación'" width="600px">
      <form @submit.prevent="saveSchedule" class="form">
        <div class="field">
          <label>Nombre *</label>
          <input v-model="scheduleForm.name" required />
        </div>
        <div class="field">
          <label>Expresión Cron * <button type="button" class="link" @click="showCronHelp = true">Ayuda</button></label>
          <input v-model="scheduleForm.cron" required placeholder="0 9 * * ? *" />
          <span class="hint">Formato: segundo minuto hora día mes día-semana año</span>
        </div>
        <div class="field">
          <label>Estado Deseado *</label>
          <select v-model="scheduleForm.desiredState" required>
            <option :value="1">Activar</option>
            <option :value="0">Desactivar</option>
          </select>
        </div>
        <div class="field">
          <label>Recursos *</label>
          <select v-model="selectedResourceIds" multiple size="5">
            <option v-for="r in availableResources" :key="r.id" :value="r.id">{{ r.name }} ({{ r.type }})</option>
          </select>
          <span class="hint">Ctrl+clic para selección múltiple</span>
        </div>
        <div class="field checkbox">
          <label><input type="checkbox" v-model="scheduleForm.isEnabled" /> Habilitar programación</label>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="showModal = false">Cancelar</button>
          <button type="button" class="btn btn-primary" :disabled="saving" @click="saveSchedule">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </Modal>

    <Modal v-model="showCronHelp" title="Ayuda Cron" width="500px">
      <p><strong>Formato:</strong> <code>segundo minuto hora día mes día-semana año</code></p>
      <p><strong>Ejemplos:</strong></p>
      <ul>
        <li><code>0 9 * * ? *</code> - Todos los días a las 9:00 AM</li>
        <li><code>0 0 1 * ? *</code> - Primer día de cada mes a medianoche</li>
        <li><code>0 0/30 * * ? *</code> - Cada 30 minutos</li>
        <li><code>0 0 9 ? * MON-FRI *</code> - Lunes a viernes a las 9:00 AM</li>
      </ul>
    </Modal>

    <ConfirmDialog v-model="confirmVisible" title="Confirmar Eliminación" :message="confirmMessage" ok-label="Eliminar" ok-class="btn-danger" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { schedulesService } from '../services/schedules';
import { resourcesService } from '../services/resources';
import { useToast } from '../composables/useToast';
import Modal from '../components/Modal.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { ScheduleResource, StoreScheduleBody, ResourceStateResource } from '../types';

const toast = useToast();
const loading = ref(false);
const saving = ref(false);
const schedules = ref<ScheduleResource[]>([]);
const resources = ref<ResourceStateResource[]>([]);
const filter = ref('');
const filterEnabled = ref<boolean | null>(null);
const page = ref(1);
const rowsPerPage = 10;
const showModal = ref(false);
const showCronHelp = ref(false);
const editingSchedule = ref<ScheduleResource | null>(null);
const confirmVisible = ref(false);
const confirmMessage = ref('');
let deleteTarget: ScheduleResource | null = null;

const scheduleForm = ref<StoreScheduleBody>({
  name: '',
  cron: '',
  isEnabled: true,
  desiredState: 0,
  resources: [],
});
const selectedResourceIds = ref<string[]>([]);

const hasActiveFilters = computed(() => !!filter.value || filterEnabled.value !== null);

const availableResources = computed(() =>
  resources.value.map((r) => ({ id: r.id, name: r.name, type: r.type }))
);

const filteredSchedules = computed(() => {
  let r = [...schedules.value];
  if (filter.value) {
    const s = filter.value.toLowerCase();
    r = r.filter((x) => x.name.toLowerCase().includes(s) || x.cron.toLowerCase().includes(s));
  }
  if (filterEnabled.value !== null) r = r.filter((x) => x.isEnabled === filterEnabled.value);
  return r.sort((a, b) => (a.name < b.name ? -1 : 1));
});

const totalPages = computed(() => Math.ceil(filteredSchedules.value.length / rowsPerPage) || 1);

const paginatedSchedules = computed(() => {
  const start = (page.value - 1) * rowsPerPage;
  return filteredSchedules.value.slice(start, start + rowsPerPage);
});

const clearFilters = () => {
  filter.value = '';
  filterEnabled.value = null;
};

const loadSchedules = async () => {
  loading.value = true;
  try {
    schedules.value = await schedulesService.getAll();
  } catch (e: any) {
    toast.error(e.message || 'Error al cargar');
  } finally {
    loading.value = false;
  }
};

const loadResources = async () => {
  try {
    resources.value = await resourcesService.getAll();
  } catch (e) {
    console.error(e);
  }
};

const openCreate = () => {
  editingSchedule.value = null;
  scheduleForm.value = { name: '', cron: '', isEnabled: true, desiredState: 0, resources: [] };
  selectedResourceIds.value = [];
  showModal.value = true;
};

const editSchedule = (s: ScheduleResource) => {
  editingSchedule.value = s;
  scheduleForm.value = {
    name: s.name,
    cron: s.cron,
    isEnabled: s.isEnabled,
    desiredState: s.desiredState,
    resources: s.resources,
  };
  selectedResourceIds.value = s.resources.map((r) => r.id);
  showModal.value = true;
};

const saveSchedule = async () => {
  if (selectedResourceIds.value.length === 0) {
    toast.error('Selecciona al menos un recurso');
    return;
  }
  saving.value = true;
  try {
    const resourcesBody = selectedResourceIds.value
      .map((id) => resources.value.find((x) => x.id === id))
      .filter(Boolean)
      .map((r) => ({ id: r!.id, type: r!.type, resourceIdentifier: r!.resourceIdentifier }));
    const body = {
      ...scheduleForm.value,
      resources: resourcesBody,
    };
    if (editingSchedule.value) {
      await schedulesService.update(editingSchedule.value.id, body);
      toast.success('Programación actualizada');
    } else {
      await schedulesService.create(body);
      toast.success('Programación creada');
    }
    showModal.value = false;
    loadSchedules();
  } catch (e: any) {
    toast.error(e.message || 'Error al guardar');
  } finally {
    saving.value = false;
  }
};

const toggleSchedule = async (s: ScheduleResource, enabled: boolean) => {
  try {
    await schedulesService.update(s.id, {
      name: s.name,
      cron: s.cron,
      isEnabled: enabled,
      desiredState: s.desiredState,
      resources: s.resources,
    });
    toast.success(enabled ? 'Programación habilitada' : 'Programación deshabilitada');
    loadSchedules();
  } catch (e: any) {
    toast.error(e.message || 'Error');
  }
};

const confirmDelete = (s: ScheduleResource) => {
  deleteTarget = s;
  confirmMessage.value = `¿Está seguro de eliminar "${s.name}"?`;
  confirmVisible.value = true;
};

const doDelete = async () => {
  if (!deleteTarget) return;
  try {
    await schedulesService.delete(deleteTarget.id);
    toast.success('Programación eliminada');
    loadSchedules();
  } catch (e: any) {
    toast.error(e.message || 'Error');
  }
  deleteTarget = null;
};

onMounted(() => {
  loadSchedules();
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
.select { padding: 8px 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); min-width: 120px; }

.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid var(--border); }
.data-table th { font-size: 0.75rem; color: var(--text-tertiary); font-weight: 600; }
.mono { font-family: monospace; font-size: 0.8rem; }
.chip { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 4px; }
.chip.info { background: var(--info); color: white; }
.chip.success { background: var(--success); color: white; }
.chip.error { background: var(--error); color: white; }
.btn-icon { background: none; color: var(--text-secondary); padding: 4px; }
.btn-icon:hover { color: var(--primary); }
.btn-icon.danger:hover { color: var(--error); }

.toggle { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background: var(--bg-tertiary); border-radius: 24px; transition: 0.3s; }
.slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
.toggle input:checked + .slider { background: var(--success); }
.toggle input:checked + .slider::before { transform: translateX(20px); }

.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 16px; }
.form .field { margin-bottom: 16px; }
.form .field label { display: block; margin-bottom: 6px; color: var(--text-tertiary); font-size: 0.875rem; }
.form .field input, .form .field select { width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); }
.form .field.checkbox label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); }
.hint { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px; display: block; }
.empty { text-align: center; color: var(--text-tertiary); padding: 24px; }
code { background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; font-size: 0.875rem; }
.link { background: none; color: var(--primary); padding: 0; font-size: 0.875rem; cursor: pointer; }
</style>
