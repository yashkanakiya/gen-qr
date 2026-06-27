<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
    <h1 class="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
    <p class="text-gray-600 mb-8">Have questions or feedback? We'd love to hear from you.</p>
    <form @submit.prevent="handleSubmit" class="bg-white p-8 rounded-xl shadow-md space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <InputText v-model="form.name" class="w-full" placeholder="Your name" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <InputText
          v-model="form.email"
          type="email"
          class="w-full"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <Textarea
          v-model="form.message"
          rows="5"
          class="w-full"
          placeholder="How can we help?"
          required
        />
      </div>
      <Button
        type="submit"
        label="Send Message"
        class="w-full bg-linear-to-r! from-blue-600! to-indigo-600! text-white! font-semibold! rounded-lg! shadow-md! hover:shadow-lg! transition-all border-none!"
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
import { reactive } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const toast = useToast()
const form = reactive({ name: '', email: '', message: '' })

function handleSubmit() {
  toast.add({
    severity: 'success',
    summary: 'Message Sent',
    detail: 'We will get back to you soon!',
    life: 3000,
  })
  Object.assign(form, { name: '', email: '', message: '' })
}
</script>
