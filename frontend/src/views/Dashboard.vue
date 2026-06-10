<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { qrCodes, loadQRCodes, deleteQRCode, getQRCodeAnalytics, getRedirectUrl, type QRCodeItem, type ScanAnalytics } from '../stores/qrStore'

const router = useRouter()
const toast = useToast()
const isLoading = ref(true)
const deleteModalVisible = ref(false)
const analyticsModalVisible = ref(false)
const selectedQR = ref<QRCodeItem | null>(null)
const selectedAnalytics = ref<ScanAnalytics | null>(null)
const analyticsLoading = ref(false)
let refreshInterval: NodeJS.Timeout | null = null

const qrTypesMap: Record<string, { label: string; icon: string; color: string }> = {
  url: { label: 'URL', icon: 'pi pi-globe', color: 'blue' },
  text: { label: 'Text', icon: 'pi pi-file', color: 'gray' },
  email: { label: 'Email', icon: 'pi pi-envelope', color: 'green' },
  phone: { label: 'Phone', icon: 'pi pi-phone', color: 'purple' },
  sms: { label: 'SMS', icon: 'pi pi-comment', color: 'orange' },
  wifi: { label: 'WiFi', icon: 'pi pi-wifi', color: 'indigo' },
  location: { label: 'Location', icon: 'pi pi-map-marker', color: 'red' }
}

const getIconColorClass = (color: string | undefined) => {
  switch (color) {
    case 'blue': return 'text-blue-500'
    case 'gray': return 'text-gray-500'
    case 'green': return 'text-green-500'
    case 'purple': return 'text-purple-500'
    case 'orange': return 'text-orange-500'
    case 'indigo': return 'text-indigo-500'
    case 'red': return 'text-red-500'
    default: return 'text-gray-500'
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatLastScan = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      severity: 'success',
      summary: 'Copied!',
      detail: 'Link copied to clipboard',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed',
      detail: 'Could not copy to clipboard',
      life: 2000
    })
  }
}

const getQRCodeLink = (qr: QRCodeItem) => {
  return getRedirectUrl(qr.slug)
}

const loadData = async () => {
  isLoading.value = true
  try {
    await loadQRCodes()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load QR codes',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

const confirmDelete = (qr: QRCodeItem) => {
  selectedQR.value = qr
  deleteModalVisible.value = true
}

const handleDelete = async () => {
  if (!selectedQR.value) return
  
  try {
    await deleteQRCode(selectedQR.value.id)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'QR code removed successfully',
      life: 3000
    })
    deleteModalVisible.value = false
    selectedQR.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete QR code',
      life: 3000
    })
  }
}

const viewAnalytics = async (qr: QRCodeItem) => {
  selectedQR.value = qr
  analyticsLoading.value = true
  analyticsModalVisible.value = true
  
  try {
    selectedAnalytics.value = await getQRCodeAnalytics(qr.id)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load analytics',
      life: 3000
    })
    analyticsModalVisible.value = false
  } finally {
    analyticsLoading.value = false
  }
}

const refreshAnalytics = async () => {
  if (!selectedQR.value) return
  
  try {
    selectedAnalytics.value = await getQRCodeAnalytics(selectedQR.value.id)
    toast.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Analytics data updated',
      life: 2000
    })
  } catch (error) {
    console.error('Refresh error:', error)
  }
}

// Auto-refresh every 5 seconds when modal is open
watch(analyticsModalVisible, (isVisible) => {
  if (isVisible) {
    refreshInterval = setInterval(() => {
      if (selectedQR.value && analyticsModalVisible.value) {
        getQRCodeAnalytics(selectedQR.value.id).then(data => {
          selectedAnalytics.value = data
        }).catch(error => {
          console.error('Auto-refresh error:', error)
        })
      }
    }, 5000)
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }
})

const editQR = (qr: QRCodeItem) => {
  router.push(`/edit-qr/${qr.id}`)
}

const createNew = () => {
  router.push('/create-qr')
}

const getChartData = computed(() => {
  if (!selectedAnalytics.value?.scans_by_day) return []
  return selectedAnalytics.value.scans_by_day.slice().reverse()
})

const getMaxScans = computed(() => {
  const scans = getChartData.value.map(d => d.count)
  return Math.max(...scans, 1)
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            My QR Codes
          </h1>
          <p class="text-gray-600 mt-1">Manage and track your QR codes</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
      </div>

      <!-- Empty State -->
      <div v-else-if="qrCodes.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-qrcode text-3xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No QR Codes Yet</h3>
        <p class="text-gray-600 mb-6">Create your first QR code to get started</p>
        <button
          @click="createNew"
          class="px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          Create QR Code
        </button>
      </div>

      <!-- QR Codes Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="qr in qrCodes"
          :key="qr.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
        >
          <!-- QR Preview -->
          <div class="bg-gray-50 p-4 flex justify-center border-b border-gray-100">
            <img :src="qr.qrSrc" :alt="qr.name" class="w-32 h-32 object-contain" />
          </div>
          
          <!-- Content -->
          <div class="p-4">
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <i :class="[qrTypesMap[qr.type]?.icon || 'pi pi-qrcode', getIconColorClass(qrTypesMap[qr.type]?.color)]" class="text-sm"></i>
                  <span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                    {{ qrTypesMap[qr.type]?.label || qr.type }}
                  </span>
                </div>
                <h3 class="font-semibold text-gray-900">{{ qr.name }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(qr.created_at) }}</p>
              </div>
              <button
                @click="editQR(qr)"
                class="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <i class="pi pi-pencil"></i>
              </button>
            </div>
            
            <!-- Stats -->
            <div class="mt-3 pt-3 border-t border-gray-100">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <i class="pi pi-chart-line text-gray-400"></i>
                  <span class="text-gray-600">{{ qr.scan_count || 0 }} scans</span>
                </div>
                <button
                  @click="viewAnalytics(qr)"
                  class="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  View Stats →
                </button>
              </div>
            </div>
            
            <!-- Link -->
            <div class="mt-2 flex items-center gap-2">
              <input
                :value="getQRCodeLink(qr)"
                type="text"
                readonly
                class="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600"
              />
              <button
                @click="copyToClipboard(getQRCodeLink(qr))"
                class="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                title="Copy link"
              >
                <i class="pi pi-copy"></i>
              </button>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex border-t border-gray-100 divide-x divide-gray-100">
            <button
              @click="viewAnalytics(qr)"
              class="flex-1 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <i class="pi pi-chart-line mr-1"></i> Analytics
            </button>
            <button
              @click="editQR(qr)"
              class="flex-1 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <i class="pi pi-pencil mr-1"></i> Edit
            </button>
            <button
              @click="confirmDelete(qr)"
              class="flex-1 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              <i class="pi pi-trash mr-1"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="deleteModalVisible = false">
      <div class="bg-white rounded-xl max-w-sm w-full shadow-2xl animate-fade-in">
        <div class="text-center p-6">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete QR Code?</h3>
          <p class="text-gray-600">
            Are you sure you want to delete "{{ selectedQR?.name }}"? This action cannot be undone.
          </p>
        </div>
        <div class="flex gap-3 p-4 border-t border-gray-100">
          <button @click="deleteModalVisible = false" class="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium">
            Cancel
          </button>
          <button @click="handleDelete" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Analytics Modal -->
    <div v-if="analyticsModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" @click.self="analyticsModalVisible = false">
      <div class="bg-white rounded-xl max-w-4xl w-full shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Analytics: {{ selectedQR?.name }}</h3>
            <p class="text-sm text-gray-500">Scan statistics and insights (auto-refreshes every 5s)</p>
          </div>
          <div class="flex gap-2">
            <button 
              @click="refreshAnalytics" 
              class="text-blue-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
              title="Refresh now"
            >
              <i class="pi pi-refresh"></i>
            </button>
            <button @click="analyticsModalVisible = false" class="text-gray-400 hover:text-gray-600 transition-colors">
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>
        </div>
        
        <div v-if="analyticsLoading" class="flex justify-center items-center py-20">
          <i class="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
        </div>
        
        <div v-else-if="selectedAnalytics" class="p-6">
          <!-- Stats Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 rounded-lg p-4 text-center">
              <i class="pi pi-eye text-blue-500 text-xl mb-2 block"></i>
              <div class="text-2xl font-bold text-blue-700">{{ selectedAnalytics.total_scans }}</div>
              <div class="text-xs text-blue-600">Total Scans</div>
            </div>
            <div class="bg-green-50 rounded-lg p-4 text-center">
              <i class="pi pi-users text-green-500 text-xl mb-2 block"></i>
              <div class="text-2xl font-bold text-green-700">{{ selectedAnalytics.unique_visitors }}</div>
              <div class="text-xs text-green-600">Unique Visitors</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-4 text-center">
              <i class="pi pi-globe text-purple-500 text-xl mb-2 block"></i>
              <div class="text-2xl font-bold text-purple-700">{{ selectedAnalytics.countries }}</div>
              <div class="text-xs text-purple-600">Countries</div>
            </div>
            <div class="bg-orange-50 rounded-lg p-4 text-center">
              <i class="pi pi-clock text-orange-500 text-xl mb-2 block"></i>
              <div class="text-sm font-semibold text-orange-700">{{ formatLastScan(selectedAnalytics.last_scan) }}</div>
              <div class="text-xs text-orange-600">Last Scan</div>
            </div>
          </div>
          
          <!-- Scans Over Time Chart -->
          <div v-if="selectedAnalytics.scans_by_day && selectedAnalytics.scans_by_day.length > 0" class="mb-6">
            <h4 class="font-semibold text-gray-700 mb-3">Scans Over Time</h4>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-end gap-2 h-32">
                <div
                  v-for="day in getChartData.slice(-7)"
                  :key="day.date"
                  class="flex-1 flex flex-col items-center"
                >
                  <div
                    class="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    :style="{ height: `${(day.count / getMaxScans) * 100}%`, minHeight: '4px' }"
                  ></div>
                  <span class="text-xs text-gray-500 mt-1">{{ new Date(day.date).getDate() }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Recent Scans with Device Info -->
          <div v-if="selectedAnalytics.recent_scans && selectedAnalytics.recent_scans.length > 0">
            <h4 class="font-semibold text-gray-700 mb-3">Recent Scans</h4>
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="scan in selectedAnalytics.recent_scans"
                :key="scan.scanned_at"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                <div class="flex items-center gap-3 flex-1">
                  <i :class="scan.device_type === 'Mobile' ? 'pi pi-mobile' : (scan.device_type === 'Tablet' ? 'pi pi-tablet' : 'pi pi-desktop')" 
                     class="text-gray-500"></i>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-gray-700">{{ scan.country || 'Unknown' }}</p>
                      <span class="text-xs text-gray-400">•</span>
                      <p class="text-xs text-gray-500">{{ formatDateTime(scan.scanned_at) }}</p>
                    </div>
                    <div class="flex gap-2 mt-1">
                      <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{{ scan.device_type || 'Unknown' }}</span>
                      <span class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">{{ scan.browser || 'Unknown' }}</span>
                      <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">{{ scan.os || 'Unknown' }}</span>
                    </div>
                  </div>
                </div>
                <i class="pi pi-info-circle text-gray-400" title="IP: {{ scan.ip }}"></i>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8 text-gray-500">
            <i class="pi pi-chart-line text-4xl mb-2 block"></i>
            <p>No scan data available yet</p>
            <p class="text-sm">Share your QR code to start collecting analytics</p>
          </div>
        </div>
      </div>
    </div>
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