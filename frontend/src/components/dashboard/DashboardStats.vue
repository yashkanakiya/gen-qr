<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Total QR -->
    <div
      class="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm border border-blue-200/50"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-blue-700 text-sm font-medium">Total QR</p>
          <Skeleton v-if="loading" width="3rem" height="2rem" class="mt-1" />
          <p v-else class="text-2xl font-bold text-blue-800">{{ totalQr }}</p>
        </div>
        <i class="pi pi-qrcode text-3xl text-blue-400"></i>
      </div>
    </div>

    <!-- Total Scans -->
    <div
      class="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-sm border border-green-200/50"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-green-700 text-sm font-medium">Total Scans</p>
          <Skeleton v-if="loading" width="3rem" height="2rem" class="mt-1" />
          <p v-else class="text-2xl font-bold text-green-800">{{ totalScans }}</p>
        </div>
        <i class="pi pi-chart-line text-3xl text-green-400"></i>
      </div>
    </div>

    <!-- Last Created -->
    <div
      class="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-4 shadow-sm border border-purple-200/50"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-purple-700 text-sm font-medium">Last Created</p>
          <Skeleton v-if="loading" width="5rem" height="2rem" class="mt-1" />
          <p v-else class="text-lg font-bold text-purple-800 truncate">{{ lastCreated }}</p>
        </div>
        <i class="pi pi-calendar text-3xl text-purple-400"></i>
      </div>
    </div>

    <!-- Types Used -->
    <div
      class="bg-linear-to-br from-orange-50 to-orange-100 rounded-xl p-4 shadow-sm border border-orange-200/50"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-orange-700 text-sm font-medium">Types Used</p>
          <Skeleton v-if="loading" width="3rem" height="2rem" class="mt-1" />
          <p v-else class="text-2xl font-bold text-orange-800">{{ typesCount }}</p>
        </div>
        <i class="pi pi-tags text-3xl text-orange-400"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from 'primevue/skeleton'

defineProps<{
  totalQr: number
  totalScans: number
  lastCreated: string
  typesCount: number
  loading?: boolean
}>()
</script>
