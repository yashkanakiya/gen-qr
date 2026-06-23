// src/utils/qrContentGenerator.ts

export interface QRType {
  value: string
  label: string
  icon: string
  placeholder: string
}

export const QR_TYPES: QRType[] = [
  { value: 'url', label: 'URL', icon: 'pi pi-globe', placeholder: 'https://example.com' },
  { value: 'text', label: 'Text', icon: 'pi pi-file', placeholder: 'Enter your text here...' },
  { value: 'email', label: 'Email', icon: 'pi pi-envelope', placeholder: 'recipient@example.com' },
  { value: 'phone', label: 'Phone', icon: 'pi pi-phone', placeholder: '+1234567890' },
  { value: 'sms', label: 'SMS', icon: 'pi pi-comment', placeholder: '+1234567890' },
  { value: 'wifi', label: 'WiFi', icon: 'pi pi-wifi', placeholder: 'SSID' },
  {
    value: 'location',
    label: 'Location',
    icon: 'pi pi-map-marker',
    placeholder: 'Latitude,Longitude',
  },
]

interface WifiExtraData {
  encryption?: string
  password?: string
}

export const generateQRContent = (
  type: string,
  value: string | null | undefined,
  extraData: WifiExtraData = {},
): string => {
  // Handle undefined or null value
  if (!value) {
    return ''
  }

  const trimmedValue = typeof value === 'string' ? value.trim() : String(value)

  switch (type) {
    case 'url':
      return trimmedValue
    case 'text':
      return trimmedValue
    case 'email':
      return `mailto:${trimmedValue}`
    case 'phone':
      return `tel:${trimmedValue}`
    case 'sms':
      return `SMSTO:${trimmedValue}:`
    case 'wifi': {
      const encryption = extraData.encryption || 'WPA'
      const password = extraData.password || ''
      if (encryption === 'nopass') {
        return `WIFI:S:${trimmedValue};;`
      }
      return `WIFI:T:${encryption};S:${trimmedValue};P:${password};;`
    }
    case 'location': {
      // Handle location format
      const parts = trimmedValue.split(',')
      if (parts.length === 2) {
        const latStr = parts[0]
        const lngStr = parts[1]
        if (latStr !== undefined && lngStr !== undefined) {
          const lat = parseFloat(latStr)
          const lng = parseFloat(lngStr)
          if (!isNaN(lat) && !isNaN(lng)) {
            return `geo:${lat},${lng}`
          }
        }
      }
      return trimmedValue // Return as is if invalid
    }
    default:
      return trimmedValue
  }
}

export const validateQRValue = (type: string, value: unknown): string | null => {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return 'This field is required'
  }

  const trimmedValue = value.trim()

  switch (type) {
    case 'url': {
      const urlRegex = /^https?:\/\/.+/i
      if (!urlRegex.test(trimmedValue)) {
        return 'URL must start with http:// or https://'
      }
      break
    }
    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedValue)) {
        return 'Please enter a valid email address'
      }
      break
    }
    case 'phone':
    case 'sms': {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
      if (!phoneRegex.test(trimmedValue)) {
        return 'Please enter a valid phone number'
      }
      break
    }
    case 'location': {
      const parts = trimmedValue.split(',')
      if (parts.length !== 2) {
        return 'Please enter valid coordinates (latitude,longitude)'
      }
      const latStr = parts[0]
      const lngStr = parts[1]
      if (latStr === undefined || lngStr === undefined) {
        return 'Please enter valid coordinates (latitude,longitude)'
      }
      const lat = parseFloat(latStr)
      const lng = parseFloat(lngStr)
      if (isNaN(lat) || isNaN(lng)) {
        return 'Please enter valid numbers for latitude and longitude'
      }
      if (lat < -90 || lat > 90) {
        return 'Latitude must be between -90 and 90'
      }
      if (lng < -180 || lng > 180) {
        return 'Longitude must be between -180 and 180'
      }
      break
    }
    case 'wifi': {
      if (trimmedValue.length < 1) {
        return 'WiFi SSID is required'
      }
      break
    }
  }
  return null
}
