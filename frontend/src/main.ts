import { createApp } from 'vue';
import { Quasar } from 'quasar';

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css';

// Import Quasar css
import 'quasar/src/css/index.sass';

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from './App.vue';
import router from './router';

const myApp = createApp(App);

myApp.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
});

myApp.use(router);

// Assumes you have a <div id="app"></div> in your HTML
myApp.mount('#app');
