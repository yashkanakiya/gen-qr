<template>
  <div class="relative max-w-md">
    <span class="absolute inset-y-0 left-0 flex items-center pl-3">
      <i class="pi pi-search text-gray-400 text-sm"></i>
    </span>
    <Skeleton v-if="loading" width="100%" height="2.75rem" class="rounded-xl" />
    <input
      v-else
      :value="modelValue"
      type="text"
      placeholder="Search by name..."
      class="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-white shadow-sm"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue && !loading"
      @click="$emit('clear')"
      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
    >
      <i class="pi pi-times-circle text-sm"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import Skeleton from 'primevue/skeleton'

defineProps<{
  modelValue: string
  loading?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clear'): void
}>()
</script>
