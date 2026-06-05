// stores/qrStore.ts
import QRCode from 'qrcode'

const KEY = 'qr_codes'

// Read all saved QR entries
export function loadQRCodes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

// Generate QR code as data URL
async function generateQRCode(url: string): Promise<string> {
  try {
    // Validate URL before generating QR
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL')
    }
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
  } catch (error) {
    console.error('QR generation failed:', error)
    throw error
  }
}

// Validate URL (http or https only)
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// Validate name (min 3 chars, no blank spaces)
function isValidName(name: string): boolean {
  return name.trim().length >= 3 && !name.includes(' ')
}

// Save a new QR entry
export async function saveQRCode({ name, url }: { name: string; url: string }) {
  // Validate inputs
  if (!isValidName(name)) {
    throw new Error('Name must be at least 3 characters and contain no spaces')
  }

  if (!isValidUrl(url)) {
    throw new Error('URL must start with http:// or https://')
  }

  const qrSrc = await generateQRCode(url)
  const list = loadQRCodes()

  list.unshift({
    id: Date.now(),
    name: name.trim(),
    url,
    qrSrc,
    createdAt: new Date().toLocaleDateString(),
  })

  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

// Update name and URL for an existing QR entry
export async function updateQRCode(id: number, updates: { name?: string; url?: string }) {
  const list = loadQRCodes()
  const index = list.findIndex((q) => q.id === id)

  if (index !== -1) {
    // Validate name if provided
    if (updates.name !== undefined) {
      if (!isValidName(updates.name)) {
        throw new Error('Name must be at least 3 characters and contain no spaces')
      }
      list[index].name = updates.name.trim()
    }

    // Validate and update URL if provided
    if (updates.url !== undefined) {
      if (!isValidUrl(updates.url)) {
        throw new Error('URL must start with http:// or https://')
      }
      list[index].url = updates.url

      // Regenerate QR code with new URL
      list[index].qrSrc = await generateQRCode(updates.url)
    }

    localStorage.setItem(KEY, JSON.stringify(list))
  }

  return list
}

// Delete one entry by id
export function deleteQRCode(id: number) {
  const list = loadQRCodes().filter((q) => q.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

// Get single QR entry by id
export function getQRCodeById(id: number) {
  const list = loadQRCodes()
  return list.find((q) => q.id === id)
}
