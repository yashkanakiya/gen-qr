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
            <InputText
              v-model="form.username"
              type="text"
              required
              class="w-full"
              :class="{ 'p-invalid': errors.username }"
              placeholder="johndoe"
              @input="errors.username = ''"
              @blur="validateField('username')"
            />
            <span v-if="errors.username" class="text-red-500 text-sm mt-1 block">{{
              errors.username
            }}</span>
          </div>

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
              placeholder="Create a password"
              :class="{ 'p-invalid': errors.password }"
              @input="errors.password = ''"
              @blur="validateField('password')"
            />
            <span v-if="errors.password" class="text-red-500 text-sm mt-1 block">{{
              errors.password
            }}</span>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Confirm Password </label>
            <Password
              v-model="form.confirmPassword"
              toggleMask
              fluid
              required
              placeholder="Confirm your password"
              :class="{ 'p-invalid': errors.confirmPassword }"
              @input="errors.confirmPassword = ''"
              @blur="validateField('confirmPassword')"
            />
            <span v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1 block">{{
              errors.confirmPassword
            }}</span>
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
          <span v-if="errors.terms" class="text-red-500 text-sm block">{{ errors.terms }}</span>

          <!-- Signup Button -->
          <Button
            type="submit"
            :loading="isLoading"
            :disabled="isLoading || !agreeTerms"
            label="Sign Up"
            class="w-full justify-center"
            severity="primary"
          />

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          <!-- Social Signup (disabled) -->
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
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const router = useRouter()
const toast = useToast()
const isLoading = ref(false)
const agreeTerms = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: '',
})

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateField(field: keyof typeof form) {
  // Clear the error for this field
  errors[field as keyof typeof errors] = ''

  if (field === 'username') {
    if (!form.username) {
      errors.username = 'Username is required'
    } else if (form.username.length < 3) {
      errors.username = 'Username must be at least 3 characters'
    }
  } else if (field === 'email') {
    if (!form.email) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Please enter a valid email address'
    }
  } else if (field === 'password') {
    if (!form.password) {
      errors.password = 'Password is required'
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
  } else if (field === 'confirmPassword') {
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
  }
}

function validateForm(): boolean {
  let valid = true
  // Clear all errors
  Object.keys(errors).forEach((key) => (errors[key as keyof typeof errors] = ''))

  // Validate each field
  if (!form.username) {
    errors.username = 'Username is required'
    valid = false
  } else if (form.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
    valid = false
  }

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
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    valid = false
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    valid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    valid = false
  }

  if (!agreeTerms.value) {
    errors.terms = 'You must agree to the Terms of Service and Privacy Policy'
    valid = false
  }

  return valid
}

async function handleSignup() {
  if (!validateForm()) return

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
    let errorMessage = 'Failed to create account'

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
      summary: 'Signup Failed',
      detail: errorMessage,
      life: 4000,
    })
  } finally {
    isLoading.value = false
  }
}
</script>
