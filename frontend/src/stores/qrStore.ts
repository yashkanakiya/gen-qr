// stores/qrStore.ts
import { ref, type Ref } from 'vue'
import { api } from '../services/api'

export interface QRCodeItem {
  id: string
  slug: string
  name: string
  type: string
  value: string
  qrSrc?: string
  scan_count: number
  created_at: string
  updated_at: string
}

export interface ScanAnalytics {
  total_scans: number
  unique_visitors: number
  countries: number
  last_scan: string | null
  scans_by_day: Array<{ date: string; count: number }>
  recent_scans: Array<{
    scanned_at: string
    ip: string
    country: string
    device_type: string
    browser: string
    os: string
  }>
}

interface QRCodeApiResponse {
  id: string
  slug: string
  name: string
  type: string
  value: string
  qr_src?: string
  scan_count: number
  created_at: string
  updated_at: string
}

export const qrCodes: Ref<QRCodeItem[]> = ref([])

const handleApiError = (error: unknown): never => {
  if (error instanceof Error) {
    console.error('Error:', error.message)
    throw new Error(error.message || 'An error occurred')
  } else {
    console.error('Unknown error:', error)
    throw new Error('An unknown error occurred')
  }
}

export async function loadQRCodes(): Promise<QRCodeItem[]> {
  try {
    const response = await api.get<QRCodeApiResponse[]>('/qrcodes')
    qrCodes.value = response.data.map((item) => ({
      id: item.id.toString(),
      slug: item.slug,
      name: item.name,
      type: item.type,
      value: item.value,
      qrSrc: item.qr_src,
      scan_count: item.scan_count || 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))
    return qrCodes.value
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function getQRCodeById(id: string): Promise<QRCodeItem> {
  try {
    const response = await api.get<QRCodeApiResponse>(`/qrcodes/${id}`)
    const item = response.data
    return {
      id: item.id.toString(),
      slug: item.slug,
      name: item.name,
      type: item.type,
      value: item.value,
      qrSrc: item.qr_src,
      scan_count: item.scan_count || 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function getQRCodeAnalytics(id: string): Promise<ScanAnalytics> {
  try {
    const response = await api.get<ScanAnalytics>(`/qrcodes/${id}/analytics`)
    return response.data
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function saveQRCode(data: { 
  name: string; 
  type: string; 
  value: string;
  wifiEncryption?: string;
  wifiPassword?: string;
}): Promise<QRCodeApiResponse> {
  try {
    const response = await api.post<QRCodeApiResponse>('/qrcodes', data)
    await loadQRCodes()
    return response.data
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function updateQRCode(id: string, updates: { 
  name?: string; 
  value?: string; 
  type?: string;
  wifiEncryption?: string;
  wifiPassword?: string;
}): Promise<QRCodeApiResponse> {
  try {
    const response = await api.put<QRCodeApiResponse>(`/qrcodes/${id}`, updates)
    const index = qrCodes.value.findIndex((qr) => qr.id === id)
    if (index !== -1) {
      const qr = qrCodes.value[index]
      if (qr) {
        if (updates.name !== undefined) qr.name = updates.name
        if (updates.value !== undefined) qr.value = updates.value
        if (updates.type !== undefined) qr.type = updates.type
      }
    }
    return response.data
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function deleteQRCode(id: string): Promise<boolean> {
  try {
    await api.delete(`/qrcodes/${id}`)
    const index = qrCodes.value.findIndex((qr) => qr.id === id)
    if (index !== -1) {
      qrCodes.value.splice(index, 1)
    }
    return true
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function refreshQRCodes(): Promise<QRCodeItem[]> {
  return await loadQRCodes()
}

export function getRedirectUrl(slug: string): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  // Remove '/api' from the base URL if it's included
  const baseUrl = apiBaseUrl.replace('/api', '')
  return `${baseUrl}/r/${slug}`
}