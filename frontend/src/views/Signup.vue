<template>
  <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and Title -->
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <i class="pi pi-user-plus text-white text-3xl"></i>
          </div>
        </div>
        <h2 class="text-3xl font-bold text-gray-900">Create account</h2>
        <p class="text-gray-600 mt-2">Only takes a few seconds</p>
      </div>

      <!-- Signup Card -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <form @submit.prevent="handleSignup" class="space-y-5">
          <!-- Username Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Username </label>
            <div class="relative">
              <i
                class="pi pi-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              ></i>
              <input
                v-model="form.username"
                type="text"
                required
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="johndoe"
              />
            </div>
          </div>

          <!-- Email Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Email Address </label>
            <div class="relative">
              <i
                class="pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              ></i>
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Password </label>
            <div class="relative">
              <i
                class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              ></i>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Create a password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <div class="mt-2 text-xs text-gray-500">Password must be at least 6 characters</div>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Confirm Password </label>
            <div class="relative">
              <i
                class="pi pi-check-circle absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              ></i>
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Terms Agreement -->
          <div class="flex items-start">
            <input
              type="checkbox"
              v-model="agreeTerms"
              class="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label class="ml-2 text-sm text-gray-600">
              I agree to the
              <a href="#" class="text-blue-600 hover:text-blue-700">Terms of Service</a>
              and
              <a href="#" class="text-blue-600 hover:text-blue-700">Privacy Policy</a>
            </label>
          </div>

          <!-- Signup Button -->
          <button
            type="submit"
            :disabled="isLoading || !agreeTerms"
            class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isLoading ? 'Creating account...' : 'Sign Up' }}
          </button>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          <!-- Social Signup -->
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <i class="pi pi-google mr-2"></i>
              Google
            </button>
            <button
              type="button"
              class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <i class="pi pi-github mr-2"></i>
              GitHub
            </button>
          </div>
        </form>
      </div>

      <!-- Login Link -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          Already have an account?
          <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-700">
            Log in here
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { signup } from '../stores/authStore'
import axios from 'axios'

const router = useRouter()
const toast = useToast()
const isLoading = ref(false)
const agreeTerms = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

async function handleSignup() {
  // Validation
  if (!form.username || !form.email || !form.password || !form.confirmPassword) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fill in all fields',
      life: 4000,
    })
    return
  }

  if (form.password.length < 6) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Password must be at least 6 characters',
      life: 4000,
    })
    return
  }

  if (form.password !== form.confirmPassword) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Passwords do not match',
      life: 4000,
    })
    return
  }

  if (!agreeTerms.value) {
    toast.add({
      severity: 'warn',
      summary: 'Terms Required',
      detail: 'Please agree to the Terms of Service and Privacy Policy',
      life: 4000,
    })
    return
  }

  isLoading.value = true

  try {
    await signup(form)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Account created successfully!',
      life: 3000,
    })
    router.push('/dashboard')
  } catch (error: any) {
    // Properly extract error message from backend
    let errorMessage = 'Failed to create account'

    if (axios.isAxiosError(error)) {
      // Handle axios error
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    toast.add({
      severity: 'error',
      summary: 'Signup Failed',
      detail: errorMessage,
      life: 4000,
    })
  } finally {
    isLoading.value = false
  }
}
</script>
