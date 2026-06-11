// stores/qrStore.ts
import { ref, type Ref } from 'vue'
import { api } from '../services/api'  // Import shared api instance
import type { AxiosError } from 'axios'  // Keep this for type checking

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

// Remove the local api creation - use the imported one
// const api: AxiosInstance = axios.create({ ... })  // DELETE THIS LINE

// Reactive state
export const qrCodes: Ref<QRCodeItem[]> = ref([])

// Error handling helper
const handleApiError = (error: unknown): never => {
  if (error instanceof Error) {
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
      id: item.id.toString(), // Convert to string if needed
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
      id: item.id.toString(),
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
      const existing = qrCodes.value[index]
      if (existing) {
        if (payload.name) existing.name = payload.name
        if (payload.url) existing.url = payload.url
      }
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