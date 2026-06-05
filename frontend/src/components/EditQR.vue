<!-- EditQR.vue -->
<template>
  <div class="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Edit QR Code URL</h2>
    
    <!-- Field 1: Name - DISABLED, cannot change -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Name
      </label>
      <InputText 
        type="text" 
        v-model="form.name" 
        placeholder="Name (cannot be changed)"
        class="w-full bg-gray-100 cursor-not-allowed"
      />
      <!-- <p class="mt-1 text-xs text-gray-500">
        Name cannot be changed
      </p> -->
    </div>

    <!-- Field 2: Current QR Code (display only) -->
    <div class="mb-6 text-center">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Current QR Code
      </label>
      <div class="inline-block p-4 bg-gray-50 rounded-lg border border-gray-200">
        <img 
          v-if="form.qrSrc"
          :src="form.qrSrc" 
          :alt="form.name" 
          class="w-32 h-32 object-contain"
        />
      </div>
    </div>

    <!-- Field 3: URL - CAN be edited -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Destination URL (editable)
      </label>
      <InputText 
        type="text" 
        v-model="form.url" 
        placeholder="Enter new destination URL"
        class="w-full"
      />
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 mt-8">
      <Button 
        label="Update URL" 
        @click="updateQR"
        :disabled="!form.url || form.url === originalUrl"
        class="flex-1"
        :class="{
          'opacity-50 cursor-not-allowed': !form.url || form.url === originalUrl
        }"
      />
      <Button 
        label="Cancel" 
        severity="secondary" 
        @click="cancel"
        class="flex-1"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { getQRCodeById, updateQRCode } from '../stores/qrStore'

const route = useRoute()
const router = useRouter()

const form = reactive({
  name: '',
  url: '',
  qrSrc: ''
})

const originalUrl = ref('')
const qrId = ref(null)

onMounted(() => {
  // Get ID from route params
  qrId.value = parseInt(route.params.id)
  const qrData = getQRCodeById(qrId.value)
  
  if (qrData) {
    form.name = qrData.name
    form.url = qrData.url
    form.qrSrc = qrData.qrSrc
    originalUrl.value = qrData.url
  } else {
    // QR code not found, go back to dashboard
    router.push('/dashboard')
  }
})

function updateQR() {
  if (form.url && form.url !== originalUrl.value) {
    updateQRCode(qrId.value, form.url)
    // You can replace this with a toast notification
    alert('QR code URL updated successfully!')
    router.push('/dashboard')
  }
}

function cancel() {
  router.push('/dashboard')
}
</script>