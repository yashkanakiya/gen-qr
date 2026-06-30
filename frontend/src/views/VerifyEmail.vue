<template>
  <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and Title -->
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <i class="pi pi-check-circle text-white text-3xl"></i>
          </div>
        </div>
        <h2 class="text-3xl font-bold text-gray-900">Verify Your Email</h2>
        <p class="text-gray-600 mt-2">Click the button below to verify your account</p>
      </div>

      <!-- Verification Card -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div class="text-center space-y-6">
          <div class="flex justify-center">
            <div class="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
              <i class="pi pi-envelope text-blue-600 text-5xl"></i>
            </div>
          </div>
          <p class="text-gray-600">
            We sent a verification link to your email address.
            <br />
            <span class="font-medium">Click the button below to verify your account.</span>
          </p>

          <Button
            :loading="isVerifying"
            :disabled="isVerifying"
            label="Verify Email"
            icon="pi pi-check"
            class="w-full justify-center"
            severity="primary"
            @click="verifyEmail"
          />

          <div class="text-sm text-gray-500">
            <router-link to="/login" class="text-blue-600 hover:text-blue-700">
              Back to login
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { verifyUser } from '../stores/authStore'
import axios from 'axios'
import Button from 'primevue/button'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const isVerifying = ref(false)

const userId = ref<string | null>(null)

onMounted(() => {
  const id = route.query.userId as string
  if (!id) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Missing user information. Please sign up again.',
      life: 4000,
    })
    router.push('/signup')
    return
  }
  userId.value = id
})

async function verifyEmail() {
  if (!userId.value) return

  isVerifying.value = true

  try {
    await verifyUser(userId.value)
    toast.add({
      severity: 'success',
      summary: 'Verified',
      detail: 'Your email has been verified. Welcome!',
      life: 3000,
    })
    router.push('/dashboard')
  } catch (error: any) {
    let errorMessage = 'Verification failed. Please try again.'
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) errorMessage = error.response.data.error
      else if (error.response?.data?.message) errorMessage = error.response.data.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    toast.add({
      severity: 'error',
      summary: 'Verification Failed',
      detail: errorMessage,
      life: 4000,
    })
  } finally {
    isVerifying.value = false
  }
}
</script>
