<script lang="ts" setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import Toast from 'primevue/toast'
import { onMounted } from 'vue'
import { loadUser } from './stores/authStore'

onMounted(async () => {
  await loadUser()
})
</script>

<!-- App.vue -->
<template>
  <div class="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
    <Toast />
    <!-- Header -->
    <Header />

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>