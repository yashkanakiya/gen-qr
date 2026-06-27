<!-- views/CreateQR.vue -->
<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { saveQRCode } from '../stores/qrStore'
import QRCode from 'qrcode'
import { QR_TYPES, generateQRContent, validateQRValue } from '../utils/qrContentGenerator'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { api } from '../services/api'

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
  pdfUrl: string
  eventTitle: string
  eventStartDate: string
  eventStartTime: string
  eventEndDate: string
  eventEndTime: string
  eventLocation: string
  eventDescription: string
  eventUrl: string
  vcardFirstName: string
  vcardLastName: string
  vcardPhone: string
  vcardEmail: string
  vcardCompany: string
  vcardJobTitle: string
  vcardAddress: string
  vcardWebsite: string
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
  value: '',
})
const selectedSize = ref<number>(500)
const qrSrc = ref<string>('')
const previewContent = ref<string>('')
const showPdfPreview = ref<boolean>(false)
const pdfInput = ref<HTMLInputElement | null>(null)
const pdfFileName = ref<string>('')
const isUploadingPdf = ref<boolean>(false)

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
  locationLng: '',
  pdfUrl: '',
  eventTitle: '',
  eventStartDate: '',
  eventStartTime: '',
  eventEndDate: '',
  eventEndTime: '',
  eventLocation: '',
  eventDescription: '',
  eventUrl: '',
  vcardFirstName: '',
  vcardLastName: '',
  vcardPhone: '',
  vcardEmail: '',
  vcardCompany: '',
  vcardJobTitle: '',
  vcardAddress: '',
  vcardWebsite: '',
})

const wifiEncryptionOptions = [
  { label: 'WPA/WPA2', value: 'WPA' },
  { label: 'WEP', value: 'WEP' },
  { label: 'None (Open Network)', value: 'nopass' },
]

const sizeOptions = [
  { label: 'Small', value: 200, dimensions: '200×200' },
  { label: 'Medium', value: 500, dimensions: '500×500' },
  { label: 'Large', value: 1000, dimensions: '1000×1000' },
]

const tabContainer = ref<HTMLElement | null>(null)
const showLeftScroll = ref(false)
const showRightScroll = ref(false)

const getCurrentValue = (): string => {
  switch (form.type) {
    case 'url':
      return form.urlValue
    case 'text':
      return form.textValue
    case 'email':
      return form.emailTo
    case 'phone':
      return form.phoneNumber
    case 'sms':
      return form.smsNumber
    case 'wifi':
      return form.wifiSSID
    case 'location':
      return form.locationLat && form.locationLng ? `${form.locationLat},${form.locationLng}` : ''
    case 'pdf':
      return form.pdfUrl
    case 'event':
      return form.eventTitle
    case 'vcard':
      return form.vcardFirstName
    default:
      return ''
  }
}

const getFullQRContent = (): string => {
  switch (form.type) {
    case 'url':
      return generateQRContent('url', form.urlValue)
    case 'text':
      return generateQRContent('text', form.textValue)
    case 'email': {
      let content = `mailto:${form.emailTo}`
      const params = []
      if (form.emailSubject) params.push(`subject=${encodeURIComponent(form.emailSubject)}`)
      if (form.emailBody) params.push(`body=${encodeURIComponent(form.emailBody)}`)
      if (params.length) content += `?${params.join('&')}`
      return content
    }
    case 'phone':
      return generateQRContent('phone', form.phoneNumber)
    case 'sms': {
      let content = `smsto:${form.smsNumber}`
      if (form.smsMessage) content += `:${encodeURIComponent(form.smsMessage)}`
      return content
    }
    case 'wifi': {
      return generateQRContent('wifi', form.wifiSSID, {
        encryption: form.wifiEncryption,
        password: form.wifiPassword,
      })
    }
    case 'location': {
      return form.locationLat && form.locationLng
        ? generateQRContent('location', `${form.locationLat},${form.locationLng}`)
        : ''
    }
    case 'pdf': {
      return generateQRContent('pdf', form.pdfUrl)
    }
    case 'event': {
      return generateQRContent('event', 'event', {
        title: form.eventTitle,
        startDate: form.eventStartDate,
        startTime: form.eventStartTime,
        endDate: form.eventEndDate,
        endTime: form.eventEndTime,
        location: form.eventLocation,
        description: form.eventDescription,
        url: form.eventUrl,
      })
    }
    case 'vcard': {
      return generateQRContent('vcard', 'vcard', {
        firstName: form.vcardFirstName,
        lastName: form.vcardLastName,
        phone: form.vcardPhone,
        email: form.vcardEmail,
        company: form.vcardCompany,
        jobTitle: form.vcardJobTitle,
        address: form.vcardAddress,
        website: form.vcardWebsite,
      })
    }
    default:
      return ''
  }
}

// --- Validation ---
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
  let error: string | null = null
  switch (form.type) {
    case 'event': {
      if (!form.eventTitle.trim()) error = 'Event title is required'
      else if (!form.eventStartDate || !form.eventStartTime)
        error = 'Start date and time are required'
      else if (!form.eventEndDate || !form.eventEndTime) error = 'End date and time are required'
      break
    }
    case 'vcard': {
      if (!form.vcardFirstName.trim()) error = 'First name is required'
      break
    }
    case 'pdf': {
      if (!form.pdfUrl.trim()) error = 'PDF file is required'
      break
    }
    default: {
      const value = getCurrentValue()
      if (!value || value.trim() === '') error = 'This field is required'
      else error = validateQRValue(form.type, value)
    }
  }
  if (error) {
    validationErrors.value.value = error
    return false
  }
  validationErrors.value.value = ''
  return true
}

const isFormValid = computed<boolean>(() => {
  let hasValue = false
  switch (form.type) {
    case 'url':
      hasValue = form.urlValue.trim() !== ''
      break
    case 'text':
      hasValue = form.textValue.trim() !== ''
      break
    case 'email':
      hasValue = form.emailTo.trim() !== ''
      break
    case 'phone':
      hasValue = form.phoneNumber.trim() !== ''
      break
    case 'sms':
      hasValue = form.smsNumber.trim() !== ''
      break
    case 'wifi':
      hasValue = form.wifiSSID.trim() !== ''
      break
    case 'location':
      hasValue = !!form.locationLat && !!form.locationLng
      break
    case 'pdf':
      hasValue = form.pdfUrl.trim() !== ''
      break
    case 'event':
      hasValue =
        form.eventTitle.trim() !== '' &&
        !!form.eventStartDate &&
        !!form.eventStartTime &&
        !!form.eventEndDate &&
        !!form.eventEndTime
      break
    case 'vcard':
      hasValue = form.vcardFirstName.trim() !== ''
      break
    default:
      hasValue = false
  }
  return (
    validationErrors.value.name === '' &&
    validationErrors.value.value === '' &&
    form.name.trim() !== '' &&
    hasValue
  )
})

watch(
  [
    () => form.name,
    () => form.type,
    () => form.urlValue,
    () => form.textValue,
    () => form.emailTo,
    () => form.emailSubject,
    () => form.emailBody,
    () => form.phoneNumber,
    () => form.smsNumber,
    () => form.smsMessage,
    () => form.wifiSSID,
    () => form.wifiEncryption,
    () => form.wifiPassword,
    () => form.locationLat,
    () => form.locationLng,
    () => form.pdfUrl,
    () => form.eventTitle,
    () => form.eventStartDate,
    () => form.eventStartTime,
    () => form.eventEndDate,
    () => form.eventEndTime,
    () => form.eventLocation,
    () => form.eventDescription,
    () => form.eventUrl,
    () => form.vcardFirstName,
    () => form.vcardLastName,
    () => form.vcardPhone,
    () => form.vcardEmail,
    () => form.vcardCompany,
    () => form.vcardJobTitle,
    () => form.vcardAddress,
    () => form.vcardWebsite,
  ],
  () => {
    qrGenerated.value = false
    previewContent.value = getFullQRContent()
    if (getCurrentValue() || form.type === 'event' || form.type === 'vcard' || form.type === 'pdf')
      validateFormValue()
  },
  { deep: true },
)

// --- Tab scroll ---
const updateScrollButtons = () => {
  const el = tabContainer.value
  if (!el) {
    showLeftScroll.value = false
    showRightScroll.value = false
    return
  }
  const threshold = 10
  showLeftScroll.value = el.scrollLeft > threshold
  showRightScroll.value = el.scrollLeft + el.clientWidth < el.scrollWidth - threshold
}

const scrollTabs = (direction: 'left' | 'right') => {
  const el = tabContainer.value
  if (!el) return
  const scrollAmount = 200
  el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
  setTimeout(updateScrollButtons, 300)
}

watch([() => activeTab.value, () => form.type], () => {
  nextTick(updateScrollButtons)
})

const handleResize = () => updateScrollButtons()

onMounted(() => {
  nextTick(updateScrollButtons)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// --- PDF Upload ---
const handlePdfUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  if (!file) return // 👈 Guard against undefined

  if (file.type !== 'application/pdf') {
    toast.add({
      severity: 'error',
      summary: 'Invalid File',
      detail: 'Please upload a PDF file',
      life: 3000,
    })
    input.value = ''
    return
  }

  isUploadingPdf.value = true
  const formData = new FormData()
  formData.append('pdf', file) // Now safe

  try {
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    form.pdfUrl = response.data.url
    pdfFileName.value = response.data.fileName
    validateFormValue()
    toast.add({
      severity: 'success',
      summary: 'Uploaded',
      detail: 'PDF uploaded successfully',
      life: 2000,
    })
  } catch (error) {
    console.error('Upload error:', error)
    toast.add({
      severity: 'error',
      summary: 'Upload Failed',
      detail: 'Could not upload PDF',
      life: 3000,
    })
  } finally {
    isUploadingPdf.value = false
    input.value = ''
  }
}

const removePdf = () => {
  form.pdfUrl = ''
  pdfFileName.value = ''
  if (pdfInput.value) pdfInput.value.value = ''
  validateFormValue()
}

// --- QR Generation ---
async function generateQR(): Promise<void> {
  if (!validateName() || !validateFormValue()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the validation errors',
      life: 4000,
    })
    return
  }

  isLoading.value = true
  try {
    const qrDataURL = await QRCode.toDataURL(getFullQRContent(), {
      width: selectedSize.value,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#FFFFFF' },
    })
    qrSrc.value = qrDataURL
    qrGenerated.value = true
    toast.add({
      severity: 'success',
      summary: 'QR Generated',
      detail: 'QR code generated successfully',
      life: 3000,
    })
    if (form.type === 'pdf' && form.pdfUrl) {
      showPdfPreview.value = true
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Generation Failed',
      detail: 'Failed to generate QR code',
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}

async function saveToDashboard(): Promise<void> {
  if (!isFormValid.value) return
  isSavingToDashboard.value = true
  try {
    const saveData: any = {
      name: form.name.trim(),
      type: form.type,
      value: getCurrentValue(),
    }
    if (form.type === 'wifi') {
      saveData.wifiEncryption = form.wifiEncryption
      saveData.wifiPassword = form.wifiPassword
    } else if (form.type === 'email') {
      if (form.emailSubject) saveData.emailSubject = form.emailSubject
      if (form.emailBody) saveData.emailBody = form.emailBody
    } else if (form.type === 'sms') {
      if (form.smsMessage) saveData.smsMessage = form.smsMessage
    } else if (form.type === 'pdf') {
      saveData.pdfUrl = form.pdfUrl
      saveData.pdfFileName = pdfFileName.value
    } else if (form.type === 'event') {
      saveData.eventTitle = form.eventTitle
      saveData.eventStartDate = form.eventStartDate
      saveData.eventStartTime = form.eventStartTime
      saveData.eventEndDate = form.eventEndDate
      saveData.eventEndTime = form.eventEndTime
      if (form.eventLocation) saveData.eventLocation = form.eventLocation
      if (form.eventDescription) saveData.eventDescription = form.eventDescription
      if (form.eventUrl) saveData.eventUrl = form.eventUrl
    } else if (form.type === 'vcard') {
      saveData.vcardFirstName = form.vcardFirstName
      saveData.vcardLastName = form.vcardLastName
      if (form.vcardPhone) saveData.vcardPhone = form.vcardPhone
      if (form.vcardEmail) saveData.vcardEmail = form.vcardEmail
      if (form.vcardCompany) saveData.vcardCompany = form.vcardCompany
      if (form.vcardJobTitle) saveData.vcardJobTitle = form.vcardJobTitle
      if (form.vcardAddress) saveData.vcardAddress = form.vcardAddress
      if (form.vcardWebsite) saveData.vcardWebsite = form.vcardWebsite
    }
    await saveQRCode(saveData)
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
    isSavingToDashboard.value = false
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: 'Failed to save QR code',
      life: 4000,
    })
  }
}

async function downloadQR(format: 'png' | 'jpg' | 'svg'): Promise<void> {
  if (!qrSrc.value) return
  isLoading.value = true
  const filename = `${form.name.replace(/[^a-z0-9]/gi, '_') || 'qrcode'}.${format}`
  try {
    const content = getFullQRContent()
    if (format === 'svg') {
      const svgString = await QRCode.toString(content, {
        type: 'svg',
        width: selectedSize.value,
        margin: 2,
      })
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
    toast.add({
      severity: 'info',
      summary: 'Download Started',
      detail: `Downloading ${filename}`,
      life: 2000,
    })
  } catch (error) {
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
  form.pdfUrl = ''
  pdfFileName.value = ''
  form.eventTitle = ''
  form.eventStartDate = ''
  form.eventStartTime = ''
  form.eventEndDate = ''
  form.eventEndTime = ''
  form.eventLocation = ''
  form.eventDescription = ''
  form.eventUrl = ''
  form.vcardFirstName = ''
  form.vcardLastName = ''
  form.vcardPhone = ''
  form.vcardEmail = ''
  form.vcardCompany = ''
  form.vcardJobTitle = ''
  form.vcardAddress = ''
  form.vcardWebsite = ''
  qrSrc.value = ''
  selectedSize.value = 500
  validationErrors.value = { name: '', value: '' }
  activeTab.value = 'url'
  qrGenerated.value = false
  showPdfPreview.value = false
  if (pdfInput.value) pdfInput.value.value = ''
}

function setType(type: string): void {
  form.type = type
  activeTab.value = type
  qrSrc.value = ''
  validationErrors.value.value = ''
  qrGenerated.value = false
  showPdfPreview.value = false
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen select-none">
    <div class="max-w-2xl mx-auto w-full px-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div class="text-center mb-6">
          <div
            class="w-16 h-16 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
          </div>
          <h1
            class="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            Create New QR Code
          </h1>
          <p class="text-gray-600 mt-2">Generate and customize your QR code</p>
        </div>

        <!-- Tabs -->
        <div class="mb-6 relative">
          <div class="relative flex items-center">
            <button
              v-if="showLeftScroll"
              @click="scrollTabs('left')"
              class="absolute left-0 z-10 flex items-center justify-center w-7 h-7 bg-transparent rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors -translate-y-1/2 top-9"
              style="transform: translateY(-50%)"
            >
              <i class="pi pi-chevron-left text-xs text-gray-600"></i>
            </button>
            <div
              ref="tabContainer"
              class="flex overflow-x-auto scroll-smooth no-scrollbar gap-2 px-2 py-1 mx-7"
              style="scrollbar-width: none; -ms-overflow-style: none"
              @scroll="updateScrollButtons"
            >
              <div
                v-for="type in QR_TYPES"
                :key="type.value"
                @click="setType(type.value)"
                class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all whitespace-nowrap"
                :class="
                  activeTab === type.value
                    ? 'bg-blue-50 text-blue-600 border-blue-500 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                "
              >
                <i :class="type.icon" class="text-base"></i>
                <span class="text-sm font-medium">{{ type.label }}</span>
              </div>
            </div>
            <button
              v-if="showRightScroll"
              @click="scrollTabs('right')"
              class="absolute right-0 z-10 flex items-center justify-center w-7 h-7 bg-transparent rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors -translate-y-1/2 top-9"
              style="transform: translateY(-50%)"
            >
              <i class="pi pi-chevron-right text-xs text-gray-600"></i>
            </button>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              QR Name <span class="text-red-500">*</span>
            </label>
            <InputText
              type="text"
              v-model="form.name"
              placeholder="e.g., My Portfolio, Business Card, etc."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.name }"
              @input="validateName"
              @blur="validateName"
            />
            <p v-if="validationErrors.name" class="text-red-500 text-xs mt-1">
              {{ validationErrors.name }}
            </p>
          </div>

          <!-- URL -->
          <div v-if="form.type === 'url'">
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >Destination URL <span class="text-red-500">*</span></label
            >
            <InputText
              type="url"
              v-model="form.urlValue"
              placeholder="https://example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.value }"
              @input="validateFormValue"
              @blur="validateFormValue"
            />
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">
              {{ validationErrors.value }}
            </p>
          </div>

          <!-- Text -->
          <div v-if="form.type === 'text'">
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >Text Content <span class="text-red-500">*</span></label
            >
            <Textarea
              v-model="form.textValue"
              placeholder="Enter your text content here..."
              rows="5"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
              :class="{ 'border-red-500': validationErrors.value }"
              @input="validateFormValue"
              @blur="validateFormValue"
            />
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">
              {{ validationErrors.value }}
            </p>
          </div>

          <!-- Email -->
          <div v-if="form.type === 'email'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Email Address <span class="text-red-500">*</span></label
                >
                <InputText
                  type="email"
                  v-model="form.emailTo"
                  placeholder="recipient@example.com"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                  @blur="validateFormValue"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Subject (Optional)</label
                >
                <InputText
                  type="text"
                  v-model="form.emailSubject"
                  placeholder="Email subject"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Body (Optional)</label
                >
                <Textarea
                  v-model="form.emailBody"
                  placeholder="Email body content..."
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                />
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">
                {{ validationErrors.value }}
              </p>
            </div>
          </div>

          <!-- Phone -->
          <div v-if="form.type === 'phone'">
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >Phone Number <span class="text-red-500">*</span></label
            >
            <InputText
              type="tel"
              v-model="form.phoneNumber"
              placeholder="+1234567890"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.value }"
              @input="validateFormValue"
              @blur="validateFormValue"
            />
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">
              {{ validationErrors.value }}
            </p>
          </div>

          <!-- SMS -->
          <div v-if="form.type === 'sms'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Phone Number <span class="text-red-500">*</span></label
                >
                <InputText
                  type="tel"
                  v-model="form.smsNumber"
                  placeholder="+1234567890"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                  @blur="validateFormValue"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Message (Optional)</label
                >
                <Textarea
                  v-model="form.smsMessage"
                  placeholder="Pre-filled SMS message..."
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                />
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">
                {{ validationErrors.value }}
              </p>
            </div>
          </div>

          <!-- WiFi -->
          <div v-if="form.type === 'wifi'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Network SSID <span class="text-red-500">*</span></label
                >
                <InputText
                  type="text"
                  v-model="form.wifiSSID"
                  placeholder="WiFi Network Name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Encryption Type</label
                >
                <select
                  v-model="form.wifiEncryption"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option v-for="opt in wifiEncryptionOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <div v-if="form.wifiEncryption !== 'nopass'">
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Password <span class="text-red-500">*</span></label
                >
                <InputText
                  type="password"
                  v-model="form.wifiPassword"
                  placeholder="WiFi Password"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">
                {{ validationErrors.value }}
              </p>
            </div>
          </div>

          <!-- Location -->
          <div v-if="form.type === 'location'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Latitude <span class="text-red-500">*</span></label
                >
                <InputText
                  type="number"
                  step="any"
                  v-model="form.locationLat"
                  placeholder="-90 to 90"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Longitude <span class="text-red-500">*</span></label
                >
                <InputText
                  type="number"
                  step="any"
                  v-model="form.locationLng"
                  placeholder="-180 to 180"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">
                {{ validationErrors.value }}
              </p>
              <p class="text-gray-400 text-xs">Example: 40.7128, -74.0060 (New York City)</p>
            </div>
          </div>

          <!-- ===== PDF ===== -->
          <div v-if="form.type === 'pdf'">
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >Upload PDF <span class="text-red-500">*</span></label
            >
            <input
              type="file"
              accept=".pdf,application/pdf"
              @change="handlePdfUpload"
              ref="pdfInput"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              :disabled="isUploadingPdf"
            />

            <!-- PDF Preview with icon and close -->
            <div v-if="form.pdfUrl" class="mt-3 flex justify-center">
              <div
                class="relative border rounded-lg p-4 bg-gray-50 flex flex-col items-center w-48"
              >
                <i class="pi pi-file-pdf text-5xl text-red-500"></i>
                <p class="text-xs text-gray-600 mt-2 truncate w-full text-center">
                  {{ pdfFileName || 'PDF Document' }}
                </p>
                <button
                  @click="removePdf"
                  class="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 cursor-pointer"
                  type="button"
                >
                  <i class="pi pi-times text-gray-600"></i>
                </button>
              </div>
            </div>
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">
              {{ validationErrors.value }}
            </p>
          </div>

          <!-- Event -->
          <div v-if="form.type === 'event'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Event Title <span class="text-red-500">*</span></label
                >
                <InputText
                  type="text"
                  v-model="form.eventTitle"
                  placeholder="Conference, Meeting, etc."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Event URL (Optional)</label
                >
                <InputText
                  type="url"
                  v-model="form.eventUrl"
                  placeholder="https://event-page.com"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Start Date <span class="text-red-500">*</span></label
                >
                <InputText
                  type="date"
                  v-model="form.eventStartDate"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Start Time <span class="text-red-500">*</span></label
                >
                <InputText
                  type="time"
                  v-model="form.eventStartTime"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >End Date <span class="text-red-500">*</span></label
                >
                <InputText
                  type="date"
                  v-model="form.eventEndDate"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >End Time <span class="text-red-500">*</span></label
                >
                <InputText
                  type="time"
                  v-model="form.eventEndTime"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Location (Optional)</label
                >
                <InputText
                  type="text"
                  v-model="form.eventLocation"
                  placeholder="Venue, address, etc."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Description (Optional)</label
                >
                <Textarea
                  v-model="form.eventDescription"
                  placeholder="Event details..."
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                />
              </div>
            </div>
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">
              {{ validationErrors.value }}
            </p>
          </div>

          <!-- VCard -->
          <div v-if="form.type === 'vcard'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >First Name <span class="text-red-500">*</span></label
                >
                <InputText
                  type="text"
                  v-model="form.vcardFirstName"
                  placeholder="John"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :class="{ 'border-red-500': validationErrors.value }"
                  @input="validateFormValue"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Last Name (Optional)</label
                >
                <InputText
                  type="text"
                  v-model="form.vcardLastName"
                  placeholder="Doe"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Phone (Optional)</label
                >
                <InputText
                  type="tel"
                  v-model="form.vcardPhone"
                  placeholder="+1234567890"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Email (Optional)</label
                >
                <InputText
                  type="email"
                  v-model="form.vcardEmail"
                  placeholder="john@example.com"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Company (Optional)</label
                >
                <InputText
                  type="text"
                  v-model="form.vcardCompany"
                  placeholder="Acme Inc."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Job Title (Optional)</label
                >
                <InputText
                  type="text"
                  v-model="form.vcardJobTitle"
                  placeholder="Software Engineer"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Address (Optional)</label
                >
                <Textarea
                  v-model="form.vcardAddress"
                  placeholder="Street, City, State, ZIP"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2"
                  >Website (Optional)</label
                >
                <InputText
                  type="url"
                  v-model="form.vcardWebsite"
                  placeholder="https://mywebsite.com"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">
              {{ validationErrors.value }}
            </p>
          </div>

          <!-- Size Selection -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">QR Code Size</label>
            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="size in sizeOptions"
                :key="size.value"
                @click="selectedSize = size.value"
                class="relative flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all cursor-pointer"
                :class="
                  selectedSize === size.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                "
              >
                <span class="font-medium">{{ size.label }}</span>
                <span class="text-xs text-gray-500 mt-0.5">{{ size.dimensions }}</span>
                <div
                  v-if="selectedSize === size.value"
                  class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm border border-white"
                >
                  <i class="pi pi-check text-white text-[10px]"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Generate Button -->
          <Button
            @click="generateQR"
            :disabled="!isFormValid || isLoading || qrGenerated || isUploadingPdf"
            class="w-full py-3 text-base font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            :class="
              !isFormValid || isLoading || qrGenerated || isUploadingPdf
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
            "
          >
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
                <Button
                  severity="info"
                  variant="outlined"
                  @click="downloadQR('png')"
                  class="px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm cursor-pointer"
                  >PNG</Button
                >
                <Button
                  severity="info"
                  variant="outlined"
                  @click="downloadQR('jpg')"
                  class="px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm cursor-pointer"
                  >JPG</Button
                >
                <Button
                  severity="info"
                  variant="outlined"
                  @click="downloadQR('svg')"
                  class="px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm cursor-pointer"
                  >SVG</Button
                >
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <Button
                severity="success"
                @click="saveModalVisible = true"
                :disabled="!qrSrc || isSavingToDashboard"
                class="w-full py-2.5 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] shadow-md text-sm cursor-pointer"
                :class="{ 'opacity-50 cursor-not-allowed': !qrSrc || isSavingToDashboard }"
              >
                Save to Dashboard
              </Button>
              <Button
                severity="secondary"
                variant="outlined"
                @click="resetForm"
                class="w-full py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all text-sm cursor-pointer"
              >
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Modal -->
    <div
      v-if="saveModalVisible"
      class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="saveModalVisible = false"
    >
      <div class="bg-white rounded-xl max-w-sm w-full shadow-2xl">
        <div class="text-center p-6">
          <div
            class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
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
          <Button
            severity="secondary"
            variant="outlined"
            @click="saveModalVisible = false"
            class="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium cursor-pointer"
            >Cancel</Button
          >
          <Button
            severity="success"
            @click="saveToDashboard"
            :disabled="isSavingToDashboard"
            class="flex-1 px-4 py-2 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium cursor-pointer"
            :class="{ 'opacity-50 cursor-not-allowed': isSavingToDashboard }"
          >
            <i v-if="isSavingToDashboard" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isSavingToDashboard ? 'Saving...' : 'Save' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 flex flex-col items-center shadow-2xl">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-3"></i>
        <p class="text-gray-700">Generating QR Code...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
