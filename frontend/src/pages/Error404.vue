<template>
  <div class="error-page">
    <div class="error-content">
      <span class="error-code">404</span>
      <h2>Oops. Nada aquí...</h2>
      <router-link to="/" class="btn btn-primary">Ir al Inicio</router-link>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: white;
  padding: 16px;
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: 20vh;
  font-weight: 700;
  line-height: 1;
}

h2 {
  opacity: 0.8;
  margin: 16px 0 32px;
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  background: white;
  color: var(--primary);
  border-radius: 6px;
  font-weight: 500;
  text-decoration: none;
}

.btn:hover {
  background: #f0f0f0;
}
</style>
