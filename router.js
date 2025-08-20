import { createRouter, createWebHistory } from 'vue-router';

import Welcome from './vue/views/Welcome.vue';

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: Welcome,
  },
  {
    path: '/table-example',
    name: 'TableExample',
    component: () => import('./vue/examples/TableExample.vue'),
  },
  {
    path: '/view-item/:id',
    name: 'ViewItem',
    component: () => import('./vue/examples/ViewItem.vue'),
    props: true,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router
