<template>
  <div class="layout" :class="{ 'sidebar-open': leftDrawerOpen, 'sidebar-mini': miniState }">
    <header class="header">
      <button class="header-btn" @click="toggleDrawer" aria-label="Menu">
        <span class="material-symbols-outlined">menu</span>
      </button>
      <h1 class="header-title">
        <span class="material-symbols-outlined">settings</span>
        Switching Service
      </h1>
      <button class="header-btn logout" @click="handleLogout">
        <span class="material-symbols-outlined">logout</span>
        Cerrar Sesión
      </button>
    </header>

    <aside class="sidebar" :class="{ open: leftDrawerOpen, mini: miniState }">
      <nav class="nav">
        <div v-if="!miniState" class="nav-label">Navegación</div>
        <router-link to="/" class="nav-item" exact-active-class="active">
          <span class="material-symbols-outlined">dashboard</span>
          <span v-if="!miniState" class="nav-text">Dashboard</span>
          <span v-if="miniState" class="tooltip">Dashboard</span>
        </router-link>
        <router-link to="/resources" class="nav-item" exact-active-class="active">
          <span class="material-symbols-outlined">storage</span>
          <span v-if="!miniState" class="nav-text">Recursos</span>
          <span v-if="miniState" class="tooltip">Recursos</span>
        </router-link>
        <router-link to="/schedules" class="nav-item" exact-active-class="active">
          <span class="material-symbols-outlined">schedule</span>
          <span v-if="!miniState" class="nav-text">Programaciones</span>
          <span v-if="miniState" class="tooltip">Programaciones</span>
        </router-link>
        <router-link to="/change-password" class="nav-item" exact-active-class="active">
          <span class="material-symbols-outlined">lock</span>
          <span v-if="!miniState" class="nav-text">Cambiar Contraseña</span>
          <span v-if="miniState" class="tooltip">Cambiar Contraseña</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="sidebar-toggle" @click="toggleMini" :title="miniState ? 'Expandir' : 'Colapsar'">
          <span class="material-symbols-outlined">{{ miniState ? 'chevron_right' : 'chevron_left' }}</span>
        </button>
      </div>
    </aside>

    <div class="overlay" :class="{ visible: leftDrawerOpen }" @click="leftDrawerOpen = false" />

    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { signOut } from 'aws-amplify/auth';

const router = useRouter();
const leftDrawerOpen = ref(true);
const miniState = ref(false);

onMounted(() => {
  const saved = localStorage.getItem('sidebarMiniState');
  if (saved !== null) miniState.value = saved === 'true';
});

const toggleDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleMini = () => {
  miniState.value = !miniState.value;
  localStorage.setItem('sidebarMiniState', String(miniState.value));
};

const handleLogout = async () => {
  try {
    await signOut();
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  } catch (e) {
    console.error('Error al cerrar sesión:', e);
  }
};
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.header-btn {
  background: transparent;
  color: white;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn:hover {
  background: rgba(255,255,255,0.2);
}

.header-title {
  flex: 1;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logout {
  margin-left: auto;
}

.sidebar {
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  transition: width 0.2s, transform 0.2s;
  z-index: 90;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar.mini {
  width: 72px;
}

.sidebar.mini .nav-text,
.sidebar.mini .nav-label {
  display: none;
}

.sidebar.mini .nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar.mini .tooltip {
  display: none;
}

.sidebar.mini .nav-item:hover .tooltip {
  display: block;
  position: absolute;
  left: 100%;
  margin-left: 8px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  white-space: nowrap;
  z-index: 1000;
}

.nav {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.nav-label {
  padding: 8px;
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: var(--text-secondary);
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
  text-decoration: none;
  position: relative;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary);
  color: white;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: center;
}

.sidebar-toggle {
  background: transparent;
  color: var(--text-secondary);
  padding: 8px;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 80;
}

@media (max-width: 1024px) {
  .overlay.visible {
    display: block;
  }
}

.main {
  flex: 1;
  margin-left: 0;
  margin-top: 56px;
  padding: 16px;
  min-height: calc(100vh - 56px);
  transition: margin-left 0.2s;
}

.layout.sidebar-open .main {
  margin-left: 280px;
}

.layout.sidebar-open.sidebar-mini .main {
  margin-left: 72px;
}

@media (max-width: 1024px) {
  .layout.sidebar-open .main,
  .layout.sidebar-open.sidebar-mini .main {
    margin-left: 0;
  }
  .sidebar.mini {
    width: 280px;
  }
  .sidebar.mini .nav-text,
  .sidebar.mini .nav-label {
    display: block;
  }
  .overlay.visible {
    display: block;
  }
}
</style>
