// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue' // Check path!
import CreateQR from '../components/CreateQR.vue' // Check path!

const routes = [
  {
    path: '/',
    redirect: '/dashboard', // Optional: redirect root to dashboard
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/create-qr',
    name: 'CreateQR',
    component: CreateQR,
  },
  // {
  //   path: '/edit-qr/:id',
  //   name: 'EditQR',
  //   component: EditQR,
  // },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
