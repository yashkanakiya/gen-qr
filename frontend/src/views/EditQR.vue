<!-- views/EditQR.vue -->
<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { getQRCodeById, updateQRCode, loadQRCodes, type QRCodeItem } from '../stores/qrStore'
import { QR_TYPES, generateQRContent, validateQRValue } from '../utils/qrContentGenerator'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

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
}

interface ValidationErrors {
  name: string
  value: string
}

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

const qrSrc = ref<string>('')
const previewContent = ref<string>('')
const activeTab = ref<string>('url')

const wifiEncryptionOptions = [
  { label: 'WPA/WPA2', value: 'WPA' },
  { label: 'WEP', value: 'WEP' },
  { label: 'None (Open Network)', value: 'nopass' }
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

const setFormValueFromQR = (qr: QRCodeItem) => {
  form.name = qr.name
  form.type = qr.type
  activeTab.value = qr.type

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
      // Remove all leading "tel:" prefixes
      form.phoneNumber = qr.value.replace(/^(tel:)+/, '')
      break
    case 'sms': {
      // Remove all leading "smsto:" prefixes
      const clean = qr.value.replace(/^(smsto:)+/, '')
      const smsParts = clean.split(':')
      form.smsNumber = smsParts[0] ?? ''
      if (smsParts[1]) form.smsMessage = decodeURIComponent(smsParts[1])
      break
    }
    case 'wifi': {
      let ssid = ''
      let password = ''

      // Extract SSID – find the last S: that does NOT contain "WIFI:"
      const ssidMatches = qr.value.match(/S:([^;]+)/g)
      if (ssidMatches) {
        for (let i = ssidMatches.length - 1; i >= 0; i--) {
          const match = ssidMatches[i]
          if (match) {
            const val = match.replace(/^S:/, '')
            if (!val.includes('WIFI:')) {
              ssid = val
              break
            }
          }
        }
        // Fallback: strip "WIFI:" from the first match if none clean
        if (!ssid && ssidMatches.length > 0) {
          const firstMatch = ssidMatches[0]
          if (firstMatch) {
            ssid = firstMatch.replace(/^S:/, '').replace(/WIFI:/g, '').trim()
          }
        }
      }

      // Encryption type
      const encMatch = qr.value.match(/T:([^;]+)/)
      form.wifiEncryption = encMatch && encMatch[1] ? encMatch[1] : 'WPA'

      // Extract password – same logic as SSID
      const passMatches = qr.value.match(/P:([^;]+)/g)
      if (passMatches) {
        for (let i = passMatches.length - 1; i >= 0; i--) {
          const match = passMatches[i]
          if (match) {
            const val = match.replace(/^P:/, '')
            if (!val.includes('WIFI:')) {
              password = val
              break
            }
          }
        }
        if (!password && passMatches.length > 0) {
          const firstMatch = passMatches[0]
          if (firstMatch) {
            password = firstMatch.replace(/^P:/, '').replace(/WIFI:/g, '').trim()
          }
        }
      }

      form.wifiSSID = ssid
      form.wifiPassword = password
      break
    }
    case 'location': {
      const locationValue = qr.value.replace('geo:', '')
      const [lat, lng] = locationValue.split(',')
      form.locationLat = lat?.trim() ?? ''
      form.locationLng = lng?.trim() ?? ''
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
  const value = getCurrentValue()

  if (!value || value.trim() === '') {
    validationErrors.value.value = 'This field is required'
    return false
  }

  let error: string | null = null

  switch (form.type) {
    case 'url':
      error = validateQRValue('url', value)
      break
    case 'email':
      error = validateQRValue('email', value)
      break
    case 'phone':
      error = validateQRValue('phone', value)
      break
    case 'sms':
      error = validateQRValue('sms', value)
      break
    case 'wifi':
      if (!form.wifiSSID.trim()) {
        error = 'WiFi SSID is required'
      } else if (form.wifiEncryption !== 'nopass' && !form.wifiPassword) {
        error = 'WiFi password is required'
      }
      break
    case 'location':
      if (!form.locationLat || !form.locationLng) {
        error = 'Both latitude and longitude are required'
      } else {
        const lat = parseFloat(form.locationLat)
        const lng = parseFloat(form.locationLng)
        if (isNaN(lat) || isNaN(lng)) {
          error = 'Please enter valid numbers'
        } else if (lat < -90 || lat > 90) {
          error = 'Latitude must be between -90 and 90'
        } else if (lng < -180 || lng > 180) {
          error = 'Longitude must be between -180 and 180'
        }
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
    (form.type === 'location' && !!form.locationLat && !!form.locationLng)

  return validationErrors.value.name === '' &&
         validationErrors.value.value === '' &&
         form.name.trim() !== '' &&
         hasValue
})

const hasChanges = computed<boolean>(() => {
  if (!originalQR.value) return false
  if (form.name !== originalQR.value.name) return true
  if (form.type !== originalQR.value.type) return true
  return getFullQRContent() !== originalQR.value.value
})

watch([() => form.type, () => form.urlValue, () => form.textValue,
        () => form.emailTo, () => form.emailSubject, () => form.emailBody,
        () => form.phoneNumber, () => form.smsNumber, () => form.smsMessage,
        () => form.wifiSSID, () => form.wifiEncryption, () => form.wifiPassword,
        () => form.locationLat, () => form.locationLng], () => {
  if (originalQR.value) {
    previewContent.value = getFullQRContent()
    validateFormValue()
  }
}, { deep: true })

async function loadQRData() {
  isLoading.value = true
  try {
    const qrData = await getQRCodeById(qrId.value)
    originalQR.value = qrData
    setFormValueFromQR(qrData)
    qrSrc.value = qrData.qrSrc || ''
    previewContent.value = getFullQRContent()
  } catch (error) {
    console.error('Error loading QR:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load QR code data',
      life: 4000
    })
    router.push('/dashboard')
  } finally {
    isLoading.value = false
  }
}

async function updateQR() {
  if (!validateName() || !validateFormValue()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the validation errors',
      life: 4000
    })
    return
  }

  isSaving.value = true

  try {
    const updateData: any = {
      name: form.name.trim(),
      type: form.type,
      value: getFullQRContent()
    }

    if (form.type === 'wifi') {
      updateData.wifiEncryption = form.wifiEncryption
      updateData.wifiPassword = form.wifiPassword
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
      life: 3000
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
      life: 4000
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
}

onMounted(() => {
  loadQRData()
})
</script>

<template>
  <!-- Template remains unchanged -->
  <div class="flex items-center justify-center min-h-screen">
    <div class="max-w-2xl mx-auto w-full px-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </div>
          <h1 class="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Edit QR Code
          </h1>
          <p class="text-gray-600 mt-2">Update your QR code information</p>
        </div>

        <!-- Skeleton Loader -->
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
            <label class="block text-sm font-semibold text-gray-700 mb-3 text-center">Current QR Code</label>
            <div class="flex justify-center">
              <div class="bg-white p-3 rounded-xl shadow-md border border-gray-200">
                <img :src="qrSrc" :alt="form.name" class="w-32 h-32 object-contain" />
              </div>
            </div>
            <p class="text-xs text-gray-500 text-center mt-2">QR code image will remain the same</p>
          </div>

          <!-- QR Type Tabs -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">QR Type</label>
            <div class="grid grid-cols-4 gap-2">
              <Button
              severity="secondary" variant="outlined"
                v-for="type in QR_TYPES"
                :key="type.value"
                @click="setType(type.value)"
                class="flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer"
                :class="activeTab === type.value
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'"
              >
                <i :class="type.icon" class="text-lg"></i>
                <span class="text-xs">{{ type.label }}</span>
              </Button>
            </div>
          </div>

          <!-- Form Fields -->
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
            <p v-if="validationErrors.name" class="text-red-500 text-xs mt-1">{{ validationErrors.name }}</p>
          </div>

          <!-- URL Type -->
          <div v-if="form.type === 'url'">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Destination URL <span class="text-red-500">*</span></label>
            <InputText
              type="url"
              v-model="form.urlValue"
              placeholder="https://example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.value }"
              @input="validateFormValue"
              @blur="validateFormValue"
            />
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">{{ validationErrors.value }}</p>
          </div>

          <!-- Text Type -->
          <div v-if="form.type === 'text'">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Text Content <span class="text-red-500">*</span></label>
            <Textarea
              v-model="form.textValue"
              placeholder="Enter your text content here..."
              rows="5"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
              :class="{ 'border-red-500': validationErrors.value }"
              @input="validateFormValue"
              @blur="validateFormValue"
            />
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">{{ validationErrors.value }}</p>
          </div>

          <!-- Email Type -->
          <div v-if="form.type === 'email'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Email Address <span class="text-red-500">*</span></label>
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
                <label class="block text-sm font-semibold text-gray-700 mb-2">Subject (Optional)</label>
                <InputText 
                  type="text" 
                  v-model="form.emailSubject" 
                  placeholder="Email subject" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Body (Optional)</label>
                <Textarea 
                  v-model="form.emailBody" 
                  placeholder="Email body content..." 
                  rows="3" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                />
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">{{ validationErrors.value }}</p>
            </div>
          </div>

          <!-- Phone Type -->
          <div v-if="form.type === 'phone'">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span class="text-red-500">*</span></label>
            <InputText
              type="tel"
              v-model="form.phoneNumber"
              placeholder="+1234567890"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': validationErrors.value }"
              @input="validateFormValue"
              @blur="validateFormValue"
            />
            <p v-if="validationErrors.value" class="text-red-500 text-xs mt-1">{{ validationErrors.value }}</p>
          </div>

          <!-- SMS Type -->
          <div v-if="form.type === 'sms'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span class="text-red-500">*</span></label>
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
                <label class="block text-sm font-semibold text-gray-700 mb-2">Message (Optional)</label>
                <Textarea 
                  v-model="form.smsMessage" 
                  placeholder="Pre-filled SMS message..." 
                  rows="3" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                />
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">{{ validationErrors.value }}</p>
            </div>
          </div>

          <!-- WiFi Type -->
          <div v-if="form.type === 'wifi'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Network SSID <span class="text-red-500">*</span></label>
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
                <label class="block text-sm font-semibold text-gray-700 mb-2">Encryption Type</label>
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
                <label class="block text-sm font-semibold text-gray-700 mb-2">Password <span class="text-red-500">*</span></label>
                <InputText 
                  type="password" 
                  v-model="form.wifiPassword" 
                  placeholder="WiFi Password" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  :class="{ 'border-red-500': validationErrors.value }" 
                  @input="validateFormValue" 
                />
              </div>
              <p v-if="validationErrors.value" class="text-red-500 text-xs">{{ validationErrors.value }}</p>
            </div>
          </div>

          <!-- Location Type -->
          <div v-if="form.type === 'location'">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Latitude <span class="text-red-500">*</span></label>
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
                <label class="block text-sm font-semibold text-gray-700 mb-2">Longitude <span class="text-red-500">*</span></label>
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
              <p v-if="validationErrors.value" class="text-red-500 text-xs">{{ validationErrors.value }}</p>
              <p class="text-gray-400 text-xs">Example: 40.7128, -74.0060 (New York City)</p>
            </div>
          </div>

          <!-- Preview Content -->
          <div v-if="previewContent" class="bg-gray-100 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">Preview Content:</p>
            <p class="text-sm text-blue-600 break-all">{{ previewContent }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <Button
              severity="secondary" variant="outlined"
              @click="cancel"
              class="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              @click="updateQR"
              :disabled="!isFormValid || !hasChanges || isSaving"
              class="flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              :class="!isFormValid || !hasChanges || isSaving
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'"
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