import axios from 'axios'
import type { AxiosInstance } from 'axios'

// const API_BASE_URL = 'http://localhost:3000/api'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  // Add token to every request
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Handle 401 responses
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('auth_token')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    },
  )

  return instance
}

export const api = createApiInstance()
