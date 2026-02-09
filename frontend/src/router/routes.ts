import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../pages/Dashboard.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'resources',
        name: 'resources',
        component: () => import('../pages/Resources.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'commands',
        name: 'commands',
        component: () => import('../pages/Commands.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'schedules',
        name: 'schedules',
        component: () => import('../pages/Schedules.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'schedules/:id',
        name: 'schedule-detail',
        component: () => import('../pages/ScheduleDetail.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'change-password',
        name: 'change-password',
        component: () => import('../pages/ChangePassword.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/Login.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../pages/Error404.vue'),
  },
];

export default routes;
