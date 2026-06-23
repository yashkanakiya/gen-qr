<script lang="ts" setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Menu from 'primevue/menu'
import Skeleton from 'primevue/skeleton'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import {
  qrCodes,
  loadQRCodes,
  deleteQRCode,
  getQRCodeAnalytics,
  getRedirectUrl,
  type QRCodeItem,
  type ScanAnalytics,
} from '../stores/qrStore'
import DashboardStats from '../components/dashboard/DashboardStats.vue'
import DashboardFilter from '../components/dashboard/DashboardFilter.vue'
import DashboardTable from '../components/dashboard/DashboardTable.vue'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const router = useRouter()
const toast = useToast()
const isLoading = ref(true)
const deleteModalVisible = ref(false)
const analyticsModalVisible = ref(false)
const viewModalVisible = ref(false)
const downloadModalVisible = ref(false)
const downloadQRSize = ref(500)
const selectedQR = ref<QRCodeItem | null>(null)
const viewSelectedQR = ref<QRCodeItem | null>(null)
const selectedAnalytics = ref<ScanAnalytics | null>(null)
const analyticsLoading = ref(false)
const actionMenu = ref()
const actionMenuItems = ref<any[]>([])
const mobileActionMenu = ref()
const downloadLoading = ref(false)

const searchQuery = ref('')
const currentPage = ref(1)
const rowsPerPage = ref(5)
const rowsPerPageOptions = [5, 10, 20]

// QR type mapping
const qrTypesMap: Record<string, { label: string; icon: string; color: string }> = {
  url: { label: 'URL', icon: 'pi pi-globe', color: 'blue' },
  text: { label: 'Text', icon: 'pi pi-file', color: 'gray' },
  email: { label: 'Email', icon: 'pi pi-envelope', color: 'green' },
  phone: { label: 'Phone', icon: 'pi pi-phone', color: 'purple' },
  sms: { label: 'SMS', icon: 'pi pi-comment', color: 'orange' },
  wifi: { label: 'WiFi', icon: 'pi pi-wifi', color: 'indigo' },
  location: { label: 'Location', icon: 'pi pi-map-marker', color: 'red' },
}

// ----- Helpers (all logic is here, template is clean) -----
const getIconColorClass = (color: string | undefined): string => {
  switch (color) {
    case 'blue':
      return 'text-blue-500'
    case 'gray':
      return 'text-gray-500'
    case 'green':
      return 'text-green-500'
    case 'purple':
      return 'text-purple-500'
    case 'orange':
      return 'text-orange-500'
    case 'indigo':
      return 'text-indigo-500'
    case 'red':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

// Returns combined icon + color class for a QR item
const getIconClass = (qr: QRCodeItem | null): string => {
  if (!qr) return 'pi pi-qrcode text-gray-500'
  const type = qr.type || 'url'
  const icon = qrTypesMap[type]?.icon || 'pi pi-qrcode'
  const colorClass = getIconColorClass(qrTypesMap[type]?.color)
  return `${icon} ${colorClass}`
}

// Returns device icon class for analytics scan
const getDeviceIconClass = (scan: any): string => {
  if (scan.device_type === 'Mobile') return 'pi pi-mobile'
  if (scan.device_type === 'Tablet') return 'pi pi-tablet'
  return 'pi pi-desktop'
}

// Returns class string for size selection button
const getSizeButtonClass = (sizeValue: number): string => {
  return downloadQRSize.value === sizeValue
    ? 'border-blue-500 bg-blue-50 text-blue-700'
    : 'border-gray-200 hover:border-blue-300'
}

// ----- Safe getters for view modal -----
const viewQRName = computed(() => viewSelectedQR.value?.name || 'Unnamed QR')
const viewQRSrc = computed(() => viewSelectedQR.value?.qrSrc || '')
const viewQRTypeLabel = computed(() => {
  const type = viewSelectedQR.value?.type || 'url'
  return qrTypesMap[type]?.label || type
})
const viewQRScanCount = computed(() => viewSelectedQR.value?.scan_count || 0)
const viewQRCreatedAt = computed(() => viewSelectedQR.value?.created_at || '')
const viewQRTypeIconClass = computed(() => getIconClass(viewSelectedQR.value))
const viewQRType = computed(() => viewSelectedQR.value?.type || 'url')

// ----- Safe getters for download modal -----
const downloadQRName = computed(() => viewSelectedQR.value?.name || 'Unnamed QR')
const downloadQRSrc = computed(() => viewSelectedQR.value?.qrSrc || '')

// ----- Safe getter for analytics modal -----
const selectedQRName = computed(() => selectedQR.value?.name || 'Unnamed QR')

// ----- Date helpers -----
const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatLastScan = (dateStr: string | null): string => {
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

// ----- Other helpers -----
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      severity: 'success',
      summary: 'Copied!',
      detail: 'Link copied to clipboard',
      life: 2000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed',
      detail: 'Could not copy to clipboard',
      life: 2000,
    })
  }
}

const getQRCodeLink = (qr: QRCodeItem) => getRedirectUrl(qr.slug)

// ----- Data loading -----
const loadData = async () => {
  isLoading.value = true
  try {
    await loadQRCodes()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load QR codes',
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}

// ----- Computed stats -----
const totalQr = computed(() => qrCodes.value.length)
const totalScans = computed(() => qrCodes.value.reduce((sum, qr) => sum + (qr.scan_count || 0), 0))
const lastCreated = computed(() => {
  if (qrCodes.value.length === 0) return 'None'
  const sorted = [...qrCodes.value].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  return formatDate(sorted[0]?.created_at || '')
})
const typesCount = computed(() => {
  const types = new Set(qrCodes.value.map((qr) => qr.type))
  return types.size
})

// Filtered QR codes
const filteredQRCodes = computed(() => {
  if (!searchQuery.value.trim()) return qrCodes.value
  const query = searchQuery.value.toLowerCase().trim()
  return qrCodes.value.filter((qr) => qr.name.toLowerCase().includes(query))
})

watch(searchQuery, () => {
  currentPage.value = 1
})

// ----- Actions -----
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
      life: 3000,
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
      life: 3000,
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
      life: 3000,
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
      life: 2000,
    })
  } catch (error) {
    console.error('Refresh error:', error)
  }
}

let analyticsRefreshInterval: NodeJS.Timeout | null = null
watch(analyticsModalVisible, (isVisible) => {
  if (isVisible) {
    analyticsRefreshInterval = setInterval(() => {
      if (selectedQR.value && analyticsModalVisible.value) {
        getQRCodeAnalytics(selectedQR.value.id)
          .then((data) => {
            selectedAnalytics.value = data
          })
          .catch((error) => {
            console.error('Auto-refresh error:', error)
          })
      }
    }, 5000)
  } else {
    if (analyticsRefreshInterval) {
      clearInterval(analyticsRefreshInterval)
      analyticsRefreshInterval = null
    }
  }
})

const editQR = (qr: QRCodeItem) => {
  router.push(`/edit-qr/${qr.id}`)
}

const showViewModal = (qr: QRCodeItem) => {
  viewSelectedQR.value = qr
  viewModalVisible.value = true
}

const openDownloadModal = () => {
  downloadModalVisible.value = true
}

const toggleActionMenu = (event: Event, qr: QRCodeItem, isMobile = false) => {
  const items = [
    {
      label: 'View',
      icon: 'pi pi-eye',
      command: () => showViewModal(qr),
    },
    {
      label: 'Update',
      icon: 'pi pi-pencil',
      command: () => editQR(qr),
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => confirmDelete(qr),
    },
  ]
  actionMenuItems.value = items
  if (isMobile) {
    mobileActionMenu.value?.toggle(event)
  } else {
    actionMenu.value?.toggle(event)
  }
}

const changePage = (page: number) => {
  currentPage.value = page
}
const clearSearch = () => {
  searchQuery.value = ''
}

// ----- Download QR -----
async function downloadQR(format: 'png' | 'jpg' | 'svg') {
  if (!viewSelectedQR.value || !viewSelectedQR.value.qrSrc) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No QR code to download',
      life: 3000,
    })
    return
  }

  downloadLoading.value = true
  const filename = `${viewSelectedQR.value.name.replace(/[^a-z0-9]/gi, '_') || 'qrcode'}.${format}`

  try {
    if (format === 'png' || format === 'jpg') {
      const link = document.createElement('a')
      link.download = filename
      if (format === 'png') {
        link.href = viewSelectedQR.value.qrSrc
      } else {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = downloadQRSize.value
          canvas.height = downloadQRSize.value
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            link.href = canvas.toDataURL('image/jpeg', 0.92)
            link.click()
          }
        }
        img.src = viewSelectedQR.value!.qrSrc
        if (img.complete) {
          img.onload?.(new Event('load'))
        }
        downloadLoading.value = false
        toast.add({
          severity: 'info',
          summary: 'Download Started',
          detail: `Downloading ${filename}`,
          life: 2000,
        })
        return
      }
      link.click()
    } else if (format === 'svg') {
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${downloadQRSize.value}" height="${downloadQRSize.value}" viewBox="0 0 ${downloadQRSize.value} ${downloadQRSize.value}">
          <rect width="100%" height="100%" fill="white"/>
          <image href="${viewSelectedQR.value.qrSrc}" x="0" y="0" width="${downloadQRSize.value}" height="${downloadQRSize.value}"/>
        </svg>
      `
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    }

    toast.add({
      severity: 'info',
      summary: 'Download Started',
      detail: `Downloading ${filename}`,
      life: 2000,
    })
  } catch (error) {
    console.error('Download error:', error)
    toast.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: 'Failed to download QR code',
      life: 3000,
    })
  } finally {
    downloadLoading.value = false
  }
}

// ----- Chart data -----
const getChartData = computed(() => {
  if (!selectedAnalytics.value?.scans_by_day) return []
  const days = selectedAnalytics.value.scans_by_day
  if (!Array.isArray(days)) return []
  return days.slice().reverse()
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.parsed.y} scans`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 },
    },
  },
}))

const chartData = computed(() => {
  const days = getChartData.value.slice(-7)
  return {
    labels: days.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ),
    datasets: [
      {
        data: days.map((d) => d.count),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
})

// Lifecycle
onMounted(() => {
  loadData()
})
onBeforeUnmount(() => {
  if (analyticsRefreshInterval) {
    clearInterval(analyticsRefreshInterval)
    analyticsRefreshInterval = null
  }
})
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div v-if="isLoading">
              <Skeleton width="12rem" height="2rem" class="mb-1" />
              <Skeleton width="16rem" height="1.5rem" />
            </div>
            <template v-else>
              <h1
                class="text-2xl sm:text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
              >
                My QR Codes
              </h1>
              <p class="text-gray-600 mt-1 text-sm sm:text-base">Manage and track your QR codes</p>
            </template>
          </div>
        </div>
        <div class="mt-4">
          <DashboardFilter v-model="searchQuery" :loading="isLoading" @clear="clearSearch" />
        </div>
      </div>

      <!-- Stats Cards -->
      <DashboardStats
        :total-qr="totalQr"
        :total-scans="totalScans"
        :last-created="lastCreated"
        :types-count="typesCount"
        :loading="isLoading"
      />

      <!-- Table -->
      <DashboardTable
        :qr-codes="filteredQRCodes"
        :loading="isLoading"
        :rows-per-page="rowsPerPage"
        :rows-per-page-options="rowsPerPageOptions"
        :current-page="currentPage"
        :qr-types-map="qrTypesMap"
        :get-icon-color-class="getIconColorClass"
        :format-date="formatDate"
        @toggle-action="toggleActionMenu"
        @view-analytics="viewAnalytics"
        @copy="copyToClipboard"
        @clear-search="clearSearch"
        @page-change="changePage"
      />

      <!-- Action Menus -->
      <Menu ref="actionMenu" :model="actionMenuItems" popup id="action_menu" />
      <Menu ref="mobileActionMenu" :model="actionMenuItems" popup id="mobile_action_menu" />

      <!-- Delete Modal -->
      <div
        v-if="deleteModalVisible"
        class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="deleteModalVisible = false"
      >
        <div class="bg-white rounded-xl max-w-sm w-full shadow-2xl animate-fade-in mx-4">
          <div class="text-center p-6">
            <div
              class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="pi pi-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete QR Code?</h3>
            <p class="text-gray-600 text-sm">
              Are you sure you want to delete "{{ selectedQR?.name }}"? This action cannot be
              undone.
            </p>
          </div>
          <div class="flex gap-3 p-4 border-t border-gray-100">
            <button
              @click="deleteModalVisible = false"
              class="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              @click="handleDelete"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium text-sm cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- View QR Modal -->
      <div
        v-if="viewModalVisible"
        class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
        @click.self="viewModalVisible = false"
      >
        <div class="bg-white rounded-xl w-full max-w-md shadow-2xl animate-fade-in mx-4">
          <div class="relative bg-gray-50 p-4 sm:p-6 flex justify-center border-b border-gray-100">
            <img :src="viewQRSrc" alt="QR Code" class="w-32 h-32 sm:w-40 sm:h-40 object-contain" />
            <button
              @click="viewModalVisible = false"
              class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>
          <div class="p-4 sm:p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <i :class="viewQRTypeIconClass" class="text-sm"></i>
                  <span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                    {{ viewQRTypeLabel }}
                  </span>
                </div>
                <h3 class="text-lg sm:text-xl font-bold text-gray-900">{{ viewQRName }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(viewQRCreatedAt) }}</p>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <i class="pi pi-chart-line text-gray-400"></i>
                  <span class="text-gray-600">{{ viewQRScanCount }} scans</span>
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
                class="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <i class="pi pi-copy"></i>
              </button>
            </div>
          </div>
          <div class="p-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
            <button
              @click="(viewAnalytics(viewSelectedQR!), (viewModalVisible = false))"
              class="flex-1 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <i class="pi pi-chart-line"></i> View Analytics
            </button>
            <button
              @click="openDownloadModal"
              class="flex-1 py-3 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <i class="pi pi-download"></i> Download QR
            </button>
          </div>
        </div>
      </div>

      <!-- Download Modal -->
      <div
        v-if="downloadModalVisible"
        class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="downloadModalVisible = false"
      >
        <div class="bg-white rounded-xl max-w-sm w-full shadow-2xl animate-fade-in mx-4">
          <div class="relative p-6 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900 text-center">Download QR Code</h3>
            <button
              @click="downloadModalVisible = false"
              class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>
          <div class="p-6">
            <div class="flex justify-center mb-4">
              <div class="bg-white p-4 rounded-xl shadow-md border border-gray-200">
                <img :src="downloadQRSrc" :alt="downloadQRName" class="w-32 h-32 object-contain" />
              </div>
            </div>
            <p class="text-center text-sm text-gray-600 mb-4">{{ downloadQRName }}</p>
            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 mb-2">QR Code Size</label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="size in [
                    { label: 'Small', value: 200, dimensions: '200×200' },
                    { label: 'Medium', value: 500, dimensions: '500×500' },
                    { label: 'Large', value: 1000, dimensions: '1000×1000' },
                  ]"
                  :key="size.value"
                  @click="downloadQRSize = size.value"
                  class="flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all cursor-pointer"
                  :class="getSizeButtonClass(size.value)"
                >
                  <span>{{ size.label }}</span>
                  <span class="text-xs text-gray-500 mt-0.5">{{ size.dimensions }}</span>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Download Format</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="downloadQR('png')"
                  :disabled="downloadLoading"
                  class="px-3 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <i class="pi pi-image mr-1"></i> PNG
                </button>
                <button
                  @click="downloadQR('jpg')"
                  :disabled="downloadLoading"
                  class="px-3 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <i class="pi pi-image mr-1"></i> JPG
                </button>
                <button
                  @click="downloadQR('svg')"
                  :disabled="downloadLoading"
                  class="px-3 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <i class="pi pi-file mr-1"></i> SVG
                </button>
              </div>
            </div>
          </div>
          <div class="p-4 border-t border-gray-100">
            <button
              @click="downloadModalVisible = false"
              class="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Analytics Modal -->
      <div
        v-if="analyticsModalVisible"
        class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
        @click.self="analyticsModalVisible = false"
      >
        <div
          class="bg-white rounded-xl w-full max-w-4xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
        >
          <div
            class="sticky top-0 bg-white border-b border-gray-100 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
          >
            <div>
              <h3 class="text-base sm:text-lg font-semibold text-gray-900">
                Analytics: {{ selectedQRName }}
              </h3>
              <p class="text-xs sm:text-sm text-gray-500">
                Scan statistics and insights (auto-refreshes every 5s)
              </p>
            </div>
            <div class="flex gap-2">
              <button
                @click="refreshAnalytics"
                class="text-blue-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50 cursor-pointer"
                title="Refresh now"
              >
                <i class="pi pi-refresh"></i>
              </button>
              <button
                @click="analyticsModalVisible = false"
                class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <i class="pi pi-times text-xl"></i>
              </button>
            </div>
          </div>
          <div v-if="analyticsLoading" class="flex justify-center items-center py-20">
            <i class="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
          </div>
          <div v-else-if="selectedAnalytics" class="p-4 sm:p-6">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div class="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
                <i class="pi pi-eye text-blue-500 text-base sm:text-xl mb-2 block"></i>
                <div class="text-xl sm:text-2xl font-bold text-blue-700">
                  {{ selectedAnalytics.total_scans }}
                </div>
                <div class="text-xs text-blue-600">Total Scans</div>
              </div>
              <div class="bg-green-50 rounded-lg p-3 sm:p-4 text-center">
                <i class="pi pi-users text-green-500 text-base sm:text-xl mb-2 block"></i>
                <div class="text-xl sm:text-2xl font-bold text-green-700">
                  {{ selectedAnalytics.unique_visitors }}
                </div>
                <div class="text-xs text-green-600">Unique Visitors</div>
              </div>
              <div class="bg-purple-50 rounded-lg p-3 sm:p-4 text-center">
                <i class="pi pi-globe text-purple-500 text-base sm:text-xl mb-2 block"></i>
                <div class="text-xl sm:text-2xl font-bold text-purple-700">
                  {{ selectedAnalytics.countries }}
                </div>
                <div class="text-xs text-purple-600">Countries</div>
              </div>
              <div class="bg-orange-50 rounded-lg p-3 sm:p-4 text-center">
                <i class="pi pi-clock text-orange-500 text-base sm:text-xl mb-2 block"></i>
                <div class="text-xs sm:text-sm font-semibold text-orange-700">
                  {{ formatLastScan(selectedAnalytics.last_scan) }}
                </div>
                <div class="text-xs text-orange-600">Last Scan</div>
              </div>
            </div>

            <div
              v-if="selectedAnalytics.scans_by_day && selectedAnalytics.scans_by_day.length > 0"
              class="mb-6"
            >
              <h4 class="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Scans Over Time</h4>
              <div class="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div class="h-48">
                  <Bar :data="chartData" :options="chartOptions" />
                </div>
              </div>
            </div>

            <div v-if="selectedAnalytics.recent_scans && selectedAnalytics.recent_scans.length > 0">
              <h4 class="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Recent Scans</h4>
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div
                  v-for="scan in selectedAnalytics.recent_scans"
                  :key="scan.scanned_at"
                  class="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors gap-2"
                >
                  <div class="flex items-center gap-3 flex-1">
                    <i :class="getDeviceIconClass(scan)" class="text-gray-500"></i>
                    <div class="flex-1">
                      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p class="font-medium text-gray-700 text-sm">
                          {{ scan.country || 'Unknown' }}
                        </p>
                        <span class="text-xs text-gray-400 hidden sm:inline">•</span>
                        <p class="text-xs text-gray-500">{{ formatDateTime(scan.scanned_at) }}</p>
                      </div>
                      <div class="flex flex-wrap gap-2 mt-1">
                        <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{{
                          scan.device_type || 'Unknown'
                        }}</span>
                        <span class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">{{
                          scan.browser || 'Unknown'
                        }}</span>
                        <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">{{
                          scan.os || 'Unknown'
                        }}</span>
                      </div>
                    </div>
                  </div>
                  <i class="pi pi-info-circle text-gray-400" :title="'IP: ' + scan.ip"></i>
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
</style>
