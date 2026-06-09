import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAuthLoading, loadUser } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/Signup.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/create-qr',
      name: 'createQr',
      component: () => import('../views/CreateQR.vue'),
      meta: { requiresAuth: true }
    },
  ]
})

// Navigation guard - updated to use async/await and return values instead of next()
router.beforeEach(async (to, from) => {
  const requiresAuth = to.meta.requiresAuth !== false
  
  // Wait for auth to be initialized
  if (isAuthLoading.value) {
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!isAuthLoading.value) {
          clearInterval(checkInterval)
          resolve(null)
        }
      }, 100)
    })
  }
  
  if (requiresAuth && !isAuthenticated.value) {
    return '/login'
  }
  
  if ((to.path === '/login' || to.path === '/signup') && isAuthenticated.value) {
    return '/dashboard'
  }
  
  return true
})

export default router