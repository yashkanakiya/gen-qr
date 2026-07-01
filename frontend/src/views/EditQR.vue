<!-- views/EditQR.vue -->
<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { getQRCodeById, updateQRCode, loadQRCodes, type QRCodeItem } from '../stores/qrStore'
import { QR_TYPES, generateQRContent, validateQRValue } from '../utils/qrContentGenerator'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { api } from '../services/api'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const isLoading = ref(true)
const isSaving = ref(false)
const qrId = ref<string>(route.params.id as string)
const originalQR = ref<QRCodeItem | null>(null)

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

const validationErrors = ref<ValidationErrors>({
  name: '',
  value: '',
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

const qrSrc = ref<string>('')
const previewContent = ref<string>('')
const activeTab = ref<string>('url')
const showPdfPreview = ref<boolean>(false)
const pdfInput = ref<HTMLInputElement | null>(null)
const pdfFileName = ref<string>('')
const isUploadingPdf = ref<boolean>(false)

const wifiEncryptionOptions = [
  { label: 'WPA/WPA2', value: 'WPA' },
  { label: 'WEP', value: 'WEP' },
  { label: 'None (Open Network)', value: 'nopass' },
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

const getEmailContent = (): string => {
  let content = `mailto:${form.emailTo}`
  const params = []
  if (form.emailSubject) params.push(`subject=${encodeURIComponent(form.emailSubject)}`)
  if (form.emailBody) params.push(`body=${encodeURIComponent(form.emailBody)}`)
  if (params.length) content += `?${params.join('&')}`
  return content
}

const getSMSContent = (): string => {
  let content = `smsto:${form.smsNumber}`
  if (form.smsMessage) content += `:${encodeURIComponent(form.smsMessage)}`
  return content
}

const getFullQRContent = (): string => {
  switch (form.type) {
    case 'url':
      return generateQRContent('url', form.urlValue)
    case 'text':
      return generateQRContent('text', form.textValue)
    case 'email':
      return getEmailContent()
    case 'phone':
      return generateQRContent('phone', form.phoneNumber)
    case 'sms':
      return getSMSContent()
    case 'wifi':
      return generateQRContent('wifi', form.wifiSSID, {
        encryption: form.wifiEncryption,
        password: form.wifiPassword,
      })
    case 'location':
      return form.locationLat && form.locationLng
        ? generateQRContent('location', `${form.locationLat},${form.locationLng}`)
        : ''
    case 'pdf':
      return generateQRContent('pdf', form.pdfUrl)
    case 'event':
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
    case 'vcard':
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
    default:
      return ''
  }
}

// Populate form from QR data
const setFormValueFromQR = (qr: QRCodeItem) => {
  form.name = qr.name
  form.type = qr.type
  activeTab.value = qr.type

  const meta = qr.metadata || {}

  switch (qr.type) {
    case 'url':
      form.urlValue = qr.value
      break
    case 'text':
      form.textValue = qr.value
      break
    case 'email': {
      const emailMatch = qr.value.match(/mailto:([^?]+)/)
      if (emailMatch) form.emailTo = emailMatch[1] ?? ''
      const subjectMatch = qr.value.match(/subject=([^&]+)/)
      if (subjectMatch) form.emailSubject = decodeURIComponent(subjectMatch[1] ?? '')
      const bodyMatch = qr.value.match(/body=([^&]+)/)
      if (bodyMatch) form.emailBody = decodeURIComponent(bodyMatch[1] ?? '')
      break
    }
    case 'phone':
      form.phoneNumber = qr.value.replace(/^(tel:)+/, '')
      break
    case 'sms': {
      const clean = qr.value.replace(/^(smsto:)+/, '')
      const smsParts = clean.split(':')
      form.smsNumber = smsParts[0] ?? ''
      if (smsParts[1]) form.smsMessage = decodeURIComponent(smsParts[1])
      break
    }
    case 'wifi': {
      if (meta.wifiEncryption) form.wifiEncryption = meta.wifiEncryption
      else {
        const encMatch = qr.value.match(/T:([^;]+)/)
        form.wifiEncryption = encMatch?.[1] || 'nopass'
      }
      if (meta.wifiPassword) form.wifiPassword = meta.wifiPassword
      else {
        const passMatches = qr.value.match(/P:([^;]+)/)
        if (passMatches) {
          const last = passMatches[passMatches.length - 1]
          if (last) form.wifiPassword = last.replace(/^P:/, '')
        }
      }
      if (meta.wifiSSID) form.wifiSSID = meta.wifiSSID
      else {
        const ssidMatch = qr.value.match(/S:([^;]+)/)
        if (ssidMatch) {
          const ssid = ssidMatch[1]
          if (ssid) form.wifiSSID = ssid.replace(/WIFI:/g, '').trim()
        }
      }
      break
    }
    case 'location': {
      const locationValue = qr.value.replace('geo:', '')
      const [lat, lng] = locationValue.split(',')
      form.locationLat = lat?.trim() ?? ''
      form.locationLng = lng?.trim() ?? ''
      break
    }
    case 'pdf': {
      form.pdfUrl = meta.pdfUrl || qr.value
      pdfFileName.value = meta.pdfFileName || 'PDF Document'
      break
    }
    case 'event': {
      if (meta.eventTitle) form.eventTitle = meta.eventTitle
      if (meta.eventStartDate) form.eventStartDate = meta.eventStartDate
      if (meta.eventStartTime) form.eventStartTime = meta.eventStartTime
      if (meta.eventEndDate) form.eventEndDate = meta.eventEndDate
      if (meta.eventEndTime) form.eventEndTime = meta.eventEndTime
      if (meta.eventLocation) form.eventLocation = meta.eventLocation
      if (meta.eventDescription) form.eventDescription = meta.eventDescription
      if (meta.eventUrl) form.eventUrl = meta.eventUrl
      break
    }
    case 'vcard': {
      if (meta.vcardFirstName) form.vcardFirstName = meta.vcardFirstName
      if (meta.vcardLastName) form.vcardLastName = meta.vcardLastName
      if (meta.vcardPhone) form.vcardPhone = meta.vcardPhone
      if (meta.vcardEmail) form.vcardEmail = meta.vcardEmail
      if (meta.vcardCompany) form.vcardCompany = meta.vcardCompany
      if (meta.vcardJobTitle) form.vcardJobTitle = meta.vcardJobTitle
      if (meta.vcardAddress) form.vcardAddress = meta.vcardAddress
      if (meta.vcardWebsite) form.vcardWebsite = meta.vcardWebsite
      break
    }
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

const hasChanges = computed<boolean>(() => {
  if (!originalQR.value) return false
  if (form.name !== originalQR.value.name) return true
  if (form.type !== originalQR.value.type) return true
  return getFullQRContent() !== originalQR.value.value
})

watch(
  [
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
    if (originalQR.value) {
      previewContent.value = getFullQRContent()
      validateFormValue()
    }
  },
  { deep: true },
)

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

// --- PDF Upload ---
const handlePdfUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  if (!file) return

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
  formData.append('pdf', file)

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

// --- Load and Update ---
async function loadQRData() {
  isLoading.value = true
  try {
    const qrData = await getQRCodeById(qrId.value)
    originalQR.value = qrData
    setFormValueFromQR(qrData)
    qrSrc.value = qrData.qrSrc || ''
    previewContent.value = getFullQRContent()
    if (qrData.type === 'pdf' && qrData.metadata?.pdfUrl) {
      showPdfPreview.value = true
    }
  } catch (error) {
    console.error('Error loading QR:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load QR code data',
      life: 4000,
    })
    router.push('/dashboard')
  } finally {
    isLoading.value = false
    // Wait for DOM update then refresh scroll indicators
    await nextTick()
    updateScrollButtons()
  }
}

async function updateQR() {
  if (!validateName() || !validateFormValue()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the validation errors',
      life: 4000,
    })
    return
  }

  isSaving.value = true
  try {
    const updateData: any = {
      name: form.name.trim(),
      type: form.type,
      value: getCurrentValue(),
    }
    if (form.type === 'wifi') {
      updateData.wifiEncryption = form.wifiEncryption
      updateData.wifiPassword = form.wifiPassword
    } else if (form.type === 'email') {
      if (form.emailSubject) updateData.emailSubject = form.emailSubject
      if (form.emailBody) updateData.emailBody = form.emailBody
    } else if (form.type === 'sms') {
      if (form.smsMessage) updateData.smsMessage = form.smsMessage
    } else if (form.type === 'pdf') {
      updateData.pdfUrl = form.pdfUrl
      updateData.pdfFileName = pdfFileName.value
    } else if (form.type === 'event') {
      updateData.eventTitle = form.eventTitle
      updateData.eventStartDate = form.eventStartDate
      updateData.eventStartTime = form.eventStartTime
      updateData.eventEndDate = form.eventEndDate
      updateData.eventEndTime = form.eventEndTime
      if (form.eventLocation) updateData.eventLocation = form.eventLocation
      if (form.eventDescription) updateData.eventDescription = form.eventDescription
      if (form.eventUrl) updateData.eventUrl = form.eventUrl
    } else if (form.type === 'vcard') {
      updateData.vcardFirstName = form.vcardFirstName
      updateData.vcardLastName = form.vcardLastName
      if (form.vcardPhone) updateData.vcardPhone = form.vcardPhone
      if (form.vcardEmail) updateData.vcardEmail = form.vcardEmail
      if (form.vcardCompany) updateData.vcardCompany = form.vcardCompany
      if (form.vcardJobTitle) updateData.vcardJobTitle = form.vcardJobTitle
      if (form.vcardAddress) updateData.vcardAddress = form.vcardAddress
      if (form.vcardWebsite) updateData.vcardWebsite = form.vcardWebsite
    }
    await updateQRCode(qrId.value, updateData)

    const refreshed = await getQRCodeById(qrId.value)
    originalQR.value = refreshed
    setFormValueFromQR(refreshed)
    qrSrc.value = refreshed.qrSrc || ''
    previewContent.value = getFullQRContent()
    await loadQRCodes()

    toast.add({
      severity: 'success',
      summary: 'Updated!',
      detail: 'QR code updated successfully',
      life: 3000,
    })
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } catch (error) {
    isSaving.value = false
    console.error('Update error:', error)
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update QR code',
      life: 4000,
    })
  }
}

function cancel() {
  router.push('/dashboard')
}

function setType(type: string) {
  form.type = type
  activeTab.value = type
  validationErrors.value.value = ''
  if (type === 'pdf' && form.pdfUrl) showPdfPreview.value = true
}

onMounted(() => {
  loadQRData()
  nextTick(updateScrollButtons)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              ></path>
            </svg>
          </div>
          <h1
            class="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            Edit QR Code
          </h1>
          <p class="text-gray-600 mt-2">Update your QR code information</p>
        </div>

        <!-- Skeleton -->
        <div v-if="isLoading" class="space-y-4 animate-pulse">
          <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div class="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-3"></div>
            <div class="flex justify-center">
              <div class="bg-white p-3 rounded-xl shadow-md border border-gray-200">
                <div class="w-32 h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div class="h-3 bg-gray-200 rounded w-1/2 mx-auto mt-2"></div>
          </div>
          <div>
            <div class="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div class="grid grid-cols-4 gap-2">
              <div v-for="i in 4" :key="i" class="h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
          <div>
            <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div class="h-10 bg-gray-200 rounded-lg w-full"></div>
          </div>
          <div>
            <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div class="h-10 bg-gray-200 rounded-lg w-full"></div>
          </div>
          <div>
            <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div class="h-10 bg-gray-200 rounded-lg w-full"></div>
          </div>
          <div class="bg-gray-100 rounded-lg p-3">
            <div class="h-3 bg-gray-200 rounded w-1/4 mb-1"></div>
            <div class="h-5 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div class="flex gap-3 pt-4">
            <div class="flex-1 h-11 bg-gray-200 rounded-lg"></div>
            <div class="flex-1 h-11 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        <!-- Edit Form -->
        <div v-else class="space-y-4">
          <!-- QR Preview -->
          <div v-if="qrSrc" class="mb-4 p-4 bg-gray-50 rounded-lg">
            <label class="block text-sm font-semibold text-gray-700 mb-3 text-center"
              >Current QR Code</label
            >
            <div class="flex justify-center">
              <div class="bg-white p-3 rounded-xl shadow-md border border-gray-200">
                <img :src="qrSrc" :alt="form.name" class="w-32 h-32 object-contain" />
              </div>
            </div>
            <p class="text-xs text-gray-500 text-center mt-2">QR code image will remain the same</p>
          </div>

          <!-- Type Tabs -->
          <div class="relative">
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

          <!-- Form Fields (same as Create but with v-model) -->
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

          <!-- PDF -->
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

          <!-- Preview -->
          <div v-if="previewContent" class="bg-gray-100 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">Preview Content:</p>
            <p class="text-sm text-blue-600 break-all">{{ previewContent }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4">
            <Button
              severity="secondary"
              variant="outlined"
              @click="cancel"
              class="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              @click="updateQR"
              :disabled="!isFormValid || !hasChanges || isSaving || isUploadingPdf"
              class="flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              :class="
                !isFormValid || !hasChanges || isSaving || isUploadingPdf
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
              "
            >
              <i v-if="isSaving" class="pi pi-spin pi-spinner mr-2"></i>
              {{ isSaving ? 'Updating...' : 'Update QR Code' }}
            </Button>
          </div>
        </div>
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
