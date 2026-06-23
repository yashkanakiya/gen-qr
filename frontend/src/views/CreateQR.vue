<!-- views/CreateQR.vue -->
<script lang="ts" setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { saveQRCode } from '../stores/qrStore'
import QRCode from 'qrcode'
import { QR_TYPES, generateQRContent, validateQRValue } from '../utils/qrContentGenerator'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

interface FormData {
  name: string
  type: string
  urlValue: string
  textValue: string
  emailTo: string
  emailSubject: string
  emailBody: string
  phoneNumber: string
  smsNumber: string
  smsMessage: string
  wifiSSID: string
  wifiEncryption: string
  wifiPassword: string
  locationLat: string
  locationLng: string
}

interface ValidationErrors {
  name: string
  value: string
}

const router = useRouter()
const toast = useToast()
const saveModalVisible = ref<boolean>(false)
const isLoading = ref<boolean>(false)
const isSavingToDashboard = ref<boolean>(false)
const activeTab = ref<string>('url')
const qrGenerated = ref<boolean>(false)

const validationErrors = ref<ValidationErrors>({
  name: '',
  value: ''
})

const form: FormData = reactive({
  name: '',
  type: 'url',
  urlValue: '',
  textValue: '',
  emailTo: '',
  emailSubject: '',
  emailBody: '',
  phoneNumber: '',
  smsNumber: '',
  smsMessage: '',
  wifiSSID: '',
  wifiEncryption: 'WPA',
  wifiPassword: '',
  locationLat: '',
  locationLng: ''
})

const selectedSize = ref<number>(500)
const qrSrc = ref<string>('')
const previewContent = ref<string>('')

const wifiEncryptionOptions = [
  { label: 'WPA/WPA2', value: 'WPA' },
  { label: 'WEP', value: 'WEP' },
  { label: 'None (Open Network)', value: 'nopass' }
]

// Size options with clear labels and pixel dimensions
const sizeOptions = [
  { label: 'Small', value: 200, dimensions: '200×200' },
  { label: 'Medium', value: 500, dimensions: '500×500' },
  { label: 'Large', value: 1000, dimensions: '1000×1000' }
]

const getCurrentValue = (): string => {
  switch (form.type) {
    case 'url': return form.urlValue
    case 'text': return form.textValue
    case 'email': return form.emailTo
    case 'phone': return form.phoneNumber
    case 'sms': return form.smsNumber
    case 'wifi': return form.wifiSSID
    case 'location': return form.locationLat && form.locationLng ? `${form.locationLat},${form.locationLng}` : ''
    default: return ''
  }
}

const getEmailContent = (): string => {
  let content = `mailto:${form.emailTo}`
  const params = []
  if (form.emailSubject) params.push(`subject=${encodeURIComponent(form.emailSubject)}`)
  if (form.emailBody) params.push(`body=${encodeURIComponent(form.emailBody)}`)
  if (params.length > 0) content += `?${params.join('&')}`
  return content
}

const getSMSContent = (): string => {
  let content = `smsto:${form.smsNumber}`
  if (form.smsMessage) content += `:${encodeURIComponent(form.smsMessage)}`
  return content
}

const getFullQRContent = (): string => {
  switch (form.type) {
    case 'url': return generateQRContent('url', form.urlValue)
    case 'text': return generateQRContent('text', form.textValue)
    case 'email': return getEmailContent()
    case 'phone': return generateQRContent('phone', form.phoneNumber)
    case 'sms': return getSMSContent()
    case 'wifi': return generateQRContent('wifi', form.wifiSSID, { encryption: form.wifiEncryption, password: form.wifiPassword })
    case 'location': return form.locationLat && form.locationLng ? generateQRContent('location', `${form.locationLat},${form.locationLng}`) : ''
    default: return ''
  }
}

const validateName = (): boolean => {
  const name = form.name
  if (!name || name.trim() === '') {
    validationErrors.value.name = 'Name is required'
    return false
  }
  if (name.trim().length < 3) {
    validationErrors.value.name = 'Name must be at least 3 characters'
    return false
  }
  validationErrors.value.name = ''
  return true
}

const validateFormValue = (): boolean => {
  const value = getCurrentValue()

  if (!value || value.trim() === '') {
    validationErrors.value.value = 'This field is required'
    return false
  }

  let error = null

  switch (form.type) {
    case 'url': error = validateQRValue('url', value); break
    case 'email': error = validateQRValue('email', value); break
    case 'phone': error = validateQRValue('phone', value); break
    case 'sms': error = validateQRValue('sms', value); break
    case 'wifi':
      if (!form.wifiSSID.trim()) error = 'WiFi SSID is required'
      else if (form.wifiEncryption !== 'nopass' && !form.wifiPassword) error = 'WiFi password is required'
      break
    case 'location':
      if (!form.locationLat || !form.locationLng) error = 'Both latitude and longitude are required'
      else {
        const lat = parseFloat(form.locationLat)
        const lng = parseFloat(form.locationLng)
        if (isNaN(lat) || isNaN(lng)) error = 'Please enter valid numbers'
        else if (lat < -90 || lat > 90) error = 'Latitude must be between -90 and 90'
        else if (lng < -180 || lng > 180) error = 'Longitude must be between -180 and 180'
      }
      break
  }

  if (error) {
    validationErrors.value.value = error
    return false
  }

  validationErrors.value.value = ''
  return true
}

const isFormValid = computed<boolean>(() => {
  const hasValue = getCurrentValue().trim() !== '' ||
    (form.type === 'wifi' && form.wifiSSID.trim() !== '') ||
    (form.type === 'location' && Boolean(form.locationLat && form.locationLng))

  return validationErrors.value.name === '' &&
    validationErrors.value.value === '' &&
    form.name.trim() !== '' &&
    hasValue
})

// Reset qrGenerated flag when any input changes
watch([() => form.name, () => form.type, () => form.urlValue, () => form.textValue,
() => form.emailTo, () => form.emailSubject, () => form.emailBody,
() => form.phoneNumber, () => form.smsNumber, () => form.smsMessage,
() => form.wifiSSID, () => form.wifiEncryption, () => form.wifiPassword,
() => form.locationLat, () => form.locationLng], () => {
  qrGenerated.value = false
  previewContent.value = getFullQRContent()
  if (getCurrentValue()) validateFormValue()
}, { deep: true })

async function generateQR(): Promise<void> {
  if (!validateName() || !validateFormValue()) {
    toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fix the validation errors', life: 4000 })
    return
  }

  isLoading.value = true
  try {
    const qrDataURL = await QRCode.toDataURL(getFullQRContent(), {
      width: selectedSize.value,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    qrSrc.value = qrDataURL
    qrGenerated.value = true
    toast.add({ severity: 'success', summary: 'QR Generated', detail: 'QR code generated successfully', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Generation Failed', detail: 'Failed to generate QR code', life: 3000 })
  } finally {
    isLoading.value = false
  }
}

async function saveToDashboard(): Promise<void> {
  if (!isFormValid.value) return

  isSavingToDashboard.value = true   // disable Button
  try {
    const saveData: any = {
      name: form.name.trim(),
      type: form.type,
      value: getFullQRContent()
    }
    if (form.type === 'wifi') {
      saveData.wifiEncryption = form.wifiEncryption
      saveData.wifiPassword = form.wifiPassword
    }
    await saveQRCode(saveData)
    saveModalVisible.value = false
    toast.add({ severity: 'success', summary: 'Saved!', detail: 'QR code saved to dashboard', life: 3000 })
    // Keep Button disabled during redirect delay
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } catch (error) {
    // Re‑enable Button only on error
    isSavingToDashboard.value = false
    toast.add({ severity: 'error', summary: 'Save Failed', detail: 'Failed to save QR code', life: 4000 })
  }
}

async function downloadQR(format: 'png' | 'jpg' | 'svg'): Promise<void> {
  if (!qrSrc.value) return
  isLoading.value = true
  const filename = `${form.name.replace(/[^a-z0-9]/gi, '_') || 'qrcode'}.${format}`
  try {
    const content = getFullQRContent()
    if (format === 'svg') {
      const svgString = await QRCode.toString(content, { type: 'svg', width: selectedSize.value, margin: 2 })
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } else {
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, content, { width: selectedSize.value, margin: 2 })
      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png')
      link.click()
    }
    toast.add({ severity: 'info', summary: 'Download Started', detail: `Downloading ${filename}`, life: 2000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Download Failed', detail: 'Failed to download QR code', life: 3000 })
  } finally {
    isLoading.value = false
  }
}

function resetForm(): void {
  form.name = ''
  form.type = 'url'
  form.urlValue = ''
  form.textValue = ''
  form.emailTo = ''
  form.emailSubject = ''
  form.emailBody = ''
  form.phoneNumber = ''
  form.smsNumber = ''
  form.smsMessage = ''
  form.wifiSSID = ''
  form.wifiEncryption = 'WPA'
  form.wifiPassword = ''
  form.locationLat = ''
  form.locationLng = ''
  qrSrc.value = ''
  selectedSize.value = 500
  validationErrors.value = { name: '', value: '' }
  activeTab.value = 'url'
  qrGenerated.value = false
}

function setType(type: string): void {
  form.type = type
  activeTab.value = type
  qrSrc.value = ''
  validationErrors.value.value = ''
  qrGenerated.value = false
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="max-w-2xl mx-auto w-full px-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div class="text-center mb-6">
          <div
            class="w-16 h-16 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <h1
            class="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create New QR Code
          </h1>
          <p class="text-gray-600 mt-2">Generate and customize your QR code</p>
        </div>

        <!-- QR Type Tabs -->
        <div class="mb-6">
          <label class="block text-sm font-semibold text-gray-700 mb-3">QR Type</label>
          <div class="grid grid-cols-4 gap-2">
            <Button v-for="type in QR_TYPES" :key="type.value" severity="secondary" variant="outlined"
              @click="setType(type.value)"
              class="flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer" :class="activeTab === type.value
                ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'">
              <i :class="type.icon" class="text-lg"></i>
              <span class="text-xs">{{ type.label }}</span>
            </Button>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="space-y-4">
          <!-- QR Name -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              QR Name <span class="text-red-500">*</span>
            </label>
            <InputText type="text" v-model="form.name" placeholder="e.g., My Portfolio, Business Card, etc."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.name }" @input="validateName" @blur="validateName" />
            <p v-if="validationErrors.name" class="text-red-500 text-xs mt-1">{{ validationErrors.name }}</p>
          </div>

          <!-- URL Type -->
          <div v-if="form.type === 'url'">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Destination URL <span
                class="text-red-500">*</span></label>
            <InputText type="url" v-model="form.urlValue" placeholder="https://example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.value }" @input="validateFormValue"
              @blur="validateFormValue" />
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">{{ validationErrors.value }}</p>
          </div>

          <!-- Text Type -->
          <div v-if="form.type === 'text'">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Text Content <span
                class="text-red-500">*</span></label>
            <Textarea v-model="form.textValue" placeholder="Enter your text content here..." rows="5"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
              :class="{ 'border-red-500': validationErrors.value }" @input="validateFormValue"
              @blur="validateFormValue" />
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">{{ validationErrors.value }}</p>
          </div>

          <!-- Email Type -->
          <div v-if="form.type === 'email'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Email Address <span
                    class="text-red-500">*</span></label>
                <InputText type="email" v-model="form.emailTo" placeholder="recipient@example.com"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }" @input="validateFormValue"
                  @blur="validateFormValue" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Subject (Optional)</label>
                <InputText type="text" v-model="form.emailSubject" placeholder="Email subject"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Body (Optional)</label>
                <textarea v-model="form.emailBody" placeholder="Email body content..." rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"></textarea>
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">{{ validationErrors.value }}</p>
            </div>
          </div>

          <!-- Phone Type -->
          <div v-if="form.type === 'phone'">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span
                class="text-red-500">*</span></label>
            <InputText type="tel" v-model="form.phoneNumber" placeholder="+1234567890"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.value }" @input="validateFormValue"
              @blur="validateFormValue" />
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">{{ validationErrors.value }}</p>
          </div>

          <!-- SMS Type -->
          <div v-if="form.type === 'sms'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span
                    class="text-red-500">*</span></label>
                <InputText type="tel" v-model="form.smsNumber" placeholder="+1234567890"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }" @input="validateFormValue"
                  @blur="validateFormValue" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Message (Optional)</label>
                <textarea v-model="form.smsMessage" placeholder="Pre-filled SMS message..." rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"></textarea>
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">{{ validationErrors.value }}</p>
            </div>
          </div>

          <!-- WiFi Type -->
          <div v-if="form.type === 'wifi'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Network SSID <span
                    class="text-red-500">*</span></label>
                <InputText type="text" v-model="form.wifiSSID" placeholder="WiFi Network Name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }" @input="validateFormValue" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Encryption Type</label>
                <select v-model="form.wifiEncryption"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                  <option v-for="opt in wifiEncryptionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}
                  </option>
                </select>
              </div>
              <div v-if="form.wifiEncryption !== 'nopass'">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Password <span
                    class="text-red-500">*</span></label>
                <InputText type="password" v-model="form.wifiPassword" placeholder="WiFi Password"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }" @input="validateFormValue" />
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">{{ validationErrors.value }}</p>
            </div>
          </div>

          <!-- Location Type -->
          <div v-if="form.type === 'location'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Latitude <span
                    class="text-red-500">*</span></label>
                <InputText type="number" step="any" v-model="form.locationLat" placeholder="-90 to 90"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }" @input="validateFormValue" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Longitude <span
                    class="text-red-500">*</span></label>
                <InputText type="number" step="any" v-model="form.locationLng" placeholder="-180 to 180"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }" @input="validateFormValue" />
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">{{ validationErrors.value }}</p>
              <p class="text-gray-400 text-xs">Example: 40.7128, -74.0060 (New York City)</p>
            </div>
          </div>

          <!-- Size Selection -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">QR Code Size</label>
            <div class="grid grid-cols-3 gap-3">
              <Button v-for="size in sizeOptions" severity="secondary" variant="outlined" :key="size.value"
                @click="selectedSize = size.value"
                class="flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all">
                <span>{{ size.label }}</span>
                <span class="text-xs text-gray-500 mt-0.5">{{ size.dimensions }}</span>
              </Button>
            </div>
          </div>

          <!-- Generate Button -->
          <Button @click="generateQR" :disabled="!isFormValid || isLoading || qrGenerated"
            class="w-full py-3 text-base font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            :class="!isFormValid || isLoading || qrGenerated ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'">
            <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2"></i>
            Generate QR Code
          </Button>
        </div>

        <!-- Generated QR Section -->
        <div v-if="qrSrc" class="mt-6 pt-4 border-t-2 border-gray-100">
          <div class="bg-linear-to-br from-gray-50 to-white rounded-lg p-5">
            <div class="text-center mb-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Your QR Code is Ready!</h3>
              <p class="text-sm text-gray-600">{{ form.name }}</p>
            </div>

            <div class="flex justify-center mb-4">
              <div class="bg-white p-3 rounded-xl shadow-md border border-gray-200">
                <img :src="qrSrc" :alt="form.name" class="w-40 h-40 object-contain" />
              </div>
            </div>

            <div class="bg-gray-100 rounded-lg p-2 mb-4">
              <p class="text-xs text-gray-500 mb-1">Encoded Content:</p>
              <p class="text-sm text-blue-600 break-all">{{ previewContent }}</p>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Download Options</label>
              <div class="grid grid-cols-3 gap-2">
                <Button severity="info" variant="outlined" @click="downloadQR('png')"
                  class="px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm cursor-pointer">PNG</Button>
                <Button severity="info" variant="outlined" @click="downloadQR('jpg')"
                  class="px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm cursor-pointer">JPG</Button>
                <Button severity="info" variant="outlined" @click="downloadQR('svg')"
                  class="px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm cursor-pointer">SVG</Button>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <Button severity="success" @click="saveModalVisible = true" :disabled="!qrSrc || isSavingToDashboard"
                class="w-full py-2.5 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] shadow-md text-sm cursor-pointer"
                :class="{ 'opacity-50 cursor-not-allowed': !qrSrc || isSavingToDashboard }">
                Save to Dashboard
              </Button>
              <Button severity="secondary" variant="outlined" @click="resetForm"
                class="w-full py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all text-sm cursor-pointer">
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Confirmation Modal -->
    <div v-if="saveModalVisible" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="saveModalVisible = false">
      <div class="bg-white rounded-xl max-w-sm w-full shadow-2xl">
        <div class="text-center p-6">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-save text-green-600 text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Save QR Code?</h3>
          <p class="text-gray-600">Do you want to save "{{ form.name }}" to your dashboard?</p>
          <div class="mt-4 p-3 bg-gray-50 rounded-lg">
            <img :src="qrSrc" class="w-16 h-16 mx-auto" />
            <p class="text-xs text-gray-500 mt-2 break-all">{{ previewContent }}</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 border-t border-gray-100">
          <Button severity="secondary" variant="outlined" @click="saveModalVisible = false"
            class="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium cursor-pointer">Cancel</Button>
          <Button severity="success" @click="saveToDashboard" :disabled="isSavingToDashboard"
            class="flex-1 px-4 py-2 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium cursor-pointer"
            :class="{ 'opacity-50 cursor-not-allowed': isSavingToDashboard }">
            <i v-if="isSavingToDashboard" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isSavingToDashboard ? 'Saving...' : 'Save' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 flex flex-col items-center shadow-2xl">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-3"></i>
        <p class="text-gray-700">Generating QR Code...</p>
      </div>
    </div>
  </div>
</template>