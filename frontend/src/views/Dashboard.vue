<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1
        class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2"
      >
        My QR Codes
      </h1>
      <p class="text-gray-600">Manage and organize all your QR codes</p>
    </div>

    <!-- Stats Cards with Colorful Icons -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total QR Codes</p>
            <p class="text-2xl font-bold text-gray-800">{{ filteredQRCodes.length }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-qrcode text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      >
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

      <div
        class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Last Created</p>
            <p class="text-2xl font-bold text-gray-800">{{ lastCreatedDate || 'None' }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-clock text-purple-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Created Today</p>
            <p class="text-2xl font-bold text-gray-800">{{ getTodayCount }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-sun text-orange-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <div class="relative bg-white">
        <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm z-10"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or URL..."
          class="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
      <p v-if="searchQuery" class="text-sm text-gray-500 mt-2">
        Found {{ filteredQRCodes.length }} result(s) for "{{ searchQuery }}"
      </p>
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
            <tr v-for="qr in filteredQRCodes" :key="qr.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900">{{ qr.name }}</div>
              </td>
              <td class="px-6 py-4">
                <img
                  :src="qr.qrSrc"
                  :alt="qr.name"
                  class="w-12 h-12 object-contain rounded-lg border border-gray-200"
                />
              </td>
              <td class="px-6 py-4">
                <a
                  :href="qr.url"
                  target="_blank"
                  class="text-blue-600 hover:text-blue-800 text-sm truncate block max-w-xs"
                >
                  {{ qr.url }}
                </a>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ qr.createdAt }}</td>
              <td class="px-6 py-4">
                <div class="flex space-x-2">
                  <button
                    @click="openEditModal(qr)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <i class="pi pi-pencil text-sm"></i>
                  </button>
                  <button
                    @click="openDeleteModal(qr)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <i class="pi pi-trash text-sm"></i>
                  </button>
                  <button
                    @click="openDownloadModal(qr)"
                    class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <i class="pi pi-download text-sm"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredQRCodes.length === 0 && qrCodes.length > 0">
              <td colspan="5" class="px-6 py-12 text-center">
                <i class="pi pi-search text-4xl text-gray-300 mb-2 block"></i>
                <p class="text-gray-500">No QR codes match your search</p>
                <button
                  @click="clearSearch"
                  class="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear search
                </button>
               </td>
             </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards View -->
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="qr in filteredQRCodes" :key="qr.id" class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-start space-x-4">
            <img
              :src="qr.qrSrc"
              :alt="qr.name"
              class="w-16 h-16 object-contain rounded-lg border border-gray-200"
            />
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">{{ qr.name }}</h3>
              <p class="text-xs text-gray-500 mt-1">{{ qr.createdAt }}</p>
              <a :href="qr.url" target="_blank" class="text-blue-600 text-xs truncate block mt-1">
                {{ qr.url }}
              </a>
            </div>
            <div class="flex flex-col space-y-2">
              <button
                @click="openEditModal(qr)"
                class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <i class="pi pi-pencil text-sm"></i>
              </button>
              <button
                @click="openDeleteModal(qr)"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <i class="pi pi-trash text-sm"></i>
              </button>
              <button
                @click="openDownloadModal(qr)"
                class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i class="pi pi-download text-sm"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="filteredQRCodes.length === 0 && qrCodes.length > 0" class="text-center py-12">
          <i class="pi pi-search text-4xl text-gray-300 mb-2 block"></i>
          <p class="text-gray-500">No QR codes match your search</p>
          <button
            @click="clearSearch"
            class="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Clear search
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="qrCodes.length === 0" class="text-center py-12">
        <i class="pi pi-qrcode text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No QR Codes Yet</h3>
        <p class="text-gray-500 mb-6">Create your first QR code to get started</p>
        <router-link to="/create-qr">
          <button class="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
            Create QR Code
          </button>
        </router-link>
      </div>
    </div>

    <!-- Edit Modal with Blur Background -->
    <div v-if="editModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="closeEditModal">
      <div class="bg-white rounded-xl max-w-md w-full shadow-2xl relative animate-fade-in">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-xl font-semibold text-gray-900">Edit QR Code</h3>
          <p class="text-sm text-gray-500 mt-1">{{ selectedQR?.name }}</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              v-model="editForm.name"
              type="text"
              placeholder="Enter QR code name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.name }"
              @input="validateName"
            />
            <p v-if="validationErrors.name" class="text-red-500 text-xs mt-1">{{ validationErrors.name }}</p>
            <p class="text-gray-400 text-xs mt-1">Minimum 3 characters (letters, numbers, and spaces only)</p>
          </div>

          <div class="text-center">
            <img
              :src="selectedQR?.qrSrc"
              :alt="selectedQR?.name"
              class="w-32 h-32 mx-auto object-contain"
            />
            <p class="text-xs text-gray-500 mt-2">QR code cannot be edited</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
            <input
              v-model="editForm.url"
              type="url"
              placeholder="Enter new URL"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.url }"
              @input="validateUrl"
            />
            <p v-if="validationErrors.url" class="text-red-500 text-xs mt-1">{{ validationErrors.url }}</p>
            <p class="text-gray-400 text-xs mt-1">Must start with http:// or https://</p>
          </div>
        </div>

        <div class="p-6 border-t border-gray-100 flex gap-3">
          <button
            @click="closeEditModal"
            class="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            @click="updateQRCode"
            :disabled="!isFormValid || isUpdating"
            class="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <i v-if="isUpdating" class="pi pi-spin pi-spinner mr-2"></i>
            Update
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal with Blur Background -->
    <div v-if="deleteModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="deleteModalVisible = false">
      <div class="bg-white rounded-xl max-w-sm w-full shadow-2xl relative animate-fade-in">
        <div class="text-center p-6">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
          <p class="text-gray-600">
            Are you sure you want to delete "{{ selectedQR?.name }}"? This action cannot be undone.
          </p>
        </div>
        <div class="flex gap-3 p-6 border-t border-gray-100">
          <button
            @click="deleteModalVisible = false"
            class="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            :disabled="isDeleting"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium disabled:opacity-50"
          >
            <i v-if="isDeleting" class="pi pi-spin pi-spinner mr-2"></i>
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Download Modal with Blur Background -->
    <div v-if="downloadModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="downloadModalVisible = false">
      <div class="bg-white rounded-xl max-w-md w-full shadow-2xl relative animate-fade-in">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-xl font-semibold text-gray-900">Download QR Code</h3>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="text-center">
            <img
              :src="selectedQR?.qrSrc"
              :alt="selectedQR?.name"
              class="w-48 h-48 mx-auto object-contain border rounded-lg p-4"
            />
            <p class="font-semibold text-gray-900 mt-3">{{ selectedQR?.name }}</p>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <button @click="downloadQR('png')" class="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium">
              PNG
            </button>
            <button @click="downloadQR('jpg')" class="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium">
              JPG
            </button>
            <button @click="downloadQR('svg')" class="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium">
              SVG
            </button>
          </div>
        </div>

        <div class="p-6 border-t border-gray-100">
          <button
            @click="downloadModalVisible = false"
            class="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <Toast />
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import {
  qrCodes,
  loadQRCodes,
  deleteQRCode as deleteQRFromStore,
  updateQRCode as updateQRInStore,
} from '../stores/qrStore'

const router = useRouter()
const toast = useToast()
const selectedQR = ref(null)
const editModalVisible = ref(false)
const deleteModalVisible = ref(false)
const downloadModalVisible = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)
const searchQuery = ref('')

const editForm = ref({
  name: '',
  url: '',
})

const validationErrors = ref({
  name: '',
  url: ''
})

const validateName = () => {
  const name = editForm.value.name
  
  if (!name || name.trim() === '') {
    validationErrors.value.name = 'Name is required'
    return false
  }
  
  if (name !== name.trim()) {
    validationErrors.value.name = 'Name should not start or end with spaces'
    return false
  }
  
  if (name.trim().length < 3) {
    validationErrors.value.name = 'Name must be at least 3 characters'
    return false
  }
  
  const alphanumericRegex = /^[a-zA-Z0-9\s]+$/
  if (!alphanumericRegex.test(name)) {
    validationErrors.value.name = 'Name must contain only letters, numbers, and spaces'
    return false
  }
  
  validationErrors.value.name = ''
  return true
}

const validateUrl = () => {
  const url = editForm.value.url
  
  if (!url || url.trim() === '') {
    validationErrors.value.url = 'URL is required'
    return false
  }
  
  if (url !== url.trim()) {
    validationErrors.value.url = 'URL should not start or end with spaces'
    return false
  }
  
  const urlRegex = /^https?:\/\/.+/i
  if (!urlRegex.test(url.trim())) {
    validationErrors.value.url = 'URL must start with http:// or https://'
    return false
  }
  
  validationErrors.value.url = ''
  return true
}

const isFormValid = computed(() => {
  return validationErrors.value.name === '' && 
         validationErrors.value.url === '' && 
         editForm.value.name.trim() !== '' && 
         editForm.value.url.trim() !== ''
})

const filteredQRCodes = computed(() => {
  if (!searchQuery.value.trim()) {
    return qrCodes.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return qrCodes.value.filter(qr => 
    qr.name.toLowerCase().includes(query) || 
    qr.url.toLowerCase().includes(query)
  )
})

const lastCreatedDate = computed(() => {
  if (qrCodes.value.length === 0) return null
  return qrCodes.value[0]?.createdAt
})

const getMonthlyCount = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  return qrCodes.value.filter((qr) => {
    const qrDate = new Date(qr.createdAt)
    return qrDate.getMonth() === currentMonth && qrDate.getFullYear() === currentYear
  }).length
})

const getTodayCount = computed(() => {
  const today = new Date().toLocaleDateString()
  return qrCodes.value.filter((qr) => {
    return qr.createdAt === today
  }).length
})

function clearSearch() {
  searchQuery.value = ''
}

onMounted(async () => {
  await loadQRCodesFromAPI()
})

async function loadQRCodesFromAPI() {
  try {
    await loadQRCodes()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load QR codes',
      life: 4000,
    })
  }
}

function openEditModal(qr) {
  selectedQR.value = qr
  editForm.value = {
    name: qr.name,
    url: qr.url,
  }
  validationErrors.value = {
    name: '',
    url: ''
  }
  editModalVisible.value = true
}

function closeEditModal() {
  editModalVisible.value = false
  editForm.value = { name: '', url: '' }
  validationErrors.value = { name: '', url: '' }
  selectedQR.value = null
}

function openDeleteModal(qr) {
  selectedQR.value = qr
  deleteModalVisible.value = true
}

function openDownloadModal(qr) {
  selectedQR.value = qr
  downloadModalVisible.value = true
}

async function updateQRCode() {
  const isNameValid = validateName()
  const isUrlValid = validateUrl()
  
  if (!isNameValid || !isUrlValid) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the validation errors before updating',
      life: 4000,
    })
    return
  }
  
  const updates = {
    name: editForm.value.name.trim(),
    url: editForm.value.url.trim(),
  }

  isUpdating.value = true

  try {
    await updateQRInStore(selectedQR.value.id, updates)

    editModalVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'QR code updated successfully',
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to update QR code',
      life: 4000,
    })
  } finally {
    isUpdating.value = false
  }
}

async function confirmDelete() {
  isDeleting.value = true

  try {
    await deleteQRFromStore(selectedQR.value.id)

    deleteModalVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'QR code deleted successfully',
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to delete QR code',
      life: 4000,
    })
  } finally {
    isDeleting.value = false
  }
}

async function downloadQR(format) {
  if (!selectedQR.value) return

  const url = selectedQR.value.qrSrc
  const filename = `${selectedQR.value.name}.${format}`

  try {
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
      life: 2000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: 'Failed to download QR code',
      life: 4000,
    })
  }
}
</script>