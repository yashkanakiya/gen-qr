import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'
import { ref, type Ref } from 'vue'

const API_BASE_URL = 'http://localhost:3000/api'

// ============= TYPE DEFINITIONS =============

export interface QRCodeItem {
  id: string
  name: string
  url: string
  qrSrc?: string
  createdAt: string
}

interface QRCodeApiResponse {
  id: string
  name: string
  url: string
  qr_src?: string
  created_at: string
}

interface SaveQRCodeData {
  name: string
  url: string
}

interface UpdateQRCodeData {
  name?: string
  url?: string
}

// Configure axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Reactive state
export const qrCodes: Ref<QRCodeItem[]> = ref([])

// Error handling helper
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string }>
    
    if (axiosError.response) {
      console.error('API Error Response:', axiosError.response.data)
      throw new Error(axiosError.response.data?.error || 'Server error occurred')
    } else if (axiosError.request) {
      console.error('API No Response:', axiosError.request)
      throw new Error(
        'Cannot connect to server. Please make sure the backend is running on port 3000',
      )
    } else {
      console.error('API Error:', axiosError.message)
      throw new Error(axiosError.message || 'An error occurred')
    }
  } else if (error instanceof Error) {
    console.error('Error:', error.message)
    throw new Error(error.message || 'An error occurred')
  } else {
    console.error('Unknown error:', error)
    throw new Error('An unknown error occurred')
  }
}

// ============= API FUNCTIONS =============

// Load all QR codes
export async function loadQRCodes(): Promise<QRCodeItem[]> {
  try {
    const response = await api.get<QRCodeApiResponse[]>('/qrcodes')
    qrCodes.value = response.data.map((item: QRCodeApiResponse) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      qrSrc: item.qr_src,
      createdAt: new Date(item.created_at).toLocaleDateString(),
    }))
    return qrCodes.value
  } catch (error) {
    throw handleApiError(error)
  }
}

// Get single QR code by ID
export async function getQRCodeById(id: string): Promise<QRCodeItem> {
  try {
    const response = await api.get<QRCodeApiResponse>(`/qrcodes/${id}`)
    const item = response.data
    return {
      id: item.id,
      name: item.name,
      url: item.url,
      qrSrc: item.qr_src,
      createdAt: new Date(item.created_at).toLocaleDateString(),
    }
  } catch (error) {
    throw handleApiError(error)
  }
}

// Save a new QR entry
export async function saveQRCode({ name, url }: SaveQRCodeData): Promise<QRCodeApiResponse> {
  try {
    const response = await api.post<QRCodeApiResponse>('/qrcodes', {
      name: name.trim(),
      url: url.trim(),
    })
    console.log('Save response:', response.data)
    // Reload the list after save
    await loadQRCodes()
    return response.data
  } catch (error) {
    throw handleApiError(error)
  }
}

// Update QR code - ALWAYS send both name and url
export async function updateQRCode(id: string, updates: UpdateQRCodeData): Promise<QRCodeApiResponse> {
  console.log('Store - Updating QR code:', { id, updates })

  // Always ensure both fields are present in the payload
  const payload: { name: string; url: string } = {
    name: updates.name ? updates.name.trim() : '',
    url: updates.url ? updates.url.trim() : '',
  }

  try {
    console.log('Store - Sending to API:', payload)
    const response = await api.put<QRCodeApiResponse>(`/qrcodes/${id}`, payload)
    console.log('Store - Update response:', response.data)

    // Update the local state immediately
    const index = qrCodes.value.findIndex((qr: QRCodeItem) => qr.id === id)
    if (index !== -1) {
      if (payload.name) qrCodes.value[index].name = payload.name
      if (payload.url) qrCodes.value[index].url = payload.url
    }

    return response.data
  } catch (error) {
    console.error('Store - Update error:', error)
    throw handleApiError(error)
  }
}

// Delete one entry by id
export async function deleteQRCode(id: string): Promise<boolean> {
  try {
    await api.delete(`/qrcodes/${id}`)
    // Remove from local state immediately
    const index = qrCodes.value.findIndex((qr: QRCodeItem) => qr.id === id)
    if (index !== -1) {
      qrCodes.value.splice(index, 1)
    }
    return true
  } catch (error) {
    throw handleApiError(error)
  }
}

// Refresh the QR codes list
export async function refreshQRCodes(): Promise<QRCodeItem[]> {
  return await loadQRCodes()
}