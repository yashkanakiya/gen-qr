<!-- Dashboard.vue -->
<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
        My QR Codes
      </h1>
      <p class="text-gray-600">Manage and organize all your QR codes</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total QR Codes</p>
            <p class="text-2xl font-bold text-gray-800">{{ qrCodes.length }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-qrcode text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Created This Month</p>
            <p class="text-2xl font-bold text-gray-800">{{ getMonthlyCount }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-calendar text-green-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Last Created</p>
            <p class="text-sm font-semibold text-gray-800 truncate">{{ lastCreated || 'None' }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-clock text-purple-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Storage Used</p>
            <p class="text-2xl font-bold text-gray-800">{{ qrCodes.length * 12 }}KB</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-database text-orange-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Codes Table/Cards -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">QR Code</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">URL</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="qr in qrCodes" :key="qr.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900">{{ qr.name }}</div>
               </td>
              <td class="px-6 py-4">
                <img :src="qr.qrSrc" :alt="qr.name" class="w-12 h-12 object-contain rounded-lg border border-gray-200" />
               </td>
              <td class="px-6 py-4">
                <a :href="qr.url" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm truncate block max-w-xs">
                  {{ qr.url }}
                </a>
               </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ qr.createdAt }}</td>
              <td class="px-6 py-4">
                <div class="flex space-x-2">
                  <Button icon="pi pi-pencil" severity="info" rounded @click="openEditModal(qr)" />
                  <Button icon="pi pi-trash" severity="danger" rounded @click="openDeleteModal(qr)" />
                  <Button icon="pi pi-download" severity="secondary" rounded @click="openDownloadModal(qr)" />
                </div>
               </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards View -->
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="qr in qrCodes" :key="qr.id" class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-start space-x-4">
            <img :src="qr.qrSrc" :alt="qr.name" class="w-16 h-16 object-contain rounded-lg border border-gray-200" />
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">{{ qr.name }}</h3>
              <p class="text-xs text-gray-500 mt-1">{{ qr.createdAt }}</p>
              <a :href="qr.url" target="_blank" class="text-blue-600 text-xs truncate block mt-1">
                {{ qr.url }}
              </a>
            </div>
            <div class="flex flex-col space-y-2">
              <Button icon="pi pi-pencil" severity="info" size="small" rounded @click="openEditModal(qr)" />
              <Button icon="pi pi-trash" severity="danger" size="small" rounded @click="openDeleteModal(qr)" />
              <Button icon="pi pi-download" severity="secondary" size="small" rounded @click="openDownloadModal(qr)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="qrCodes.length === 0" class="text-center py-12">
        <i class="pi pi-qrcode text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No QR Codes Yet</h3>
        <p class="text-gray-500 mb-6">Create your first QR code to get started</p>
        <router-link to="/create-qr">
          <Button label="Create QR Code" severity="primary" />
        </router-link>
      </div>
    </div>

    <!-- Edit Modal (Updated) -->
    <Dialog 
      v-model:visible="editModalVisible" 
      modal 
      header="Edit QR Code"
      class="w-full max-w-md"
      :style="{ width: '90vw', maxWidth: '500px' }"
    >
      <div class="space-y-4 p-2">
        <!-- Editable Name Field -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Name <span class="text-red-500">*</span>
          </label>
          <InputText 
            v-model="editForm.name" 
            type="text"
            placeholder="Enter name (min 3 chars, no spaces)"
            class="w-full"
            :class="{ 'p-invalid': errors.name }"
          />
          <small v-if="errors.name" class="text-red-500 text-xs">{{ errors.name }}</small>
          <small v-else class="text-gray-500 text-xs">Minimum 3 characters, no spaces allowed</small>
        </div>
        
        <!-- QR Code Preview -->
        <div class="text-center">
          <label class="block text-sm font-medium text-gray-700 mb-2">QR Code Preview</label>
          <img :src="selectedQR?.qrSrc" :alt="selectedQR?.name" class="w-32 h-32 mx-auto object-contain border rounded-lg p-2" />
          <small class="text-gray-500 text-xs">QR code will update only if URL changes</small>
        </div>
        
        <!-- Editable URL Field -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            URL <span class="text-red-500">*</span>
          </label>
          <InputText 
            v-model="editForm.url" 
            type="text"
            placeholder="https://example.com"
            class="w-full"
            :class="{ 'p-invalid': errors.url }"
          />
          <small v-if="errors.url" class="text-red-500 text-xs">{{ errors.url }}</small>
          <small v-else class="text-gray-500 text-xs">Must start with http:// or https://</small>
        </div>
      </div>
      
      <template #footer>
        <div class="flex gap-3">
          <Button label="Cancel" severity="secondary" @click="closeEditModal" class="flex-1" />
          <Button 
            label="Update" 
            severity="primary" 
            @click="updateQRCode" 
            class="flex-1"
            :loading="isUpdating"
          />
        </div>
      </template>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <Dialog 
      v-model:visible="deleteModalVisible" 
      modal 
      header="Delete QR Code"
      class="w-full max-w-sm"
    >
      <div class="text-center p-4">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-exclamation-triangle text-red-600 text-2xl"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
        <p class="text-gray-600">
          Are you sure you want to delete "{{ selectedQR?.name }}"? This action cannot be undone.
        </p>
      </div>
      
      <template #footer>
        <div class="flex gap-3">
          <Button label="Cancel" severity="secondary" @click="deleteModalVisible = false" class="flex-1" />
          <Button label="Delete" severity="danger" @click="confirmDelete" class="flex-1" />
        </div>
      </template>
    </Dialog>

    <!-- Download Modal -->
    <Dialog 
      v-model:visible="downloadModalVisible" 
      modal 
      header="Download QR Code"
      class="w-full max-w-md"
    >
      <div class="space-y-4 p-2">
        <div class="text-center">
          <img :src="selectedQR?.qrSrc" :alt="selectedQR?.name" class="w-48 h-48 mx-auto object-contain border rounded-lg p-4" />
          <p class="font-semibold text-gray-900 mt-3">{{ selectedQR?.name }}</p>
        </div>
        
        <div class="grid grid-cols-3 gap-3">
          <Button label="PNG" severity="info" @click="downloadQR('png')" class="w-full" />
          <Button label="JPG" severity="info" @click="downloadQR('jpg')" class="w-full" />
          <Button label="SVG" severity="info" @click="downloadQR('svg')" class="w-full" />
        </div>
      </div>
      
      <template #footer>
        <Button label="Close" severity="secondary" @click="downloadModalVisible = false" class="w-full" />
      </template>
    </Dialog>

    <!-- Toast Notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { loadQRCodes, deleteQRCode, updateQRCode as updateQRInStore } from '../stores/qrStore'

const router = useRouter()
const toast = useToast()
const qrCodes = ref([])
const selectedQR = ref(null)
const editModalVisible = ref(false)
const deleteModalVisible = ref(false)
const downloadModalVisible = ref(false)
const isUpdating = ref(false)

const editForm = ref({
  name: '',
  url: ''
})

const errors = ref({
  name: '',
  url: ''
})

const lastCreated = computed(() => {
  if (qrCodes.value.length === 0) return null
  return qrCodes.value[0]?.createdAt
})

const getMonthlyCount = computed(() => {
  const currentMonth = new Date().getMonth()
  return qrCodes.value.filter(qr => {
    const qrDate = new Date(qr.createdAt)
    return qrDate.getMonth() === currentMonth
  }).length
})

onMounted(() => {
  loadQRCodesFromStorage()
})

function loadQRCodesFromStorage() {
  qrCodes.value = loadQRCodes()
}

// Validation functions
function validateName(name) {
  const trimmed = name?.trim()
  if (!trimmed || trimmed.length < 3) {
    return 'Name must be at least 3 characters'
  }
  if (trimmed.includes(' ')) {
    return 'Name cannot contain spaces'
  }
  return null
}

function validateUrl(url) {
  const trimmed = url?.trim()
  if (!trimmed) {
    return 'URL is required'
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'URL must start with http:// or https://'
  }
  try {
    new URL(trimmed)
    return null
  } catch {
    return 'Please enter a valid URL'
  }
}

function validateForm() {
  errors.value.name = validateName(editForm.value.name)
  errors.value.url = validateUrl(editForm.value.url)
  return !errors.value.name && !errors.value.url
}

function openEditModal(qr) {
  selectedQR.value = qr
  editForm.value = {
    name: qr.name,
    url: qr.url
  }
  errors.value = { name: '', url: '' }
  editModalVisible.value = true
}

function openDeleteModal(qr) {
  selectedQR.value = qr
  deleteModalVisible.value = true
}

function openDownloadModal(qr) {
  selectedQR.value = qr
  downloadModalVisible.value = true
}

function closeEditModal() {
  editModalVisible.value = false
  selectedQR.value = null
  editForm.value = { name: '', url: '' }
  errors.value = { name: '', url: '' }
  isUpdating.value = false
}

async function updateQRCode() {
  if (!validateForm()) return
  
  isUpdating.value = true
  
  try {
    const updates = {}
    
    // Check if name changed
    if (editForm.value.name.trim() !== selectedQR.value.name) {
      updates.name = editForm.value.name
    }
    
    // Check if URL changed
    if (editForm.value.url.trim() !== selectedQR.value.url) {
      updates.url = editForm.value.url
    }
    
    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'No Changes',
        detail: 'No changes were made to update',
        life: 3000
      })
      closeEditModal()
      return
    }
    
    // Call store update function with both name and url
    await updateQRInStore(selectedQR.value.id, updates)
    
    // Reload data
    loadQRCodesFromStorage()
    
    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'QR code updated successfully',
      life: 3000
    })
    
    closeEditModal()
  } catch (error) {
    console.error('Update failed:', error)
    
    // Handle validation errors from store
    if (error.message.includes('Name')) {
      errors.value.name = error.message
    } else if (error.message.includes('URL')) {
      errors.value.url = error.message
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to update QR code',
        life: 4000
      })
    }
  } finally {
    isUpdating.value = false
  }
}

function confirmDelete() {
  deleteQRCode(selectedQR.value.id)
  loadQRCodesFromStorage()
  deleteModalVisible.value = false
  toast.add({
    severity: 'success',
    summary: 'Deleted',
    detail: 'QR code deleted successfully',
    life: 3000
  })
}

async function downloadQR(format) {
  if (!selectedQR.value) return
  
  const url = selectedQR.value.qrSrc
  const filename = `${selectedQR.value.name}.${format}`
  
  if (format === 'svg') {
    const response = await fetch(url.replace('size=200x200', 'size=500x500&format=svg'))
    const svgText = await response.text()
    const blob = new Blob([svgText], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  } else {
    const response = await fetch(url)
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }
  
  downloadModalVisible.value = false
  toast.add({
    severity: 'success',
    summary: 'Download Started',
    detail: `Downloading ${filename}`,
    life: 2000
  })
}
</script>