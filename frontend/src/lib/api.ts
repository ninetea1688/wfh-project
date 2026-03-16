import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:4000') + '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
