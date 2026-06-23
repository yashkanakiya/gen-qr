// stores/authStore.ts
import { ref } from 'vue'
import { api } from '../services/api' // Import shared api instance

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

// Reactive state
export const currentUser = ref<User | null>(null)
export const isAuthenticated = ref<boolean>(false)
export const isAuthLoading = ref<boolean>(true)

// 🆕 Profile image (stored as data URL in localStorage)
export const profileImage = ref<string | null>(localStorage.getItem('profile_image') || null)

// 🆕 Update profile image (persist to localStorage)
export function setProfileImage(image: string | null) {
  profileImage.value = image
  if (image) {
    localStorage.setItem('profile_image', image)
  } else {
    localStorage.removeItem('profile_image')
  }
}

// 🆕 Update username (frontend only – no API call yet)
export function updateUserUsername(newUsername: string) {
  if (currentUser.value) {
    currentUser.value.username = newUsername
    // Optionally persist in localStorage for refresh survival
    // (but token still has old username – phase 2 will sync with backend)
  }
}

export async function updateUserProfile(username: string, avatar: string | null): Promise<void> {
  try {
    const response = await api.put<{ user: User & { avatar?: string } }>('/auth/profile', {
      username,
      avatar,
    })
    const updatedUser = response.data.user
    // Update reactive state
    if (currentUser.value) {
      currentUser.value.username = updatedUser.username
      // Also update avatar in store and localStorage
      if (updatedUser.avatar) {
        setProfileImage(updatedUser.avatar)
      } else {
        setProfileImage(null)
      }
    }
  } catch (error) {
    // Re-throw for component to handle
    throw error
  }
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
    const response = await api.get<{ user: User & { avatar?: string } }>('/auth/me')
    currentUser.value = response.data.user
    isAuthenticated.value = true
    isAuthLoading.value = false
    if (response.data.user.avatar) {
      setProfileImage(response.data.user.avatar)
    } else {
      setProfileImage(null)
    }
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
    const response = await api.post<{ token: string; user: User & { avatar?: string } }>(
      '/auth/login',
      data,
    )
    const { token, user } = response.data

    localStorage.setItem('auth_token', token)
    currentUser.value = user
    isAuthenticated.value = true
    if (user.avatar) {
      setProfileImage(user.avatar)
    } else {
      setProfileImage(null)
    }
  } catch (error) {
    // Re-throw the error so it can be handled in the component
    throw error
  }
}

// Signup
export async function signup(data: SignupData): Promise<void> {
  try {
    const response = await api.post<{ token: string; user: User & { avatar?: string } }>(
      '/auth/signup',
      data,
    )
    const { token, user } = response.data

    localStorage.setItem('auth_token', token)
    currentUser.value = user
    isAuthenticated.value = true
    if (user.avatar) {
      setProfileImage(user.avatar)
    } else {
      setProfileImage(null)
    }
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
