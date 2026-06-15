<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { qrCodes, loadQRCodes, deleteQRCode, getQRCodeAnalytics, getRedirectUrl, type QRCodeItem, type ScanAnalytics } from '../stores/qrStore'

const router = useRouter()
const toast = useToast()
const isLoading = ref(true)
const deleteModalVisible = ref(false)
const analyticsModalVisible = ref(false)
const viewModalVisible = ref(false)
const selectedQR = ref<QRCodeItem | null>(null)
const viewSelectedQR = ref<QRCodeItem | null>(null)
const selectedAnalytics = ref<ScanAnalytics | null>(null)
const analyticsLoading = ref(false)
const actionMenu = ref()
const actionMenuItems = ref<any[]>([])
const mobileActionMenu = ref()

// Search filter
const searchQuery = ref('')

// Pagination state for mobile cards
const currentPage = ref(1)
const rowsPerPage = ref(5)
const rowsPerPageOptions = [5, 10, 20]

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

// Filtered QR codes based on search query (case-insensitive name match)
const filteredQRCodes = computed(() => {
  if (!searchQuery.value.trim()) return qrCodes.value
  const query = searchQuery.value.toLowerCase().trim()
  return qrCodes.value.filter(qr => qr.name.toLowerCase().includes(query))
})

// Reset pagination when search changes
watch(searchQuery, () => {
  currentPage.value = 1
})

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
    viewModalVisible.value = false
    selectedQR.value = null
    viewSelectedQR.value = null
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

let refreshInterval: NodeJS.Timeout | null = null
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

const showViewModal = (qr: QRCodeItem) => {
  viewSelectedQR.value = qr
  viewModalVisible.value = true
}

const toggleActionMenu = (event: Event, qr: QRCodeItem, isMobile = false) => {
  const menuItems = [
    {
      label: 'Update',
      icon: 'pi pi-pencil',
      command: () => editQR(qr)
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => confirmDelete(qr)
    },
    {
      label: 'View',
      icon: 'pi pi-eye',
      command: () => showViewModal(qr)
    }
  ]
  actionMenuItems.value = menuItems
  if (isMobile) {
    mobileActionMenu.value?.toggle(event)
  } else {
    actionMenu.value?.toggle(event)
  }
}

// Pagination helpers for mobile cards (using filtered list)
const paginatedQRCodes = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  const end = start + rowsPerPage.value
  return filteredQRCodes.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredQRCodes.value.length / rowsPerPage.value))

const changePage = (page: number) => {
  currentPage.value = page
}

const getChartData = computed(() => {
  if (!selectedAnalytics.value?.scans_by_day) return []
  return selectedAnalytics.value.scans_by_day.slice().reverse()
})

const getMaxScans = computed(() => {
  const scans = getChartData.value.map(d => d.count)
  return Math.max(...scans, 1)
})

const clearSearch = () => {
  searchQuery.value = ''
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              My QR Codes
            </h1>
            <p class="text-gray-600 mt-1 text-sm sm:text-base">Manage and track your QR codes</p>
          </div>
          <button
            @click="createNew"
            class="w-full sm:w-auto px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <i class="pi pi-plus"></i> Create QR Code
          </button>
        </div>
        
        <!-- Search Bar - Improved UI -->
        <div class="mt-4">
          <div class="relative max-w-md">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3">
              <i class="pi pi-search text-gray-400 text-sm"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name..."
              class="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white shadow-sm"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i class="pi pi-times-circle text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
      </div>

      <!-- Data Display (Desktop Table + Mobile Cards) -->
      <div v-else>
        <!-- DESKTOP TABLE VIEW (visible on sm and up) -->
        <div class="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <DataTable
              :value="filteredQRCodes"
              :paginator="true"
              :rows="rowsPerPage"
              :rowsPerPageOptions="rowsPerPageOptions"
              stripedRows
              tableClass="w-full min-w-[500px]"
              paginatorClass="p-4 border-t border-gray-100 custom-paginator"
            >
              <Column field="created_at" header="Created At" class="text-sm">
                <template #body="{ data }">
                  <span class="text-gray-700 text-xs sm:text-sm">{{ formatDate(data.created_at) }}</span>
                </template>
              </Column>

              <Column header="QR Code" class="text-center">
                <template #body="{ data }">
                  <img :src="data.qrSrc" :alt="data.name" class="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg bg-gray-50 p-1" />
                </template>
              </Column>

              <Column field="name" header="Name" class="text-sm">
                <template #body="{ data }">
                  <div class="flex items-center gap-2">
                    <i :class="[qrTypesMap[data.type]?.icon || 'pi pi-qrcode', getIconColorClass(qrTypesMap[data.type]?.color)]" class="text-xs sm:text-sm"></i>
                    <span class="font-medium text-gray-800 text-sm sm:text-base">{{ data.name }}</span>
                  </div>
                </template>
              </Column>

              <Column header="Actions" class="text-center w-20">
                <template #body="{ data }">
                  <Button
                    icon="pi pi-ellipsis-v"
                    class="p-button-rounded p-button-text p-button-sm action-dots-btn"
                    @click="toggleActionMenu($event, data)"
                    aria-haspopup="true"
                    aria-controls="action_menu"
                  />
                </template>
              </Column>

              <template #empty>
                <div class="text-center py-12">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-search text-2xl text-gray-400"></i>
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">No matching QR codes</h3>
                  <p class="text-gray-600 mb-4">Try a different search term or clear the filter</p>
                  <button
                    @click="clearSearch"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                  >
                    Clear Search
                  </button>
                </div>
              </template>
            </DataTable>
          </div>
        </div>

        <!-- MOBILE CARD VIEW (visible only on small screens) -->
        <div class="block sm:hidden space-y-4">
          <div
            v-for="qr in paginatedQRCodes"
            :key="qr.id"
            class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div class="flex items-center p-4 gap-4 border-b border-gray-100">
              <div class="bg-gray-50 p-2 rounded-lg">
                <img :src="qr.qrSrc" :alt="qr.name" class="w-16 h-16 object-contain" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <i :class="[qrTypesMap[qr.type]?.icon || 'pi pi-qrcode', getIconColorClass(qrTypesMap[qr.type]?.color)]" class="text-sm"></i>
                  <span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                    {{ qrTypesMap[qr.type]?.label || qr.type }}
                  </span>
                </div>
                <h3 class="font-semibold text-gray-900 text-base">{{ qr.name }}</h3>
                <p class="text-xs text-gray-500">{{ formatDate(qr.created_at) }}</p>
              </div>
              <Button
                icon="pi pi-ellipsis-v"
                class="p-button-rounded p-button-text p-button-sm action-dots-btn"
                @click="toggleActionMenu($event, qr, true)"
                aria-haspopup="true"
                aria-controls="mobile_action_menu"
              />
            </div>
            
            <!-- Stats and link row -->
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-chart-line text-gray-400"></i>
                  <span class="text-sm text-gray-600">{{ qr.scan_count || 0 }} scans</span>
                </div>
                <button
                  @click="viewAnalytics(qr)"
                  class="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  View Stats →
                </button>
              </div>
              
              <div class="flex items-center gap-2">
                <input
                  :value="getQRCodeLink(qr)"
                  type="text"
                  readonly
                  class="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate"
                />
                <button
                  @click="copyToClipboard(getQRCodeLink(qr))"
                  class="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <i class="pi pi-copy"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Mobile Pagination -->
          <div v-if="filteredQRCodes.length > 0" class="flex justify-between items-center mt-4 pb-4">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span class="text-sm text-gray-600">Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          
          <div v-if="filteredQRCodes.length === 0 && !isLoading" class="text-center py-12 bg-white rounded-xl">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-search text-2xl text-gray-400"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No matching QR codes</h3>
            <p class="text-gray-600 mb-4">Try a different search term or clear the filter</p>
            <button
              @click="clearSearch"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Clear Search
            </button>
          </div>
        </div>
      </div>

      <!-- Action Menus -->
      <Menu ref="actionMenu" :model="actionMenuItems" popup id="action_menu" />
      <Menu ref="mobileActionMenu" :model="actionMenuItems" popup id="mobile_action_menu" />

      <!-- Delete Confirmation Modal -->
      <div v-if="deleteModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="deleteModalVisible = false">
        <div class="bg-white rounded-xl max-w-sm w-full shadow-2xl animate-fade-in mx-4">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete QR Code?</h3>
            <p class="text-gray-600 text-sm">
              Are you sure you want to delete "{{ selectedQR?.name }}"? This action cannot be undone.
            </p>
          </div>
          <div class="flex gap-3 p-4 border-t border-gray-100">
            <button @click="deleteModalVisible = false" class="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm">
              Cancel
            </button>
            <button @click="handleDelete" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium text-sm">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- View QR Card Modal -->
      <div v-if="viewModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" @click.self="viewModalVisible = false">
        <div class="bg-white rounded-xl w-full max-w-md shadow-2xl animate-fade-in mx-4">
          <div class="relative bg-gray-50 p-4 sm:p-6 flex justify-center border-b border-gray-100">
            <img :src="viewSelectedQR?.qrSrc" alt="QR Code" class="w-32 h-32 sm:w-40 sm:h-40 object-contain" />
            <button @click="viewModalVisible = false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>
          
          <div class="p-4 sm:p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <i :class="[qrTypesMap[viewSelectedQR?.type || 'url']?.icon, getIconColorClass(qrTypesMap[viewSelectedQR?.type || 'url']?.color)]" class="text-sm"></i>
                  <span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                    {{ qrTypesMap[viewSelectedQR?.type || 'url']?.label || viewSelectedQR?.type }}
                  </span>
                </div>
                <h3 class="text-lg sm:text-xl font-bold text-gray-900">{{ viewSelectedQR?.name }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(viewSelectedQR?.created_at || '') }}</p>
              </div>
            </div>
            
            <div class="mt-4 pt-3 border-t border-gray-100">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <i class="pi pi-chart-line text-gray-400"></i>
                  <span class="text-gray-600">{{ viewSelectedQR?.scan_count || 0 }} scans</span>
                </div>
              </div>
            </div>
            
            <div class="mt-3 flex items-center gap-2">
              <input
                :value="getQRCodeLink(viewSelectedQR!)"
                type="text"
                readonly
                class="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate"
              />
              <button
                @click="copyToClipboard(getQRCodeLink(viewSelectedQR!))"
                class="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-100"
              >
                <i class="pi pi-copy"></i>
              </button>
            </div>
          </div>
          
          <div class="p-4 border-t border-gray-100">
            <button
              @click="viewAnalytics(viewSelectedQR!); viewModalVisible = false"
              class="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <i class="pi pi-chart-line"></i> View Analytics
            </button>
          </div>
        </div>
      </div>

      <!-- Analytics Modal -->
      <div v-if="analyticsModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" @click.self="analyticsModalVisible = false">
        <div class="bg-white rounded-xl w-full max-w-4xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-100 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 class="text-base sm:text-lg font-semibold text-gray-900">Analytics: {{ selectedQR?.name }}</h3>
              <p class="text-xs sm:text-sm text-gray-500">Scan statistics and insights (auto-refreshes every 5s)</p>
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
          
          <div v-else-if="selectedAnalytics" class="p-4 sm:p-6">
            <!-- Stats Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div class="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
                <i class="pi pi-eye text-blue-500 text-base sm:text-xl mb-2 block"></i>
                <div class="text-xl sm:text-2xl font-bold text-blue-700">{{ selectedAnalytics.total_scans }}</div>
                <div class="text-xs text-blue-600">Total Scans</div>
              </div>
              <div class="bg-green-50 rounded-lg p-3 sm:p-4 text-center">
                <i class="pi pi-users text-green-500 text-base sm:text-xl mb-2 block"></i>
                <div class="text-xl sm:text-2xl font-bold text-green-700">{{ selectedAnalytics.unique_visitors }}</div>
                <div class="text-xs text-green-600">Unique Visitors</div>
              </div>
              <div class="bg-purple-50 rounded-lg p-3 sm:p-4 text-center">
                <i class="pi pi-globe text-purple-500 text-base sm:text-xl mb-2 block"></i>
                <div class="text-xl sm:text-2xl font-bold text-purple-700">{{ selectedAnalytics.countries }}</div>
                <div class="text-xs text-purple-600">Countries</div>
              </div>
              <div class="bg-orange-50 rounded-lg p-3 sm:p-4 text-center">
                <i class="pi pi-clock text-orange-500 text-base sm:text-xl mb-2 block"></i>
                <div class="text-xs sm:text-sm font-semibold text-orange-700">{{ formatLastScan(selectedAnalytics.last_scan) }}</div>
                <div class="text-xs text-orange-600">Last Scan</div>
              </div>
            </div>
            
            <!-- Scans Over Time Chart -->
            <div v-if="selectedAnalytics.scans_by_day && selectedAnalytics.scans_by_day.length > 0" class="mb-6">
              <h4 class="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Scans Over Time</h4>
              <div class="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div class="flex items-end gap-1 sm:gap-2 h-32">
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
            
            <!-- Recent Scans -->
            <div v-if="selectedAnalytics.recent_scans && selectedAnalytics.recent_scans.length > 0">
              <h4 class="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Recent Scans</h4>
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div
                  v-for="scan in selectedAnalytics.recent_scans"
                  :key="scan.scanned_at"
                  class="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors gap-2"
                >
                  <div class="flex items-center gap-3 flex-1">
                    <i :class="scan.device_type === 'Mobile' ? 'pi pi-mobile' : (scan.device_type === 'Tablet' ? 'pi pi-tablet' : 'pi pi-desktop')" 
                       class="text-gray-500"></i>
                    <div class="flex-1">
                      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p class="font-medium text-gray-700 text-sm">{{ scan.country || 'Unknown' }}</p>
                        <span class="text-xs text-gray-400 hidden sm:inline">•</span>
                        <p class="text-xs text-gray-500">{{ formatDateTime(scan.scanned_at) }}</p>
                      </div>
                      <div class="flex flex-wrap gap-2 mt-1">
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

/* Fix search input focus ring - blue theme */
input[type="text"]:focus {
  outline: none;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
}

/* Desktop table paginator theme (blue gradient) */
:deep(.custom-paginator .p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
  border-color: #2563eb !important;
  color: white !important;
  box-shadow: none !important;
}

:deep(.custom-paginator .p-paginator .p-paginator-pages .p-paginator-page:not(.p-highlight):hover) {
  background: rgba(37, 99, 235, 0.1) !important;
  border-color: #bfdbfe !important;
  color: #2563eb !important;
}

:deep(.custom-paginator .p-paginator .p-paginator-next:hover),
:deep(.custom-paginator .p-paginator .p-paginator-prev:hover),
:deep(.custom-paginator .p-paginator .p-paginator-first:hover),
:deep(.custom-paginator .p-paginator .p-paginator-last:hover) {
  background: rgba(37, 99, 235, 0.1) !important;
  color: #2563eb !important;
}

:deep(.custom-paginator .p-paginator .p-dropdown:hover) {
  border-color: #2563eb !important;
}

:deep(.custom-paginator .p-paginator .p-dropdown .p-dropdown-trigger) {
  color: #4b5563;
}

:deep(.custom-paginator .p-paginator .p-dropdown:hover .p-dropdown-trigger) {
  color: #2563eb;
}

/* Three-dots action button theme */
:deep(.action-dots-btn.p-button.p-button-text) {
  color: #6b7280 !important;
  background: transparent !important;
  transition: all 0.2s;
}

:deep(.action-dots-btn.p-button.p-button-text:hover) {
  color: #2563eb !important;
  background: rgba(37, 99, 235, 0.1) !important;
}

/* Desktop paginator styling */
:deep(.custom-paginator .p-paginator) {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

:deep(.custom-paginator .p-paginator .p-dropdown) {
  border-radius: 0.5rem;
  border-color: #d1d5db;
}

:deep(.custom-paginator .p-paginator .p-dropdown:focus) {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  border-color: #2563eb;
}

:deep(.custom-paginator .p-paginator .p-paginator-page) {
  min-width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

@media (min-width: 640px) {
  :deep(.custom-paginator .p-paginator .p-paginator-page) {
    min-width: 2.5rem;
    height: 2.5rem;
  }
}

:deep(.custom-paginator .p-paginator .p-paginator-next),
:deep(.custom-paginator .p-paginator .p-paginator-prev),
:deep(.custom-paginator .p-paginator .p-paginator-first),
:deep(.custom-paginator .p-paginator .p-paginator-last) {
  min-width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

@media (min-width: 640px) {
  :deep(.custom-paginator .p-paginator .p-paginator-next),
  :deep(.custom-paginator .p-paginator .p-paginator-prev),
  :deep(.custom-paginator .p-paginator .p-paginator-first),
  :deep(.custom-paginator .p-paginator .p-paginator-last) {
    min-width: 2.5rem;
    height: 2.5rem;
  }
}

/* Menu popup theme */
:deep(.p-menu .p-menuitem-link:hover) {
  background: rgba(37, 99, 235, 0.1);
}

:deep(.p-menu .p-menuitem-link .p-menuitem-icon) {
  color: #4b5563;
}

:deep(.p-menu .p-menuitem-link:hover .p-menuitem-icon) {
  color: #2563eb;
}
</style>