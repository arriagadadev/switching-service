import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { configureAmplify } from './amplify';
import './styles/main.css';

configureAmplify();

const app = createApp(App);
app.use(router);
app.mount('#app');
