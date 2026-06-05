import axios from 'axios'
import { ref } from 'vue'

const API_BASE_URL = 'http://localhost:3000/api'

// Configure axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Reactive state
export const qrCodes = ref([])

// Error handling helper
const handleApiError = (error) => {
  if (error.response) {
    console.error('API Error Response:', error.response.data)
    throw new Error(error.response.data.error || 'Server error occurred')
  } else if (error.request) {
    console.error('API No Response:', error.request)
    throw new Error(
      'Cannot connect to server. Please make sure the backend is running on port 3000',
    )
  } else {
    console.error('API Error:', error.message)
    throw new Error(error.message || 'An error occurred')
  }
}

// ============= API FUNCTIONS =============

// Load all QR codes
export async function loadQRCodes() {
  try {
    const response = await api.get('/qrcodes')
    qrCodes.value = response.data.map((item) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      qrSrc: item.qr_src,
      createdAt: new Date(item.created_at).toLocaleDateString(),
    }))
    return qrCodes.value
  } catch (error) {
    handleApiError(error)
  }
}

// Get single QR code by ID
export async function getQRCodeById(id) {
  try {
    const response = await api.get(`/qrcodes/${id}`)
    const item = response.data
    return {
      id: item.id,
      name: item.name,
      url: item.url,
      qrSrc: item.qr_src,
      createdAt: new Date(item.created_at).toLocaleDateString(),
    }
  } catch (error) {
    handleApiError(error)
  }
}

// Save a new QR entry
export async function saveQRCode({ name, url }) {
  try {
    const response = await api.post('/qrcodes', {
      name: name.trim(),
      url: url.trim(),
    })
    console.log('Save response:', response.data)
    // Reload the list after save
    await loadQRCodes()
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

// Update QR code - ALWAYS send both name and url
export async function updateQRCode(id, updates) {
  console.log('Store - Updating QR code:', { id, updates })

  // Always ensure both fields are present in the payload
  const payload = {
    name: updates.name ? updates.name.trim() : '',
    url: updates.url ? updates.url.trim() : '',
  }

  try {
    console.log('Store - Sending to API:', payload)
    const response = await api.put(`/qrcodes/${id}`, payload)
    console.log('Store - Update response:', response.data)

    // Update the local state immediately
    const index = qrCodes.value.findIndex((qr) => qr.id === id)
    if (index !== -1) {
      if (payload.name) qrCodes.value[index].name = payload.name
      if (payload.url) qrCodes.value[index].url = payload.url
    }

    return response.data
  } catch (error) {
    console.error('Store - Update error:', error)
    handleApiError(error)
  }
}

// Delete one entry by id
export async function deleteQRCode(id) {
  try {
    await api.delete(`/qrcodes/${id}`)
    // Remove from local state immediately
    const index = qrCodes.value.findIndex((qr) => qr.id === id)
    if (index !== -1) {
      qrCodes.value.splice(index, 1)
    }
    return true
  } catch (error) {
    handleApiError(error)
  }
}

// Refresh the QR codes list
export async function refreshQRCodes() {
  return await loadQRCodes()
}
