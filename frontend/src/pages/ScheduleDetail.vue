<template>
  <q-page class="q-pa-md">
    <q-btn
      flat
      icon="arrow_back"
      label="Volver"
      @click="$router.push('/schedules')"
      class="q-mb-md"
    />
    <div v-if="loading" class="text-center">
      <q-spinner color="primary" size="3em" />
    </div>
    <div v-else-if="schedule">
      <div class="text-h4 q-mb-md">{{ schedule.name }}</div>
      <q-card>
        <q-card-section>
          <div class="row q-gutter-md">
            <div class="col-12 col-md-6">
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>ID</q-item-label>
                    <q-item-label>{{ schedule.id }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Expresión Cron</q-item-label>
                    <q-item-label>{{ schedule.cron }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Estado Deseado</q-item-label>
                    <q-item-label>
                      <q-badge :color="schedule.desiredState === 1 ? 'positive' : 'negative'">
                        {{ schedule.desiredState === 1 ? 'Activo' : 'Inactivo' }}
                      </q-badge>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Habilitado</q-item-label>
                    <q-item-label>
                      <q-badge :color="schedule.isEnabled ? 'positive' : 'negative'">
                        {{ schedule.isEnabled ? 'Sí' : 'No' }}
                      </q-badge>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Activo</q-item-label>
                    <q-item-label>
                      <q-badge :color="schedule.isActive ? 'positive' : 'negative'">
                        {{ schedule.isActive ? 'Sí' : 'No' }}
                      </q-badge>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-h6 q-mb-sm">Recursos Asociados</div>
              <q-list v-if="schedule.resources.length > 0">
                <q-item v-for="resource in schedule.resources" :key="resource.id">
                  <q-item-section>
                    <q-item-label>{{ resource.resourceIdentifier }}</q-item-label>
                    <q-item-label caption>{{ resource.type }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-grey">No hay recursos asociados</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { schedulesService } from '../services/schedules';
import type { ScheduleResource } from '../types';

const route = useRoute();
const loading = ref(false);
const schedule = ref<ScheduleResource | null>(null);

const loadSchedule = async () => {
  loading.value = true;
  try {
    schedule.value = await schedulesService.getById(route.params.id as string);
  } catch (error) {
    console.error('Error al cargar la programación:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSchedule();
});
</script>
