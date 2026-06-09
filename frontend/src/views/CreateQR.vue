<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { saveQRCode } from '../stores/qrStore'
import QRCode from 'qrcode'

interface FormData {
  name: string
  url: string
}

interface ValidationErrors {
  name: string
  url: string
}

interface SizeOption {
  label: string
  value: number
}

interface SavedQRCode {
  name: string
  url: string
}

const router = useRouter()
const toast = useToast()
const qrImage = ref<HTMLElement | null>(null)
const saveModalVisible = ref<boolean>(false)
const isLoading = ref<boolean>(false)

// Validation errors
const validationErrors = ref<ValidationErrors>({
  name: '',
  url: ''
})

const sizes: SizeOption[] = [
  { label: 'Small', value: 200 },
  { label: 'Medium', value: 500 },
  { label: 'Large', value: 1000 },
]

const form: FormData = reactive({
  name: '',
  url: '',
})

const selectedSize = ref<number>(500)
const qrSrc = ref<string>('')

// Validation functions
const validateName = (): boolean => {
  const name = form.name
  
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
  
  const validCharsRegex = /^[a-zA-Z0-9\s]+$/
  if (!validCharsRegex.test(name)) {
    validationErrors.value.name = 'Name must contain only letters, numbers, and spaces'
    return false
  }
  
  validationErrors.value.name = ''
  return true
}

const validateUrl = (): boolean => {
  const url = form.url
  
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

const isFormValid = computed<boolean>(() => {
  return validationErrors.value.name === '' && 
         validationErrors.value.url === '' && 
         form.name.trim() !== '' && 
         form.url.trim() !== ''
})

async function generateQR(): Promise<void> {
  const isNameValid = validateName()
  const isUrlValid = validateUrl()
  
  if (!isNameValid || !isUrlValid) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the validation errors before generating',
      life: 4000,
    })
    return
  }
  
  isLoading.value = true

  try {
    const qrDataURL = await QRCode.toDataURL(form.url.trim(), {
      width: selectedSize.value,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    qrSrc.value = qrDataURL

    toast.add({
      severity: 'success',
      summary: 'QR Generated',
      detail: 'Your QR code has been generated successfully',
      life: 3000,
    })
  } catch (error) {
    console.error('QR Generation Error:', error)
    toast.add({
      severity: 'error',
      summary: 'Generation Failed',
      detail: 'Failed to generate QR code. Please check your URL and try again.',
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}

function openSaveModal(): void {
  if (!qrSrc.value) return
  saveModalVisible.value = true
}

async function saveToDashboard(): Promise<void> {
  if (!isFormValid.value) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the validation errors before saving',
      life: 4000,
    })
    return
  }
  
  isLoading.value = true

  try {
    await saveQRCode({
      name: form.name.trim(),
      url: form.url.trim(),
    } as SavedQRCode)

    saveModalVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Saved!',
      detail: 'QR code saved to dashboard',
      life: 3000,
    })

    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } catch (error) {
    console.error('Save error:', error)
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: error instanceof Error ? error.message : 'Failed to save QR code. Please try again.',
      life: 4000,
    })
  } finally {
    isLoading.value = false
  }
}

async function downloadQR(format: 'png' | 'jpg' | 'svg'): Promise<void> {
  if (!qrSrc.value) return

  isLoading.value = true
  const filename = `${form.name.replace(/[^a-z0-9]/gi, '_') || 'qrcode'}.${format}`

  try {
    if (format === 'svg') {
      const svgString = await QRCode.toString(form.url.trim(), {
        type: 'svg',
        width: selectedSize.value,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } else {
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, form.url.trim(), {
        width: selectedSize.value,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
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
      life: 2000,
    })
  } catch (error) {
    console.error('Download Error:', error)
    toast.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: 'Failed to download QR code',
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}

function resetForm(): void {
  form.name = ''
  form.url = ''
  qrSrc.value = ''
  selectedSize.value = 500
  validationErrors.value = {
    name: '',
    url: ''
  }
}
</script>

<!-- CreateQR.vue -->
<template>
  <div class="flex mt-0 md:mt-16 items-center justify-center py-4 px-4">
    <div class="max-w-2xl mx-auto w-full">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div class="text-center mb-6">
          <div
            class="w-16 h-16 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <h1
            class="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            Create New QR Code
          </h1>
          <p class="text-gray-600 mt-2">Generate and customize your QR code</p>
        </div>

        <!-- Form Fields -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              QR Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="form.name"
              placeholder="e.g., My Portfolio, Business Card, etc."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.name }"
              @input="validateName"
              @blur="validateName"
            />
            <p v-if="validationErrors.name" class="text-red-500 text-xs mt-1">{{ validationErrors.name }}</p>
            <p class="text-gray-400 text-xs mt-1">Minimum 3 characters (letters/numbers/spaces allowed)</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Destination URL <span class="text-red-500">*</span>
            </label>
            <input
              type="url"
              v-model="form.url"
              placeholder="https://example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.url }"
              @input="validateUrl"
              @blur="validateUrl"
            />
            <p v-if="validationErrors.url" class="text-red-500 text-xs mt-1">{{ validationErrors.url }}</p>
            <p class="text-gray-400 text-xs mt-1">Must start with http:// or https://</p>
          </div>

          <!-- Size Selection -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"> QR Code Size </label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="size in sizes"
                :key="size.value"
                @click="selectedSize = size.value"
                class="px-4 py-2 rounded-lg border-2 transition-all"
                :class="
                  selectedSize === size.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300'
                "
              >
                {{ size.label }}
              </button>
            </div>
          </div>

          <!-- Generate Button -->
          <button
            @click="generateQR"
            :disabled="!isFormValid || isLoading"
            class="w-full py-3 text-base font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            :class="!isFormValid || isLoading 
              ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
              : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'"
          >
            <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2"></i>
            Generate QR Code
          </button>
        </div>

        <!-- Generated QR Section -->
        <div v-if="qrSrc" class="mt-6 pt-4 border-t-2 border-gray-100">
          <div class="bg-linear-to-br from-gray-50 to-white rounded-lg p-5">
            <div class="text-center mb-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Your QR Code is Ready!</h3>
              <p class="text-sm text-gray-600">{{ form.name }}</p>
            </div>

            <!-- QR Preview -->
            <div class="flex justify-center mb-4">
              <div class="bg-white p-3 rounded-xl shadow-md border border-gray-200">
                <img ref="qrImage" :src="qrSrc" :alt="form.name" class="w-40 h-40 object-contain" />
              </div>
            </div>

            <!-- URL Display -->
            <div class="bg-gray-100 rounded-lg p-2 mb-4">
              <p class="text-xs text-gray-500 mb-1">Encoded URL:</p>
              <p class="text-sm text-blue-600 break-all">{{ form.url }}</p>
            </div>

            <!-- Download Options -->
            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 mb-2"> Download Options </label>
              <div class="grid grid-cols-3 gap-2">
                <button @click="downloadQR('png')" class="px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm">
                  PNG
                </button>
                <button @click="downloadQR('jpg')" class="px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm">
                  JPG
                </button>
                <button @click="downloadQR('svg')" class="px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm">
                  SVG
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-2">
              <button @click="openSaveModal" class="w-full py-2.5 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] shadow-md text-sm">
                Save to Dashboard
              </button>
              <button @click="resetForm" class="w-full py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all text-sm">
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Confirmation Modal with Blur Background -->
    <div v-if="saveModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="saveModalVisible = false">
      <div class="bg-white rounded-xl max-w-sm w-full shadow-2xl animate-fade-in">
        <div class="text-center p-6">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-save text-green-600 text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Save QR Code?</h3>
          <p class="text-gray-600">Do you want to save "{{ form.name }}" to your dashboard?</p>
          <div class="mt-4 p-3 bg-gray-50 rounded-lg">
            <img :src="qrSrc" class="w-16 h-16 mx-auto" />
            <p class="text-xs text-gray-500 mt-2 break-all">{{ form.url }}</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 border-t border-gray-100">
          <button @click="saveModalVisible = false" class="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium">
            Cancel
          </button>
          <button @click="saveToDashboard" class="flex-1 px-4 py-2 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay with Blur Background -->
    <div v-if="isLoading" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 flex flex-col items-center shadow-2xl animate-fade-in">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-3"></i>
        <p class="text-gray-700">Generating QR Code...</p>
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

/* Custom scrollbar for the form container */
.max-h-\[90vh\]::-webkit-scrollbar {
  width: 6px;
}

.max-h-\[90vh\]::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.max-h-\[90vh\]::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.max-h-\[90vh\]::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
