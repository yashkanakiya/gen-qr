<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { logout, isAuthenticated, currentUser, profileImage } from '../stores/authStore'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import ProfileDialog from './ProfileDialog.vue'

const router = useRouter()
const toast = useToast()
const mobileMenuOpen = ref(false)
const profileDialogVisible = ref(false)

const menuRef = ref()
const menuItems = ref([
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => {
      profileDialogVisible.value = true
    },
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => {
      handleLogout()
    },
  },
])

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

function handleLogout() {
  logout()
  toast.add({
    severity: 'success',
    summary: 'Logged Out',
    detail: 'You have been logged out successfully',
    life: 3000,
  })
  router.push('/login')
}

// 🔧 Safe initials generator
const getInitials = (name: string): string => {
  if (!name) return '?'
  const trimmed = name.trim()
  if (trimmed.length === 0) return '?'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  const first = parts[0]?.[0] || ''
  const second = parts[1]?.[0] || ''
  const combined = (first + second).toUpperCase()
  return combined || parts[0].substring(0, 2).toUpperCase()
}

const avatarInitials = computed(() => {
  const user = currentUser.value
  const name = user?.username || user?.email || 'User'
  return getInitials(name)
})

const isLegalPage = computed(() => {
  return ['/terms', '/privacy'].includes(router.currentRoute.value.path)
})

const toggleMenu = (event: Event) => {
  menuRef.value?.toggle(event)
}
</script>

<template>
  <nav class="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200/50">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <router-link to="/" class="flex items-center space-x-3">
          <div
            class="w-10 h-10 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <i class="pi pi-qrcode text-white text-xl"></i>
          </div>
          <span
            class="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            Gen QR
          </span>
        </router-link>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-4">
          <!-- Public links -->
          <router-link
            to="/pricing"
            class="px-4 py-2 rounded-lg transition-all duration-200"
            :class="
              $route.path === '/pricing'
                ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            "
          >
            Pricing
          </router-link>
          <router-link
            to="/faq"
            class="px-4 py-2 rounded-lg transition-all duration-200"
            :class="
              $route.path === '/faq'
                ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            "
          >
            FAQ
          </router-link>
          <router-link
            to="/contact"
            class="px-4 py-2 rounded-lg transition-all duration-200"
            :class="
              $route.path === '/contact'
                ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            "
          >
            Contact
          </router-link>

          <!-- More dropdown -->
          <div class="relative group">
            <button
              class="px-3 py-2 rounded-lg transition-all duration-200 flex items-center"
              :class="
                isLegalPage
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              More <i class="pi pi-chevron-down ml-1 text-xs"></i>
            </button>
            <div
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
            >
              <router-link
                to="/terms"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                :class="$route.path === '/terms' ? 'bg-blue-50 text-blue-700' : ''"
              >
                Terms
              </router-link>
              <router-link
                to="/privacy"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                :class="$route.path === '/privacy' ? 'bg-blue-50 text-blue-700' : ''"
              >
                Privacy
              </router-link>
            </div>
          </div>

          <!-- Auth links -->
          <template v-if="isAuthenticated">
            <router-link
              to="/dashboard"
              class="px-4 py-2 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/dashboard'
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              <i class="pi pi-home mr-2"></i> Dashboard
            </router-link>
            <router-link
              to="/create-qr"
              class="px-4 py-2 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/create-qr'
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              <i class="pi pi-plus mr-2"></i> Create QR
            </router-link>

            <!-- 🔽 NEW: Avatar / Settings Dropdown -->
            <Button
              class="!p-0 !border-0 !bg-transparent !shadow-none hover:!bg-transparent"
              @click="toggleMenu"
              aria-haspopup="true"
              aria-controls="user-menu"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              >
                <img
                  v-if="profileImage"
                  :src="profileImage"
                  alt="Profile"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ avatarInitials }}</span>
              </div>
            </Button>

            <Menu ref="menuRef" id="user-menu" :model="menuItems" popup />
          </template>

          <template v-else>
            <router-link
              to="/login"
              class="px-4 py-2 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/login'
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              Login
            </router-link>
            <router-link
              to="/signup"
              class="px-4 py-2 rounded-lg transition-all duration-200 font-semibold"
              :class="
                $route.path === '/signup'
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg'
              "
            >
              Sign Up
            </router-link>
          </template>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
        >
          <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-xl"></i>
        </button>
      </div>

      <!-- Mobile Menu Dropdown -->
      <Transition name="slide-down">
        <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-gray-200">
          <div class="flex flex-col space-y-2">
            <router-link
              to="/pricing"
              @click="closeMobileMenu"
              class="px-4 py-3 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/pricing'
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              <i class="pi pi-tag mr-3"></i> Pricing
            </router-link>
            <router-link
              to="/faq"
              @click="closeMobileMenu"
              class="px-4 py-3 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/faq'
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              <i class="pi pi-question-circle mr-3"></i> FAQ
            </router-link>
            <router-link
              to="/contact"
              @click="closeMobileMenu"
              class="px-4 py-3 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/contact'
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              <i class="pi pi-envelope mr-3"></i> Contact
            </router-link>
            <router-link
              to="/terms"
              @click="closeMobileMenu"
              class="px-4 py-3 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/terms'
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              <i class="pi pi-file mr-3"></i> Terms
            </router-link>
            <router-link
              to="/privacy"
              @click="closeMobileMenu"
              class="px-4 py-3 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/privacy'
                  ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              <i class="pi pi-lock mr-3"></i> Privacy
            </router-link>
            <hr class="border-gray-200" />

            <!-- Auth links -->
            <template v-if="isAuthenticated">
              <router-link
                to="/dashboard"
                @click="closeMobileMenu"
                class="px-4 py-3 rounded-lg transition-all duration-200"
                :class="
                  $route.path === '/dashboard'
                    ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                "
              >
                <i class="pi pi-home mr-3"></i> Dashboard
              </router-link>
              <router-link
                to="/create-qr"
                @click="closeMobileMenu"
                class="px-4 py-3 rounded-lg transition-all duration-200"
                :class="
                  $route.path === '/create-qr'
                    ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                "
              >
                <i class="pi pi-plus mr-3"></i> Create QR
              </router-link>
              <!-- Mobile logout – we keep a separate button for mobile (optional) -->
              <button
                @click="handleLogout"
                class="px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 text-left"
              >
                <i class="pi pi-sign-out mr-3"></i> Logout
              </button>
            </template>
            <template v-else>
              <router-link
                to="/login"
                @click="closeMobileMenu"
                class="px-4 py-3 rounded-lg transition-all duration-200"
                :class="
                  $route.path === '/login'
                    ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                "
              >
                <i class="pi pi-sign-in mr-3"></i> Login
              </router-link>
              <router-link
                to="/signup"
                @click="closeMobileMenu"
                class="px-4 py-3 rounded-lg transition-all duration-200 font-semibold text-center"
                :class="
                  $route.path === '/signup'
                    ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                "
              >
                Sign Up
              </router-link>
            </template>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Profile Dialog -->
    <ProfileDialog v-model:visible="profileDialogVisible" />
  </nav>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
