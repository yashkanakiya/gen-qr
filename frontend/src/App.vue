<!-- App.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
    <!-- Navbar -->
    <nav
      class="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200/50"
    >
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo/Brand -->
          <div class="flex items-center space-x-3">
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
          </div>

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
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
          >
            <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-xl"></i>
          </button>
        </div>

        <!-- Mobile Menu Dropdown -->
        <div
          v-show="mobileMenuOpen"
          class="md:hidden py-4 border-t border-gray-200 animate-slideDown"
        >
          <div class="flex flex-col space-y-2">
            <router-link
              to="/dashboard"
              @click="mobileMenuOpen = false"
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
              @click="mobileMenuOpen = false"
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
      </div>
    </nav>

    <!-- Main Content - This will push footer down when content is short -->
    <main class="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <!-- Footer - Sticky to bottom -->
    <footer class="bg-white/60 backdrop-blur-sm border-t border-gray-200 mt-auto">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="text-center sm:text-left">
            <p class="text-sm text-gray-600">© 2026 Yash Kanakiya. All rights reserved.</p>
          </div>

          <div class="flex space-x-6">
            <a href="#" class="text-gray-500 hover:text-blue-600 transition-colors">
              <i class="pi pi-question-circle"></i>
              <span class="ml-1 text-sm">Help</span>
            </a>
            <a href="#" class="text-gray-500 hover:text-blue-600 transition-colors">
              <i class="pi pi-info-circle"></i>
              <span class="ml-1 text-sm">About</span>
            </a>
            <a href="#" class="text-gray-500 hover:text-blue-600 transition-colors">
              <i class="pi pi-envelope"></i>
              <span class="ml-1 text-sm">Contact</span>
            </a>
          </div>

          <div class="flex space-x-4">
            <a href="#" class="text-gray-400 hover:text-blue-600 transition-colors">
              <i class="pi pi-github text-lg"></i>
            </a>
            <a href="#" class="text-gray-400 hover:text-blue-600 transition-colors">
              <i class="pi pi-twitter text-lg"></i>
            </a>
            <a href="#" class="text-gray-400 hover:text-blue-600 transition-colors">
              <i class="pi pi-linkedin text-lg"></i>
            </a>
          </div>
        </div>

        <!-- Optional: Footer bottom bar with version -->
        <div class="mt-4 pt-4 border-t border-gray-200 text-center">
          <p class="text-xs text-gray-400">
            Version 1.0.0 | Made with <i class="pi pi-heart-fill text-red-500 text-xs"></i> Yash Kanakiya
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileMenuOpen = ref(false)
</script>
