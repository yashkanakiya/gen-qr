// stores/authStore.ts
import { ref } from 'vue'
import { api } from '../services/api'  // Import shared api instance

export interface User {
  id: number
  username: string
  email: string
}

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

// Remove the local api creation - use the imported one
// const api = axios.create({ ... })  // DELETE THIS LINE

// Remove interceptors from here since they're already in the shared api
// The interceptors are now handled in services/api.ts

// Reactive state
export const currentUser = ref<User | null>(null)
export const isAuthenticated = ref<boolean>(false)
export const isAuthLoading = ref<boolean>(true)

// Error handling
const handleApiError = (error: unknown): never => {
  if (error instanceof Error) {
    throw new Error(error.message || 'An error occurred')
  }
  throw error
}

// Load user from token
export async function loadUser(): Promise<boolean> {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    isAuthenticated.value = false
    currentUser.value = null
    isAuthLoading.value = false
    return false
  }

  try {
    const response = await api.get<{ user: User }>('/auth/me')
    currentUser.value = response.data.user
    isAuthenticated.value = true
    isAuthLoading.value = false
    return true
  } catch (error) {
    console.error('Failed to load user:', error)
    // Only clear token if it's an authentication error
    if (error instanceof Error && error.message.includes('401')) {
      localStorage.removeItem('auth_token')
      isAuthenticated.value = false
      currentUser.value = null
    }
    isAuthLoading.value = false
    return false
  }
}

// Login
export async function login(data: LoginData): Promise<void> {
  try {
    const response = await api.post<{ token: string; user: User }>('/auth/login', data)
    const { token, user } = response.data
    
    localStorage.setItem('auth_token', token)
    currentUser.value = user
    isAuthenticated.value = true
  } catch (error) {
    // Re-throw the error so it can be handled in the component
    throw error
  }
}

// Signup
export async function signup(data: SignupData): Promise<void> {
  try {
    const response = await api.post<{ token: string; user: User }>('/auth/signup', data)
    const { token, user } = response.data
    
    localStorage.setItem('auth_token', token)
    currentUser.value = user
    isAuthenticated.value = true
  } catch (error) {
    // Re-throw the error so it can be handled in the component
    throw error
  }
}

// Logout
export function logout(): void {
  localStorage.removeItem('auth_token')
  currentUser.value = null
  isAuthenticated.value = false
}