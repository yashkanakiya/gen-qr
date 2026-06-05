<!-- CreateQR.vue -->
<template>
  <div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <i class="pi pi-plus text-white text-2xl"></i>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Create New QR Code
        </h1>
        <p class="text-gray-600 mt-2">Generate and customize your QR code</p>
      </div>
      
      <!-- Form Fields -->
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            QR Name <span class="text-red-500">*</span>
          </label>
          <InputText 
            type="text" 
            v-model="form.name" 
            placeholder="e.g., My Portfolio, Business Card, etc."
            class="w-full"
            :class="{ 'border-red-300': submitted && !form.name }"
          />
          <p class="text-xs text-gray-500 mt-1">Give your QR code a memorable name</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Destination URL <span class="text-red-500">*</span>
          </label>
          <InputText 
            type="url" 
            v-model="form.url" 
            placeholder="https://example.com"
            class="w-full"
            :class="{ 'border-red-300': submitted && !form.url }"
          />
          <p class="text-xs text-gray-500 mt-1">Enter the full URL including https://</p>
        </div>

        <!-- Size Selection -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            QR Code Size
          </label>
          <div class="grid grid-cols-3 gap-3">
            <button 
              v-for="size in sizes" 
              :key="size.value"
              @click="selectedSize = size.value"
              class="px-4 py-2 rounded-lg border-2 transition-all"
              :class="selectedSize === size.value 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'"
            >
              {{ size.label }}
            </button>
          </div>
        </div>

        <!-- Error Correction Level -->
        <!-- <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Error Correction Level
          </label>
          <div class="grid grid-cols-4 gap-2">
            <button 
              v-for="level in errorLevels" 
              :key="level.value"
              @click="selectedErrorLevel = level.value"
              class="px-2 py-2 rounded-lg border-2 transition-all text-sm"
              :class="selectedErrorLevel === level.value 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'"
            >
              {{ level.label }}
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">Higher level = better recovery but denser code</p>
        </div> -->

        <!-- Generate Button -->
        <Button 
          label="Generate QR Code" 
          @click="generateQR"
          :disabled="!form.url || !form.name || isLoading"
          class="w-full !py-3 text-base"
          :class="(!form.url || !form.name || isLoading) ? 'opacity-50 cursor-not-allowed' : ''"
        />
      </div>

      <!-- Generated QR Section -->
      <div v-if="qrSrc" class="mt-8 pt-6 border-t-2 border-gray-100">
        <div class="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6">
          <div class="text-center mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Your QR Code is Ready!</h3>
            <p class="text-sm text-gray-600">{{ form.name }}</p>
          </div>

          <!-- QR Preview -->
          <div class="flex justify-center mb-6">
            <div class="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <img
                ref="qrImage"
                :src="qrSrc"
                :alt="form.name"
                class="w-48 h-48 object-contain"
              />
            </div>
          </div>

          <!-- URL Display -->
          <div class="bg-gray-100 rounded-lg p-3 mb-6">
            <p class="text-xs text-gray-500 mb-1">Encoded URL:</p>
            <p class="text-sm text-blue-600 break-all">{{ form.url }}</p>
          </div>

          <!-- Download Options -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">
              Download Options
            </label>
            <div class="grid grid-cols-3 gap-3">
              <Button label="PNG" severity="info" @click="downloadQR('png')" outlined />
              <Button label="JPG" severity="info" @click="downloadQR('jpg')" outlined />
              <Button label="SVG" severity="info" @click="downloadQR('svg')" outlined />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-3">
            <Button 
              label="💾 Save to Dashboard" 
              severity="success" 
              @click="openSaveModal"
              class="w-full"
            />
            <Button 
              label="Create Another" 
              severity="secondary" 
              @click="resetForm"
              outlined
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Save Confirmation Modal -->
    <Dialog 
      v-model:visible="saveModalVisible" 
      modal 
      header="Save to Dashboard"
      class="w-full max-w-sm"
    >
      <div class="text-center p-4">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-save text-green-600 text-2xl"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Save QR Code?</h3>
        <p class="text-gray-600">
          Do you want to save "{{ form.name }}" to your dashboard?
        </p>
        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
          <img :src="qrSrc" class="w-16 h-16 mx-auto" />
          <p class="text-xs text-gray-500 mt-2">{{ form.url }}</p>
        </div>
      </div>
      
      <template #footer>
        <div class="flex gap-3">
          <Button label="Cancel" severity="secondary" @click="saveModalVisible = false" class="flex-1" />
          <Button label="Save Now" severity="success" @click="saveToDashboard" class="flex-1" />
        </div>
      </template>
    </Dialog>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 flex flex-col items-center">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-3"></i>
        <p class="text-gray-700">Generating QR Code...</p>
      </div>
    </div>

    <!-- Toast -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { saveQRCode } from '../stores/qrStore'
import QRCode from 'qrcode'

const router = useRouter()
const toast = useToast()
const qrImage = ref(null)
const saveModalVisible = ref(false)
const submitted = ref(false)
const isLoading = ref(false)

const sizes = [
  { label: 'Small', value: 200 },
  { label: 'Medium', value: 500 },
  { label: 'Large', value: 1000 }
]

// const errorLevels = [
//   { label: 'L (7%)', value: 'L' },
//   { label: 'M (15%)', value: 'M' },
//   { label: 'Q (25%)', value: 'Q' },
//   { label: 'H (30%)', value: 'H' }
// ]

const form = reactive({
  name: '',
  url: '',
})

const selectedSize = ref(500)
// const selectedErrorLevel = ref('M')
const qrSrc = ref('')

async function generateQR() {
  submitted.value = true
  
  // Validate QR Name (at least 3 alphanumeric characters, no whitespace)
  const nameRegex = /^[a-zA-Z0-9]{3,}$/
  if (!form.name || !nameRegex.test(form.name)) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'QR Name must contain at least 3 alphanumeric characters (no spaces or special characters)',
      life: 4000
    })
    return
  }
  
  // Validate URL (must start with http:// or https://, then anything)
  const urlRegex = /^(https?:\/\/).+$/
  if (!form.url || !urlRegex.test(form.url)) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'URL must start with http:// or https:// followed by valid address',
      life: 4000
    })
    return
  }
  
  isLoading.value = true
  
  try {
    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(form.url, {
      width: selectedSize.value,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      // errorCorrectionLevel: selectedErrorLevel.value
    })
    
    qrSrc.value = qrDataURL
    
    toast.add({
      severity: 'success',
      summary: 'QR Generated',
      detail: 'Your QR code has been generated successfully',
      life: 3000
    })
  } catch (error) {
    console.error('QR Generation Error:', error)
    toast.add({
      severity: 'error',
      summary: 'Generation Failed',
      detail: 'Failed to generate QR code. Please check your URL and try again.',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

function openSaveModal() {
  if (!qrSrc.value) return
  saveModalVisible.value = true
}

function saveToDashboard() {
  saveQRCode({ 
    name: form.name, 
    url: form.url, 
    qrSrc: qrSrc.value 
  })
  
  saveModalVisible.value = false
  toast.add({
    severity: 'success',
    summary: 'Saved!',
    detail: 'QR code saved to dashboard',
    life: 3000
  })
  
  setTimeout(() => {
    router.push('/dashboard')
  }, 1500)
}

async function downloadQR(format) {
  if (!qrSrc.value) return
  
  isLoading.value = true
  const filename = `${form.name.replace(/[^a-z0-9]/gi, '_') || 'qrcode'}.${format}`
  
  try {
    if (format === 'svg') {
      // Generate SVG directly
      const svgString = await QRCode.toString(form.url, {
        type: 'svg',
        width: selectedSize.value,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        // errorCorrectionLevel: selectedErrorLevel.value
      })
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } else {
      // For PNG/JPG, create canvas and download
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, form.url, {
        width: selectedSize.value,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        // errorCorrectionLevel: selectedErrorLevel.value
      })
      
      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png')
      link.click()
    }
    
    toast.add({
      severity: 'info',
      summary: 'Download Started',
      detail: `Downloading ${filename}`,
      life: 2000
    })
  } catch (error) {
    console.error('Download Error:', error)
    toast.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: 'Failed to download QR code',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.url = ''
  qrSrc.value = ''
  selectedSize.value = 500
  // selectedErrorLevel.value = 'M'
  submitted.value = false
}
</script>