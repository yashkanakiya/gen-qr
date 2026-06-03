// qrStorage.js
// Shared localStorage helpers used by CreateQR.vue and QRDashboard.vue

const KEY = 'qr_codes'

// Read all saved QR entries
export function loadQRCodes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

// Save a new QR entry
// Expects: { name: string, url: string, qrSrc: string }
export function saveQRCode({ name, url, qrSrc }) {
  const list = loadQRCodes()
  list.unshift({
    id: Date.now(), // unique id
    name, // human label
    url, // destination URL
    qrSrc, // QR image URL or base64
    createdAt: new Date().toLocaleDateString(),
  })
  localStorage.setItem(KEY, JSON.stringify(list))
}

// Delete one entry by id
export function deleteQRCode(id) {
  const list = loadQRCodes().filter((q) => q.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}
