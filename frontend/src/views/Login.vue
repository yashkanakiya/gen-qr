<template>
  <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and Title -->
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <i class="pi pi-qrcode text-white text-3xl"></i>
          </div>
        </div>
        <h2 class="text-3xl font-bold text-gray-900">Welcome back!</h2>
        <p class="text-gray-600 mt-2">Enter your credentials to access your account</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Email Address </label>
            <InputText
              v-model="form.email"
              type="email"
              required
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
              placeholder="name@example.com"
              @input="errors.email = ''"
              @blur="validateField('email')"
            />
            <span v-if="errors.email" class="text-red-500 text-sm mt-1 block">{{
              errors.email
            }}</span>
          </div>

          <!-- Password Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Password </label>
            <Password
              v-model="form.password"
              toggleMask
              fluid
              required
              placeholder="Enter your password"
              :class="{ 'p-invalid': errors.password }"
              @input="errors.password = ''"
              @blur="validateField('password')"
            />
            <span v-if="errors.password" class="text-red-500 text-sm mt-1 block">{{
              errors.password
            }}</span>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="rememberMe"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" class="text-sm text-blue-600 hover:text-blue-700">Forgot password?</a>
          </div>

          <!-- Login Button -->
          <Button
            type="submit"
            :loading="isLoading"
            :disabled="isLoading"
            label="Log In"
            class="w-full justify-center"
            severity="primary"
          />

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <!-- Social Login (disabled) -->
          <div class="grid grid-cols-2 gap-3">
            <Button
              type="button"
              label="Google"
              icon="pi pi-google"
              class="w-full justify-center"
              severity="secondary"
              disabled
            />
            <Button
              type="button"
              label="GitHub"
              icon="pi pi-github"
              class="w-full justify-center"
              severity="secondary"
              disabled
            />
          </div>
        </form>
      </div>

      <!-- Sign Up Link -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <router-link to="/signup" class="font-medium text-blue-600 hover:text-blue-700">
            Create an account
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
import { login } from '../stores/authStore'
import axios from 'axios'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const router = useRouter()
const toast = useToast()
const isLoading = ref(false)
const rememberMe = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateField(field: 'email' | 'password') {
  errors[field] = ''
  if (field === 'email') {
    if (!form.email) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Please enter a valid email address'
    }
  } else if (field === 'password') {
    if (!form.password) {
      errors.password = 'Password is required'
    }
  }
}

function validateForm(): boolean {
  let valid = true
  errors.email = ''
  errors.password = ''

  if (!form.email) {
    errors.email = 'Email is required'
    valid = false
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Please enter a valid email address'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password is required'
    valid = false
  }

  return valid
}

async function handleLogin() {
  if (!validateForm()) return

  isLoading.value = true

  try {
    await login(form)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Logged in successfully!',
      life: 3000,
    })
    router.push('/dashboard')
  } catch (error: any) {
    let errorMessage = 'Invalid email or password'

    if (axios.isAxiosError(error)) {
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
      summary: 'Login Failed',
      detail: errorMessage,
      life: 4000,
    })
  } finally {
    isLoading.value = false
  }
}
</script>
