// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAuthLoading } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public pages
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: false },
      beforeEnter: (to, from) => {
        if (isAuthenticated.value) {
          return '/dashboard' // return the redirect path
        }
        return true
      },
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: () => import('../views/Pricing.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/faq',
      name: 'faq',
      component: () => import('../views/FAQ.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/Contact.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('../views/Terms.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../views/Privacy.vue'),
      meta: { requiresAuth: false },
    },
    // Auth pages
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/Signup.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/verify-email',
      name: 'verifyEmail',
      component: () => import('../views/VerifyEmail.vue'),
      meta: { requiresAuth: false },
    },
    // Protected pages
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/create-qr',
      name: 'createQr',
      component: () => import('../views/CreateQR.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/edit-qr/:id',
      name: 'editQr',
      component: () => import('../views/EditQR.vue'),
      meta: { requiresAuth: true },
    },
    // Catch-all redirect
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from) => {
  const requiresAuth = to.meta.requiresAuth !== false

  if (isAuthLoading.value) {
    await new Promise((resolve) => {
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
