import api from '@/lib/api'

export interface LoginPayload {
  username: string
  password: string
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<{ success: boolean; data: { token: string; user: unknown } }>('/auth/login', payload),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
}
