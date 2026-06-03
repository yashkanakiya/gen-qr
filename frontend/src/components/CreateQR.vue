<template>
  <div class="create-qr">

    <!-- ── INPUTS ─────────────────────────────── -->

    <!-- Field 1: Name — text input, human-readable label for this QR -->
    <InputText type="text" v-model="form.name" placeholder="Name (e.g. My Portfolio)" />

    <!-- Field 2: Destination URL — the URL the QR code encodes -->
    <InputText type="text" v-model="form.url" placeholder="Destination URL (e.g. https://example.com)" />

    <!-- Action: Generate button -->
    <Button label="Generate QR" @click="generateQR"/>

    <!-- ── OUTPUT ─────────────────────────────── -->

    <!-- Generated QR Code — shown only after generation -->
    <!-- src comes from a QR API or library, driven by form.url -->
    <img
      v-if="qrSrc"
      :src="qrSrc"
      alt="Generated QR Code"
    />

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { saveQRCode } from '../stores/qrStore.ts'


// Form fields
const form = reactive({
  name: '',   // string — label for this QR code
  url: '',    // string — destination URL to encode
})

// Output
const qrSrc = ref('') // string — URL of the generated QR image

function generateQR() {
  if (!form.url) return
  // TODO: replace with your QR library or API call
  // Example using api.qrserver.com (free, no key needed):
  qrSrc.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(form.url)}`
  saveQRCode({ name: form.name, url: form.url, qrSrc: qrSrc.value })
}


</script>