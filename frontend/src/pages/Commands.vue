<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Comandos SSM</h1>
        <p class="subtitle">Gestiona y ejecuta comandos en instancias EC2 vía SSM</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <span class="material-symbols-outlined">add</span>
        Nuevo Comando
      </button>
    </div>

    <div class="card">
      <div class="table-header">
        <h3>Comandos</h3>
        <button class="btn-icon" @click="loadCommands" :disabled="loading" title="Actualizar">
          <span class="material-symbols-outlined">refresh</span>
        </button>
      </div>
      <div class="table-wrap">
        <table v-if="commands.length" class="data-table">
          <thead>
            <tr><th>Nombre</th><th>Comando</th><th>Vinculados</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in commands" :key="c.id">
              <td>{{ c.name }}</td>
              <td class="mono cmd-preview">{{ truncate(c.command, 50) }}</td>
              <td>
                <span v-for="rid in c.linkedResourceIds.slice(0, 2)" :key="rid" class="chip info">
                  {{ resourceName(rid) || rid }}
                </span>
                <span v-if="c.linkedResourceIds.length > 2" class="chip">+{{ c.linkedResourceIds.length - 2 }}</span>
              </td>
              <td>
                <button class="btn-icon" @click="openExecute(c)" title="Ejecutar"><span class="material-symbols-outlined">play_arrow</span></button>
                <button class="btn-icon" @click="editCommand(c)" title="Editar"><span class="material-symbols-outlined">edit</span></button>
                <button class="btn-icon danger" @click="confirmDeleteCommand(c)" title="Eliminar"><span class="material-symbols-outlined">delete</span></button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">No hay comandos. Crea uno para empezar.</p>
      </div>
    </div>

    <div class="card">
      <div class="table-header">
        <h3>Historial de Ejecuciones</h3>
        <button class="btn-icon" @click="loadExecutions" :disabled="executionsLoading" title="Actualizar">
          <span class="material-symbols-outlined">refresh</span>
        </button>
      </div>
      <div class="table-wrap">
        <table v-if="executions.length" class="data-table">
          <thead>
            <tr><th>Comando</th><th>Instancias</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="e in executions" :key="e.id">
              <td>{{ e.commandName }}</td>
              <td>{{ e.invocations.length }}</td>
              <td><span class="chip" :class="executionStatusClass(e.status)">{{ executionStatusLabel(e.status) }}</span></td>
              <td class="mono">{{ formatDate(e.timestamp) }}</td>
              <td>
                <button class="btn-icon" @click="viewExecution(e)" title="Ver"><span class="material-symbols-outlined">visibility</span></button>
                <button v-if="e.status === 'running' || e.status === 'pending'" class="btn-icon" @click="syncExecution(e)" :disabled="syncLoading[e.id]" title="Actualizar">
                  <span class="material-symbols-outlined">sync</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">No hay ejecuciones registradas</p>
      </div>
    </div>

    <Modal v-model="showCommandModal" :title="editingCommand ? 'Editar Comando' : 'Nuevo Comando'" width="550px">
      <form @submit.prevent="saveCommand" class="form">
        <div class="field">
          <label>Nombre *</label>
          <input v-model="commandForm.name" required placeholder="Ej: Verificar disco" />
        </div>
        <div class="field">
          <label>Comando *</label>
          <textarea v-model="commandForm.command" required rows="4" placeholder="df -h" class="mono"></textarea>
        </div>
        <div class="field">
          <label>Descripción (opcional)</label>
          <input v-model="commandForm.description" placeholder="Descripción del comando" />
        </div>
        <div class="field">
          <label>Vinculados a recursos EC2 (opcional)</label>
          <select v-model="commandForm.linkedResourceIds" multiple size="4">
            <option v-for="r in ec2Resources" :key="r.id" :value="r.id">{{ r.name }} ({{ r.resourceIdentifier }})</option>
          </select>
          <span class="hint">Ctrl+clic para selección múltiple. Estos comandos aparecerán en la vista del recurso.</span>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="showCommandModal = false">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </Modal>

    <Modal v-model="showExecuteModal" title="Ejecutar Comando" width="500px">
      <div v-if="commandToExecute">
        <p><strong>{{ commandToExecute.name }}</strong></p>
        <p class="mono cmd-preview">{{ commandToExecute.command }}</p>
        <div class="field">
          <label>Selecciona instancias EC2 *</label>
          <select v-model="selectedExecuteResourceIds" multiple size="6">
            <option v-for="r in ec2Resources" :key="r.id" :value="r.id">{{ r.name }} ({{ r.resourceIdentifier }})</option>
          </select>
          <span class="hint">Ctrl+clic para selección múltiple</span>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="showExecuteModal = false">Cancelar</button>
          <button type="button" class="btn btn-primary" :disabled="executing || !selectedExecuteResourceIds.length" @click="doExecute">
            {{ executing ? 'Ejecutando...' : 'Ejecutar' }}
          </button>
        </div>
      </div>
    </Modal>

    <Modal v-model="showExecutionDetailModal" title="Detalle de Ejecución" width="700px">
      <div v-if="selectedExecution">
        <dl class="detail-list">
          <div><dt>Comando</dt><dd>{{ selectedExecution.commandName }}</dd></div>
          <div><dt>Estado</dt><dd><span class="chip" :class="executionStatusClass(selectedExecution.status)">{{ executionStatusLabel(selectedExecution.status) }}</span></dd></div>
          <div><dt>Fecha</dt><dd class="mono">{{ formatDate(selectedExecution.timestamp) }}</dd></div>
        </dl>
        <h4 style="margin: 16px 0 8px">Resultados por instancia</h4>
        <div class="invocations-list">
          <div v-for="inv in selectedExecution.invocations" :key="inv.instanceId" class="invocation-card">
            <div class="invocation-header">
              <strong>{{ inv.resourceName }}</strong>
              <span class="chip" :class="invocationStatusClass(inv.status)">{{ inv.status }}</span>
            </div>
            <pre v-if="inv.output" class="invocation-output">{{ inv.output }}</pre>
            <pre v-if="inv.error" class="invocation-error">{{ inv.error }}</pre>
          </div>
        </div>
        <div class="modal-actions">
          <button v-if="selectedExecution.status === 'running' || selectedExecution.status === 'pending'" class="btn btn-secondary" @click="syncAndView(selectedExecution)">
            Actualizar desde SSM
          </button>
          <button class="btn btn-primary" @click="showExecutionDetailModal = false">Cerrar</button>
        </div>
      </div>
    </Modal>

    <ConfirmDialog v-model="confirmVisible" :title="confirmTitle" :message="confirmMessage" ok-label="Eliminar" ok-class="btn-danger" @confirm="doDeleteCommand" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { commandsService } from '../services/commands';
import { resourcesService } from '../services/resources';
import { useToast } from '../composables/useToast';
import Modal from '../components/Modal.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { Command, CommandExecution, ResourceStateResource } from '../types';

const toast = useToast();
const loading = ref(false);
const saving = ref(false);
const executing = ref(false);
const executionsLoading = ref(false);
const syncLoading = ref<Record<string, boolean>>({});

const commands = ref<Command[]>([]);
const executions = ref<CommandExecution[]>([]);
const resources = ref<ResourceStateResource[]>([]);
const showCommandModal = ref(false);
const showExecuteModal = ref(false);
const showExecutionDetailModal = ref(false);
const editingCommand = ref<Command | null>(null);
const commandToExecute = ref<Command | null>(null);
const selectedExecution = ref<CommandExecution | null>(null);
const selectedExecuteResourceIds = ref<string[]>([]);
const confirmVisible = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
let deleteTarget: Command | null = null;

const commandForm = ref({
  name: '',
  command: '',
  description: '',
  linkedResourceIds: [] as string[],
});

const ec2Resources = computed(() =>
  resources.value.filter((r) => r.type === 'EC2' && r.state === 1)
);

const resourceName = (id: string) => resources.value.find((r) => r.id === id)?.name;

const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n) + '...');

const formatDate = (ts: number) => new Date(ts).toLocaleString();

const executionStatusClass = (s: string) => {
  if (s === 'success') return 'success';
  if (s === 'failed' || s === 'partial') return 'error';
  return 'secondary';
};

const executionStatusLabel = (s: string) => {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    running: 'Ejecutando',
    success: 'Éxito',
    failed: 'Fallido',
    partial: 'Parcial',
  };
  return map[s] || s;
};

const invocationStatusClass = (s: string) => {
  if (s === 'Success') return 'success';
  if (s === 'Failed' || s === 'Cancelled' || s === 'TimedOut') return 'error';
  return 'secondary';
};

const loadCommands = async () => {
  loading.value = true;
  try {
    commands.value = await commandsService.getAll();
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Error al cargar comandos');
  } finally {
    loading.value = false;
  }
};

const loadExecutions = async () => {
  executionsLoading.value = true;
  try {
    executions.value = await commandsService.getExecutions();
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Error al cargar historial');
  } finally {
    executionsLoading.value = false;
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
  editingCommand.value = null;
  commandForm.value = { name: '', command: '', description: '', linkedResourceIds: [] };
  showCommandModal.value = true;
};

const editCommand = (c: Command) => {
  editingCommand.value = c;
  commandForm.value = {
    name: c.name,
    command: c.command,
    description: c.description ?? '',
    linkedResourceIds: [...(c.linkedResourceIds || [])],
  };
  showCommandModal.value = true;
};

const saveCommand = async () => {
  saving.value = true;
  try {
    const data = {
      name: commandForm.value.name.trim(),
      command: commandForm.value.command.trim(),
      description: commandForm.value.description.trim() || undefined,
      linkedResourceIds: commandForm.value.linkedResourceIds,
    };
    if (editingCommand.value) {
      await commandsService.update(editingCommand.value.id, data);
      toast.success('Comando actualizado');
    } else {
      await commandsService.create(data);
      toast.success('Comando creado');
    }
    showCommandModal.value = false;
    loadCommands();
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Error al guardar');
  } finally {
    saving.value = false;
  }
};

const openExecute = (c: Command) => {
  commandToExecute.value = c;
  // Solo preseleccionar instancias que están en ejecución (state === 1)
  const runningIds = (c.linkedResourceIds || []).filter(
    (id) => ec2Resources.value.some((r) => r.id === id)
  );
  selectedExecuteResourceIds.value = [...runningIds];
  showExecuteModal.value = true;
};

const doExecute = async () => {
  if (!commandToExecute.value || !selectedExecuteResourceIds.value.length) return;
  executing.value = true;
  try {
    const exec = await commandsService.execute(commandToExecute.value.id, selectedExecuteResourceIds.value);
    toast.success('Comando enviado');
    showExecuteModal.value = false;
    loadExecutions();
    selectedExecution.value = exec;
    showExecutionDetailModal.value = true;
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Error al ejecutar');
  } finally {
    executing.value = false;
  }
};

const viewExecution = (e: CommandExecution) => {
  selectedExecution.value = e;
  showExecutionDetailModal.value = true;
};

const syncExecution = async (e: CommandExecution) => {
  syncLoading.value[e.id] = true;
  try {
    const updated = await commandsService.syncExecution(e.id);
    const idx = executions.value.findIndex((x) => x.id === e.id);
    if (idx >= 0) executions.value[idx] = updated;
    selectedExecution.value = updated;
    toast.success('Resultados actualizados');
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Error al actualizar');
  } finally {
    syncLoading.value[e.id] = false;
  }
};

const syncAndView = async (e: CommandExecution) => {
  await syncExecution(e);
  selectedExecution.value = executions.value.find((x) => x.id === e.id) || selectedExecution.value;
};

const confirmDeleteCommand = (c: Command) => {
  deleteTarget = c;
  confirmTitle.value = 'Eliminar comando';
  confirmMessage.value = `¿Eliminar "${c.name}"?`;
  confirmVisible.value = true;
};

const doDeleteCommand = async () => {
  if (!deleteTarget) return;
  try {
    await commandsService.delete(deleteTarget.id);
    toast.success('Comando eliminado');
    loadCommands();
    confirmVisible.value = false;
    deleteTarget = null;
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Error al eliminar');
  }
};

onMounted(() => {
  loadCommands();
  loadExecutions();
  loadResources();
});
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
.page-header h1 { margin: 0; font-size: 1.5rem; }
.subtitle { margin: 4px 0 0; color: var(--text-tertiary); font-size: 0.875rem; }

.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid var(--border); }
.data-table th { font-size: 0.75rem; color: var(--text-tertiary); }
.mono { font-family: monospace; font-size: 0.8rem; }
.cmd-preview { max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.chip { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
.chip.info { background: var(--info); color: white; }
.chip.success { background: var(--success); color: white; }
.chip.error { background: var(--error); color: white; }
.chip.secondary { background: #757575; color: white; }
.btn-icon { background: none; color: var(--text-secondary); padding: 4px; }
.btn-icon:hover { color: var(--primary); }
.btn-icon.danger:hover { color: var(--error); }
.empty { text-align: center; color: var(--text-tertiary); padding: 24px; margin: 0; }

.card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.form .field { margin-bottom: 16px; }
.form .field label { display: block; margin-bottom: 6px; color: var(--text-tertiary); font-size: 0.875rem; }
.form .field input, .form .field select, .form .field textarea { width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); }
.form .field .hint { display: block; margin-top: 4px; font-size: 0.75rem; color: var(--text-tertiary); }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }

.detail-list { display: grid; gap: 8px; }
.detail-list dt { color: var(--text-tertiary); font-size: 0.875rem; }
.detail-list dd { margin: 0; }
.invocations-list { max-height: 300px; overflow-y: auto; margin: 12px 0; }
.invocation-card { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; padding: 12px; margin-bottom: 8px; }
.invocation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.invocation-output, .invocation-error { margin: 0; font-size: 0.8rem; white-space: pre-wrap; word-break: break-all; }
.invocation-error { color: var(--error); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
</style>
