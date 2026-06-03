<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
// import CreateQR from '@/components/CreateQR.vue'
// import Dashboard from '@/components/Dashboard.vue'
</script>

<template>
  <header>
    <div class="wrapper">
      <!-- <CreateQR />
      <Dashboard/> -->

      <nav>
        <RouterLink to="/" >Dashboard</RouterLink>
        <RouterLink to="/create-qr">Create QR</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>
