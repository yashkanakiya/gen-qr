<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
    <h1 class="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
    <p class="text-gray-600 mb-8">Have questions or feedback? We'd love to hear from you.</p>
    <form @submit.prevent="handleSubmit" class="bg-white p-8 rounded-xl shadow-md space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <InputText
          v-model="form.name"
          class="w-full"
          placeholder="Your name"
          :class="{ 'border-red-500': errors.name }"
        />
        <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <InputText
          v-model="form.email"
          type="email"
          class="w-full"
          placeholder="you@gmail.com"
          :class="{ 'border-red-500': errors.email }"
        />
        <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <Textarea
          v-model="form.message"
          rows="5"
          class="w-full"
          placeholder="How can we help?"
          :class="{ 'border-red-500': errors.message }"
        />
        <p v-if="errors.message" class="text-red-500 text-xs mt-1">{{ errors.message }}</p>
      </div>
      <Button
        type="submit"
        label="Send Message"
        class="w-full bg-linear-to-r! from-blue-600! to-indigo-600! text-white! font-semibold! rounded-lg! shadow-md! hover:shadow-lg! transition-all border-none!"
        :disabled="isSending"
      />
    </form>
    <div class="mt-8 text-center text-gray-500 text-sm">
      <p>
        Or reach us directly at
        <a href="mailto:support@genqr.com" class="text-blue-600 hover:underline"
          >support@genqr.com</a
        >
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import emailjs from '@emailjs/browser'

const toast = useToast()
const isSending = ref(false)

const form = reactive({ name: '', email: '', message: '' })
const errors = reactive({ name: '', email: '', message: '' })

// ---------- Replace these with your actual EmailJS credentials ----------
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_v8s7opj'
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_hn9vtey'
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'u8kFo9aMRJLnv4I6E'
// -----------------------------------------------------------------------

function validate(): boolean {
  let isValid = true
  errors.name = ''
  errors.email = ''
  errors.message = ''

  if (!form.name.trim()) {
    errors.name = 'Name is required.'
    isValid = false
  } else if (form.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters.'
    isValid = false
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
  if (!form.email.trim()) {
    errors.email = 'Email is required.'
    isValid = false
  } else if (!emailPattern.test(form.email.trim())) {
    errors.email = 'Please enter a valid Gmail address (e.g., user@gmail.com).'
    isValid = false
  }

  if (!form.message.trim()) {
    errors.message = 'Message is required.'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validate()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the highlighted fields.',
      life: 3000,
    })
    return
  }

  isSending.value = true

  try {
    // Prepare template parameters – adjust names to match your EmailJS template
    const templateParams = {
      name: form.name,
      email: form.email,
      message: form.message,
      // If your template expects other variables, add them here
    }

    // Send using EmailJS
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
      publicKey: PUBLIC_KEY,
    })

    if (response.status === 200) {
      toast.add({
        severity: 'success',
        summary: 'Message Sent',
        detail: 'We will get back to you soon!',
        life: 3000,
      })
      // Reset form
      Object.assign(form, { name: '', email: '', message: '' })
    } else {
      throw new Error('Unexpected response')
    }
  } catch (error) {
    console.error('EmailJS error:', error)
    toast.add({
      severity: 'error',
      summary: 'Submission Failed',
      detail: 'Please try again later.',
      life: 3000,
    })
  } finally {
    isSending.value = false
  }
}
</script>
