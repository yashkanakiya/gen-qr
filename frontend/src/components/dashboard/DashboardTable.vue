<template>
  <div>
    <!-- Desktop Table -->
    <div
      class="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <!-- Skeleton Loading Table -->
      <div v-if="loading" class="overflow-x-auto">
        <table class="w-full min-w-[500px]">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th class="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                QR Code
              </th>
              <th class="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th class="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="i in rowsPerPage || 5" :key="i" class="animate-pulse">
              <td class="p-3"><Skeleton width="6rem" height="1.5rem" /></td>
              <td class="p-3">
                <Skeleton shape="circle" size="2.5rem" />
              </td>
              <td class="p-3"><Skeleton width="5rem" height="1.5rem" /></td>
              <td class="p-3"><Skeleton width="2rem" height="2rem" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Actual DataTable -->
      <DataTable
        v-else
        :value="qrCodes"
        :paginator="true"
        :rows="rowsPerPage"
        :rowsPerPageOptions="rowsPerPageOptions"
        stripedRows
        tableClass="w-full min-w-[500px]"
        paginatorClass="p-4 border-t border-gray-100"
      >
        <!-- Name column: large width, left aligned -->
        <Column field="name" header="Name" style="width: 50%; min-width: 150px" class="text-sm">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i
                :class="[
                  qrTypesMap?.[data.type]?.icon || 'pi pi-qrcode',
                  getIconColorClass(qrTypesMap?.[data.type]?.color),
                ]"
                class="text-xs sm:text-sm"
              ></i>
              <span class="font-medium text-gray-800 text-sm sm:text-base">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <!-- QR Code column: left aligned, narrower -->
        <Column header="QR Code" style="width: 20%; min-width: 60px" class="text-sm">
          <template #body="{ data }">
            <img
              :src="data.qrSrc"
              :alt="data.name"
              class="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg bg-gray-50 p-1"
            />
          </template>
        </Column>

        <!-- Created At column: left aligned -->
        <Column
          field="created_at"
          header="Created At"
          style="width: 20%; min-width: 80px"
          class="text-sm"
        >
          <template #body="{ data }">
            <span class="text-gray-700 text-xs sm:text-sm">{{ formatDate(data.created_at) }}</span>
          </template>
        </Column>

        <!-- Actions column: left aligned -->
        <Column header="Actions" style="width: 10%; min-width: 50px" class="text-sm">
          <template #body="{ data }">
            <Button
              icon="pi pi-ellipsis-v"
              class="p-button-rounded p-button-text p-button-sm"
              @click="$emit('toggleAction', $event, data)"
              aria-haspopup="true"
              aria-controls="action_menu"
            />
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-12">
            <div
              class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="pi pi-search text-2xl text-gray-400"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No matching QR codes</h3>
            <p class="text-gray-600 mb-4">Try a different search term or clear the filter</p>
            <button
              @click="$emit('clearSearch')"
              class="px-4 py-2 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:bg-blue-700 transition-all cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Mobile Cards (unchanged) -->
    <div class="block sm:hidden space-y-4">
      <!-- Skeleton cards -->
      <div
        v-if="loading"
        v-for="i in 3"
        :key="i"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse"
      >
        <div class="flex items-center gap-4">
          <Skeleton shape="circle" size="4rem" />
          <div class="flex-1">
            <Skeleton width="6rem" height="1.2rem" class="mb-2" />
            <Skeleton width="10rem" height="1rem" />
          </div>
          <Skeleton width="2rem" height="2rem" />
        </div>
        <div class="mt-3 space-y-2">
          <Skeleton width="100%" height="1.5rem" />
          <Skeleton width="100%" height="2rem" />
        </div>
      </div>

      <!-- Actual cards -->
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
              <i
                :class="[
                  qrTypesMap?.[qr.type]?.icon || 'pi pi-qrcode',
                  getIconColorClass(qrTypesMap?.[qr.type]?.color),
                ]"
                class="text-sm"
              ></i>
              <span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                {{ qrTypesMap?.[qr.type]?.label || qr.type }}
              </span>
            </div>
            <h3 class="font-semibold text-gray-900 text-base">{{ qr.name }}</h3>
            <p class="text-xs text-gray-500">{{ formatDate(qr.created_at) }}</p>
          </div>
          <Button
            icon="pi pi-ellipsis-v"
            class="p-button-rounded p-button-text p-button-sm"
            @click="$emit('toggleAction', $event, qr, true)"
            aria-haspopup="true"
            aria-controls="mobile_action_menu"
          />
        </div>

        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-line text-gray-400"></i>
              <span class="text-sm text-gray-600">{{ qr.scan_count || 0 }} scans</span>
            </div>
            <button
              @click="$emit('viewAnalytics', qr)"
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
              @click="$emit('copy', getQRCodeLink(qr))"
              class="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-100"
            >
              <i class="pi pi-copy"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Pagination -->
      <div
        v-if="!loading && filteredQRCodes.length > 0"
        class="flex justify-between items-center mt-4 pb-4"
      >
        <button
          @click="$emit('pageChange', currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <span class="text-sm text-gray-600">Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          @click="$emit('pageChange', currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>

      <div
        v-if="!loading && filteredQRCodes.length === 0"
        class="text-center py-12 bg-white rounded-xl"
      >
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <i class="pi pi-search text-2xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No matching QR codes</h3>
        <p class="text-gray-600 mb-4">Try a different search term or clear the filter</p>
        <button
          @click="$emit('clearSearch')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
        >
          Clear Search
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import type { QRCodeItem } from '../../stores/qrStore'
import { getRedirectUrl } from '../../stores/qrStore'

// Props
const props = withDefaults(
  defineProps<{
    qrCodes?: QRCodeItem[]
    loading?: boolean
    rowsPerPage?: number
    rowsPerPageOptions?: number[]
    currentPage?: number
    qrTypesMap?: Record<string, { label: string; icon: string; color: string }>
    getIconColorClass?: (color: string | undefined) => string
    formatDate?: (dateStr: string) => string
  }>(),
  {
    qrCodes: () => [],
    loading: false,
    rowsPerPage: 10,
    rowsPerPageOptions: () => [10, 20],
    currentPage: 1,
    qrTypesMap: () => ({}),
    getIconColorClass: () => '',
    formatDate: () => '',
  },
)

// Emits
const emit = defineEmits<{
  (e: 'toggleAction', event: Event, qr: QRCodeItem, isMobile?: boolean): void
  (e: 'viewAnalytics', qr: QRCodeItem): void
  (e: 'copy', text: string): void
  (e: 'clearSearch'): void
  (e: 'pageChange', page: number): void
}>()

// Computed for mobile pagination
const filteredQRCodes = computed(() => props.qrCodes || [])
const totalPages = computed(() =>
  Math.ceil(filteredQRCodes.value.length / (props.rowsPerPage || 10)),
)
const paginatedQRCodes = computed(() => {
  const start = ((props.currentPage || 1) - 1) * (props.rowsPerPage || 10)
  const end = start + (props.rowsPerPage || 10)
  return filteredQRCodes.value.slice(start, end)
})

// Helper
const getQRCodeLink = (qr: QRCodeItem) => getRedirectUrl(qr.slug)
</script>
