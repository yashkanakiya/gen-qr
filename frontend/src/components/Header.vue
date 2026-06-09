<script lang="ts" setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<!-- components/Header.vue -->
<template>
  <nav class="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200/50">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo/Brand -->
        <router-link to="/dashboard" class="flex items-center space-x-3">
          <div
            class="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <i class="pi pi-qrcode text-white text-xl"></i>
          </div>
          <span
            class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            QR Gen
          </span>
        </router-link>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-4">
          <router-link
            to="/dashboard"
            class="px-4 py-2 rounded-lg transition-all duration-200"
            :class="
              $route.path === '/dashboard'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            "
          >
            <i class="pi pi-home mr-2"></i>
            Dashboard
          </router-link>
          <router-link
            to="/create-qr"
            class="px-4 py-2 rounded-lg transition-all duration-200"
            :class="
              $route.path === '/create-qr'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            "
          >
            <i class="pi pi-plus mr-2"></i>
            Create QR
          </router-link>
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
              to="/dashboard"
              @click="closeMobileMenu"
              class="px-4 py-3 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/dashboard'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              <i class="pi pi-home mr-3"></i>
              Dashboard
            </router-link>
            <router-link
              to="/create-qr"
              @click="closeMobileMenu"
              class="px-4 py-3 rounded-lg transition-all duration-200"
              :class="
                $route.path === '/create-qr'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              <i class="pi pi-plus mr-3"></i>
              Create QR
            </router-link>
          </div>
        </div>
      </Transition>
    </div>
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