<template>
  <div>
    <DataTable v-if="qrCodes.length" :value="qrCodes" tableStyle="min-width: 50rem">
      <Column field="id" header="ID"></Column>
      <Column field="name" header="Name"></Column>
      <Column field="url" header="URL">
      <template #body="{ data }">
        <div>
          <img :src="data.qrSrc" :alt="data.name" width="60" height="60" />
        </div>
      </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import { ref, onMounted } from 'vue'

// All saved QR entries loaded from localStorage
// Each entry shape:
// {
//   id        : number   — timestamp used as unique id
//   name      : string   — human label
//   url       : string   — destination URL
//   qrSrc     : string   — QR image URL (api.qrserver.com or base64)
//   createdAt : string   — formatted date string
// }
const qrCodes = ref([])

// Load from localStorage on mount
onMounted(() => {
  const saved = localStorage.getItem('qr_codes')
  if (saved) qrCodes.value = JSON.parse(saved)
})

// Delete one entry by id
function deleteQR(id) {
  qrCodes.value = qrCodes.value.filter((q) => q.id !== id)
  localStorage.setItem('qr_codes', JSON.stringify(qrCodes.value))
}

// ── Called from CreateQR when saving ──────────────────
// Import and call this from your CreateQR component,
// or use a shared store (Pinia / provide-inject).
//
// Example usage in CreateQR.vue:
//
//   import { saveQR } from './qrStorage.js'
//   saveQR({ name: form.name, url: form.url, qrSrc: qrSrc.value })
//
// Or inline the same logic in CreateQR:
//
//   const existing = JSON.parse(localStorage.getItem('qr_codes') || '[]')
//   existing.unshift({
//     id        : Date.now(),
//     name      : form.name,
//     url       : form.url,
//     qrSrc     : qrSrc.value,
//     createdAt : new Date().toLocaleDateString(),
//   })
//   localStorage.setItem('qr_codes', JSON.stringify(existing))
</script>
