// utils/qrContentGenerator.ts

export interface QrType {
  value: string
  label: string
  icon: string
  placeholder: string
}

export const QR_TYPES: QrType[] = [
  {
    value: 'url',
    label: 'URL',
    icon: 'pi pi-globe',
    placeholder: 'https://example.com',
  },
  {
    value: 'text',
    label: 'Text',
    icon: 'pi pi-file',
    placeholder: 'Enter your text here...',
  },
  {
    value: 'email',
    label: 'Email',
    icon: 'pi pi-envelope',
    placeholder: 'recipient@example.com',
  },
  {
    value: 'phone',
    label: 'Phone',
    icon: 'pi pi-phone',
    placeholder: '+1234567890',
  },
  {
    value: 'sms',
    label: 'SMS',
    icon: 'pi pi-comment',
    placeholder: '+1234567890',
  },
  { value: 'wifi', label: 'WiFi', icon: 'pi pi-wifi', placeholder: 'SSID' },
  {
    value: 'location',
    label: 'Location',
    icon: 'pi pi-map-marker',
    placeholder: 'Latitude,Longitude',
  },
  // NEW TYPES
  {
    value: 'pdf',
    label: 'PDF',
    icon: 'pi pi-file-pdf',
    placeholder: 'https://example.com/document.pdf',
  },
  {
    value: 'event',
    label: 'Event',
    icon: 'pi pi-calendar',
    placeholder: 'Event title',
  },
  {
    value: 'vcard',
    label: 'Visiting Card',
    icon: 'pi pi-id-card',
    placeholder: 'Full Name',
  },
]

/**
 * Extra data structure for different QR types
 */
export interface ExtraData {
  // Email
  subject?: string
  body?: string
  // SMS
  message?: string
  // WiFi
  encryption?: string
  password?: string
  // Event
  title?: string
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  location?: string
  description?: string
  url?: string
  // vCard
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  company?: string
  jobTitle?: string
  address?: string
  website?: string
}

/**
 * Generate the QR code content string based on type and provided data.
 */
export const generateQRContent = (
  type: string,
  value: string,
  extraData: ExtraData = {},
): string => {
  switch (type) {
    case 'url':
    case 'text':
    case 'pdf': // PDF just stores the URL
      return value

    case 'email': {
      let content = `mailto:${value}`
      const params: string[] = []
      if (extraData.subject) params.push(`subject=${encodeURIComponent(extraData.subject)}`)
      if (extraData.body) params.push(`body=${encodeURIComponent(extraData.body)}`)
      if (params.length) content += `?${params.join('&')}`
      return content
    }

    case 'phone':
      return `tel:${value}`

    case 'sms': {
      let content = `smsto:${value}`
      if (extraData.message) content += `:${encodeURIComponent(extraData.message)}`
      return content
    }

    case 'wifi': {
      const encryption = extraData.encryption || 'WPA'
      const password = extraData.password || ''
      if (encryption === 'nopass') {
        return `WIFI:S:${value};;`
      }
      return `WIFI:T:${encryption};S:${value};P:${password};;`
    }

    case 'location': {
      const [lat, lng] = value.split(',')
      return `geo:${lat},${lng}`
    }

    case 'event': {
      // Build iCalendar (VCALENDAR) content
      const {
        title = '',
        startDate = '',
        startTime = '',
        endDate = '',
        endTime = '',
        location = '',
        description = '',
        url = '',
      } = extraData

      // Combine date and time into ISO format
      const startDateTime = combineDateTime(startDate, startTime)
      const endDateTime = combineDateTime(endDate, endTime)

      // Escape special characters for iCalendar
      const escapeText = (text: string): string =>
        text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n')

      let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//QR Generator//EN
BEGIN:VEVENT
SUMMARY:${escapeText(title)}
DTSTART:${startDateTime}
DTEND:${endDateTime}`

      if (location) ics += `\nLOCATION:${escapeText(location)}`
      if (description) ics += `\nDESCRIPTION:${escapeText(description)}`
      if (url) ics += `\nURL:${url}`

      ics += `\nEND:VEVENT
END:VCALENDAR`
      return ics
    }

    case 'vcard': {
      // Build vCard (vCard 3.0) content
      const {
        firstName = '',
        lastName = '',
        phone = '',
        email = '',
        company = '',
        jobTitle = '',
        address = '',
        website = '',
      } = extraData

      const fullName = `${firstName} ${lastName}`.trim()
      const formattedName = fullName || 'No Name'

      let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${formattedName}
N:${lastName};${firstName};;;`

      if (phone) vcard += `\nTEL:${phone}`
      if (email) vcard += `\nEMAIL:${email}`
      if (company) vcard += `\nORG:${company}`
      if (jobTitle) vcard += `\nTITLE:${jobTitle}`
      if (address) vcard += `\nADR:;;${address};;;`
      if (website) vcard += `\nURL:${website}`

      vcard += `\nEND:VCARD`
      return vcard
    }

    default:
      return value
  }
}

/**
 * Helper: Combine date and time into UTC ISO format (YYYYMMDDTHHMMSSZ)
 */
function combineDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) return ''
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm" (24h)
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  const dt = new Date(Date.UTC(year, month - 1, day, hours, minutes))
  // Format as YYYYMMDDTHHMMSSZ
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  )
}

/**
 * Validate the value for a given QR type.
 * For complex types (event, vcard), you may need to pass extraData.
 */
export const validateQRValue = (
  type: string,
  value: string,
  extraData?: ExtraData,
): string | null => {
  if (!value || value.trim() === '') {
    return 'This field is required'
  }

  switch (type) {
    case 'url':
    case 'pdf': {
      const urlRegex = /^https?:\/\/.+/i
      if (!urlRegex.test(value.trim())) {
        return 'URL must start with http:// or https://'
      }
      break
    }

    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value.trim())) {
        return 'Please enter a valid email address'
      }
      break
    }

    case 'phone':
    case 'sms': {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
      if (!phoneRegex.test(value.trim())) {
        return 'Please enter a valid phone number'
      }
      break
    }

    case 'location': {
      const parts = value.split(',')
      if (parts.length !== 2 || isNaN(parseFloat(parts[0])) || isNaN(parseFloat(parts[1]))) {
        return 'Please enter valid coordinates (latitude,longitude)'
      }
      break
    }

    case 'event': {
      // Extra validation for event fields – assume extraData is provided
      if (!extraData) {
        return 'Event details are missing'
      }
      const { startDate, startTime, endDate, endTime } = extraData
      if (!startDate || !startTime || !endDate || !endTime) {
        return 'Please provide start and end date/time'
      }
      // You can add more validation (e.g., date/time format) if needed
      break
    }

    case 'vcard': {
      // value is first name; ensure it's not empty (already handled by empty check)
      if (!value.trim()) {
        return 'First name is required'
      }
      break
    }
  }

  return null
}
